-- MoneyFollows — Row Level Security
-- A signed-in user can only see and change their own rows. Anonymous users get nothing.
-- `(select auth.uid())` is evaluated once per statement instead of once per row.

alter table public.profiles                  enable row level security;
alter table public.categories                enable row level security;
alter table public.subcategories             enable row level security;
alter table public.investments               enable row level security;
alter table public.recurring_transactions    enable row level security;
alter table public.transactions              enable row level security;
alter table public.custom_field_definitions  enable row level security;
alter table public.transaction_custom_fields enable row level security;
alter table public.budgets                   enable row level security;
alter table public.financial_goals           enable row level security;
alter table public.monthly_plans             enable row level security;

-- profiles: keyed by id (= auth.users.id). Rows are created by the signup trigger.
create policy "profiles_select_own" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy "profiles_update_own" on public.profiles
  for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- Every other table: full CRUD on own rows only.
do $$
declare t text;
begin
  foreach t in array array[
    'categories', 'subcategories', 'investments', 'recurring_transactions', 'transactions',
    'custom_field_definitions', 'transaction_custom_fields', 'budgets', 'financial_goals',
    'monthly_plans'
  ] loop
    execute format(
      'create policy %I on public.%I for select to authenticated using ((select auth.uid()) = user_id)',
      t || '_select_own', t);
    execute format(
      'create policy %I on public.%I for insert to authenticated with check ((select auth.uid()) = user_id)',
      t || '_insert_own', t);
    execute format(
      'create policy %I on public.%I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)',
      t || '_update_own', t);
    execute format(
      'create policy %I on public.%I for delete to authenticated using ((select auth.uid()) = user_id)',
      t || '_delete_own', t);
  end loop;
end $$;

-- Defence in depth: anon has no business with app tables at all.
revoke all on all tables in schema public from anon;
