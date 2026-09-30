-- MoneyFollows — aggregation & query functions (called via supabase.rpc)
-- All are SECURITY INVOKER: they run as the calling user, so RLS still applies.
-- The explicit `user_id = auth.uid()` filters let Postgres use the user_id indexes.

-- ─────────────────────────────────────────────── totals by type for a period
create or replace function public.period_summary(p_from date, p_to date)
returns table (type public.transaction_type, total numeric, count bigint)
language sql stable
set search_path = ''
as $$
  select t.type, coalesce(sum(t.amount), 0), count(*)
  from public.transactions t
  where t.user_id = (select auth.uid())
    and t.transaction_date between p_from and p_to
  group by t.type
$$;

-- ─────────────────────────────────────────────── totals per category
create or replace function public.category_totals(
  p_from date,
  p_to date,
  p_type public.transaction_type default 'EXPENSE',
  p_purchase_only boolean default false
)
returns table (category_id uuid, name text, icon text, color text, total numeric, count bigint)
language sql stable
set search_path = ''
as $$
  select c.id, c.name, c.icon, c.color, sum(t.amount), count(*)
  from public.transactions t
  join public.categories c on c.id = t.category_id
  where t.user_id = (select auth.uid())
    and t.type = p_type
    and t.transaction_date between p_from and p_to
    and (not p_purchase_only or t.is_purchase)
  group by c.id, c.name, c.icon, c.color
  order by sum(t.amount) desc
$$;

-- ─────────────────────────────────────────────── totals per subcategory
create or replace function public.subcategory_totals(p_category_id uuid, p_from date, p_to date)
returns table (subcategory_id uuid, name text, total numeric, count bigint)
language sql stable
set search_path = ''
as $$
  select s.id, coalesce(s.name, 'Uncategorised'), sum(t.amount), count(*)
  from public.transactions t
  left join public.subcategories s on s.id = t.subcategory_id
  where t.user_id = (select auth.uid())
    and t.category_id = p_category_id
    and t.transaction_date between p_from and p_to
  group by s.id, s.name
  order by sum(t.amount) desc
$$;

-- ─────────────────────────────────────────────── per-day totals (charts, calendar)
create or replace function public.daily_totals(
  p_from date,
  p_to date,
  p_type public.transaction_type default 'EXPENSE'
)
returns table (day date, total numeric, count bigint)
language sql stable
set search_path = ''
as $$
  select t.transaction_date, sum(t.amount), count(*)
  from public.transactions t
  where t.user_id = (select auth.uid())
    and t.type = p_type
    and t.transaction_date between p_from and p_to
  group by t.transaction_date
  order by t.transaction_date
$$;

-- ─────────────────────────────────────────────── per-month totals (trends, MoM)
create or replace function public.monthly_totals(p_from date, p_to date)
returns table (month date, income numeric, expense numeric, investment numeric)
language sql stable
set search_path = ''
as $$
  select
    date_trunc('month', t.transaction_date)::date,
    coalesce(sum(t.amount) filter (where t.type = 'INCOME'), 0),
    coalesce(sum(t.amount) filter (where t.type = 'EXPENSE'), 0),
    coalesce(sum(t.amount) filter (where t.type = 'INVESTMENT'), 0)
  from public.transactions t
  where t.user_id = (select auth.uid())
    and t.transaction_date between p_from and p_to
  group by 1
  order by 1
$$;

