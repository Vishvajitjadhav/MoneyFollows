-- Largest transactions in a period (monthly review, PDF report, purchases).
create or replace function public.top_transactions(
  p_from date,
  p_to date,
  p_type public.transaction_type default 'EXPENSE',
  p_purchase_only boolean default false,
  p_limit integer default 5
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
  created_at timestamptz
)
language sql stable
set search_path = ''
as $$
  select t.id, t.type, t.amount, t.transaction_date, t.description, t.notes, t.is_purchase,
         c.id, c.name, c.icon, c.color, s.id, s.name, t.created_at
  from public.transactions t
  join public.categories c on c.id = t.category_id
  left join public.subcategories s on s.id = t.subcategory_id
  where t.user_id = (select auth.uid())
    and t.type = p_type
    and t.transaction_date between p_from and p_to
    and (not p_purchase_only or t.is_purchase)
  order by t.amount desc, t.transaction_date desc
  limit least(greatest(p_limit, 1), 50)
$$;

revoke execute on function public.top_transactions(date, date, public.transaction_type, boolean, integer) from public, anon;
grant execute on function public.top_transactions(date, date, public.transaction_type, boolean, integer) to authenticated;
