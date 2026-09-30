-- MoneyFollows — per-user defaults
-- On signup: create the profile and seed default categories/subcategories.
-- Keep in sync with lib/constants/categories.ts.

create or replace function public.seed_default_categories(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  cat record;
  new_id uuid;
  sub text;
  i integer;
begin
  for cat in
    select * from (values
      -- type, name, icon, color, sort, subcategories
      ('EXPENSE', 'Food',          'food',          'orange', 1,  array['Lunch','Dinner','Breakfast','Milk','Snacks','Restaurant','Other']),
      ('EXPENSE', 'Transport',     'transport',     'sky',    2,  array['Petrol','Bike Service','Car Service','Cab','Bus','Parking','Other']),
      ('EXPENSE', 'Housing',       'housing',       'indigo', 3,  array['Rent','Maintenance','Other']),
      ('EXPENSE', 'Bills',         'bills',         'slate',  4,  array['Electricity','Internet','Mobile','Insurance','Other']),
      ('EXPENSE', 'Family',        'family',        'coral',  5,  array['Parents','Brother','Sister','Family','Other']),
      ('EXPENSE', 'Lifestyle',     'lifestyle',     'pink',   6,  array['Gym','Skincare','Haircut','Clothing','Accessories','Other']),
      ('EXPENSE', 'Shopping',      'shopping',      'violet', 7,  array['Electronics','Watch','Shoes','Accessories','Other']),
      ('EXPENSE', 'Entertainment', 'entertainment', 'amber',  8,  array['Movie','OTT','Games','Events','Other']),
      ('EXPENSE', 'Health',        'health',        'green',  9,  array['Medicine','Doctor','Other']),
      ('EXPENSE', 'Education',     'education',     'blue',   10, array['Course','Books','Certification','Other']),
      ('EXPENSE', 'Other',         'other',         'slate',  11, array[]::text[]),
      ('INCOME',  'Salary',        'salary',        'green',  1,  array[]::text[]),
      ('INCOME',  'Freelance',     'freelance',     'teal',   2,  array[]::text[]),
      ('INCOME',  'Side income',   'side-income',   'lime',   3,  array[]::text[]),
      ('INCOME',  'Bonus',         'bonus',         'amber',  4,  array[]::text[]),
      ('INCOME',  'Gift',          'gift',          'pink',   5,  array[]::text[]),
      ('INCOME',  'Refund',        'refund',        'sky',    6,  array[]::text[]),
      ('INCOME',  'Other',         'other',         'slate',  7,  array[]::text[]),
      ('INVESTMENT', 'SIP',         'sip',          'indigo', 1,  array[]::text[]),
      ('INVESTMENT', 'Mutual Fund', 'mutual-fund',  'violet', 2,  array[]::text[]),
      ('INVESTMENT', 'Stocks',      'stocks',       'green',  3,  array[]::text[]),
      ('INVESTMENT', 'PPF',         'ppf',          'blue',   4,  array[]::text[]),
      ('INVESTMENT', 'FD',          'fd',           'teal',   5,  array[]::text[]),
      ('INVESTMENT', 'Other',       'other',        'slate',  6,  array[]::text[])
    ) as v(type, name, icon, color, sort_order, subs)
  loop
    new_id := null;
    insert into public.categories (user_id, type, name, icon, color, sort_order, is_system)
    values (p_user_id, cat.type::public.transaction_type, cat.name, cat.icon, cat.color, cat.sort_order, true)
    on conflict do nothing
    returning id into new_id;

    if new_id is not null then
      i := 0;
      foreach sub in array cat.subs loop
        i := i + 1;
        insert into public.subcategories (user_id, category_id, name, sort_order)
        values (p_user_id, new_id, sub, i)
        on conflict do nothing;
      end loop;
    end if;
  end loop;
end;
$$;

-- Only the signup trigger may call this.
revoke execute on function public.seed_default_categories(uuid) from public, anon, authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''))
  on conflict (id) do nothing;

  perform public.seed_default_categories(new.id);
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill any users created before this migration.
do $$
declare u record;
begin
  for u in select id, raw_user_meta_data from auth.users loop
    insert into public.profiles (id, full_name)
    values (u.id, nullif(btrim(u.raw_user_meta_data ->> 'full_name'), ''))
    on conflict (id) do nothing;
    if not exists (select 1 from public.categories where user_id = u.id) then
      perform public.seed_default_categories(u.id);
    end if;
  end loop;
end $$;