-- ─────────────────────────────────────────────── search + filter + totals in one call
-- Returns one page of rows; every row also carries totals for the WHOLE filtered set.
create or replace function public.find_transactions(
  p_query text default null,
  p_from date default null,
  p_to date default null,
  p_type public.transaction_type default null,
  p_category_id uuid default null,
  p_subcategory_id uuid default null,
  p_min numeric default null,
  p_max numeric default null,
  p_purchase_only boolean default false,
  p_limit integer default 30,
  p_offset integer default 0
)
returns table (
  id uuid,
  type public.transaction_type,
  amount numeric,
  transaction_date date,
  description text,
  notes text,
  is_purchase boolean,
  category_id uuid,
  category_name text,
  category_icon text,
  category_color text,
  subcategory_id uuid,
  subcategory_name text,
  created_at timestamptz,
  total_count bigint,
  total_expense numeric,
  total_income numeric,
  total_investment numeric
)
language sql stable
set search_path = ''
as $$
  with q as (
    select nullif(btrim(p_query), '') as term
  )
  select
    t.id, t.type, t.amount, t.transaction_date, t.description, t.notes, t.is_purchase,
    c.id, c.name, c.icon, c.color,
    s.id, s.name,
    t.created_at,
    count(*) over (),
    coalesce(sum(t.amount) filter (where t.type = 'EXPENSE') over (), 0),
    coalesce(sum(t.amount) filter (where t.type = 'INCOME') over (), 0),
    coalesce(sum(t.amount) filter (where t.type = 'INVESTMENT') over (), 0)
  from public.transactions t
  join public.categories c on c.id = t.category_id
  left join public.subcategories s on s.id = t.subcategory_id
  cross join q
  where t.user_id = (select auth.uid())
    and (p_from is null or t.transaction_date >= p_from)
    and (p_to is null or t.transaction_date <= p_to)
    and (p_type is null or t.type = p_type)
    and (p_category_id is null or t.category_id = p_category_id)
    and (p_subcategory_id is null or t.subcategory_id = p_subcategory_id)
    and (p_min is null or t.amount >= p_min)
    and (p_max is null or t.amount <= p_max)
    and (not p_purchase_only or t.is_purchase)
    and (
      q.term is null
      or t.description ilike '%' || q.term || '%'
      or t.notes ilike '%' || q.term || '%'
      or c.name ilike '%' || q.term || '%'
      or s.name ilike '%' || q.term || '%'
    )
  order by t.transaction_date desc, t.created_at desc
  limit least(greatest(p_limit, 1), 200)
  offset greatest(p_offset, 0)
$$;

-- ─────────────────────────────────────────────── recurring transactions
-- First occurrence strictly after p_after, anchored on p_start (so 31 Jan → 28 Feb → 31 Mar).
create or replace function public.recurrence_next(
  p_start date,
  p_after date,
  p_frequency public.recurrence_frequency
)
returns date
language plpgsql immutable
set search_path = ''
as $$
declare
  n integer;
  candidate date;
begin
  if p_after < p_start then
    return p_start;
  end if;

  if p_frequency = 'DAILY' then
    return p_after + 1;
  elsif p_frequency = 'WEEKLY' then
    return p_start + ((floor((p_after - p_start) / 7.0)::integer + 1) * 7);
  elsif p_frequency = 'MONTHLY' then
    n := (extract(year from age(p_after, p_start)) * 12 + extract(month from age(p_after, p_start)))::integer;
    candidate := (p_start + make_interval(months => n))::date;
    while candidate <= p_after loop
      n := n + 1;
      candidate := (p_start + make_interval(months => n))::date;
    end loop;
    return candidate;
  else
    n := extract(year from age(p_after, p_start))::integer;
    candidate := (p_start + make_interval(years => n))::date;
    while candidate <= p_after loop
      n := n + 1;
      candidate := (p_start + make_interval(years => n))::date;
    end loop;
    return candidate;
  end if;
end;
$$;

-- Creates every due transaction for the current user and advances next_run_date.
-- Idempotent and safe to call on every app open; concurrent calls skip locked rows.
create or replace function public.generate_recurring_transactions(p_today date default current_date)
returns integer
language plpgsql
set search_path = ''
as $$
declare
  r record;
  due date;
  created integer := 0;
  guard integer;
begin
  for r in
    select *
    from public.recurring_transactions rt
    where rt.user_id = (select auth.uid())
      and rt.active
      and rt.next_run_date <= p_today
    for update skip locked
  loop
    due := r.next_run_date;
    guard := 0;
    while due <= p_today and (r.end_date is null or due <= r.end_date) and guard < 400 loop
      insert into public.transactions
        (user_id, type, amount, category_id, subcategory_id, transaction_date, description, is_purchase, recurring_id, investment_id)
      values
        (r.user_id, r.type, r.amount, r.category_id, r.subcategory_id, due, r.description, r.is_purchase, r.id, r.investment_id);
      created := created + 1;
      guard := guard + 1;
      due := public.recurrence_next(r.start_date, due, r.frequency);
    end loop;

    update public.recurring_transactions
    set next_run_date = due,
        active = r.end_date is null or due <= r.end_date
    where id = r.id;
  end loop;

  return created;
end;
$$;

-- Only signed-in users may call these (functions are executable by PUBLIC by default).
do $$
declare f text;
begin
  foreach f in array array[
    'public.period_summary(date, date)',
    'public.category_totals(date, date, public.transaction_type, boolean)',
    'public.subcategory_totals(uuid, date, date)',
    'public.daily_totals(date, date, public.transaction_type)',
    'public.monthly_totals(date, date)',
    'public.find_transactions(text, date, date, public.transaction_type, uuid, uuid, numeric, numeric, boolean, integer, integer)',
    'public.generate_recurring_transactions(date)'
  ] loop
    execute format('revoke execute on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end $$;
