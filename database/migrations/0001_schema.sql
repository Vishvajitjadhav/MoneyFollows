-- MoneyFollows — core schema
-- Every user-owned table has user_id → auth.users. Child rows reference their
-- parent through composite (id, user_id) foreign keys, so a row can never point
-- at another user's category/subcategory/transaction, even before RLS applies.

-- ─────────────────────────────────────────────────────────────── enums
create type public.transaction_type as enum ('EXPENSE', 'INCOME', 'INVESTMENT');
create type public.recurrence_frequency as enum ('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY');
create type public.investment_type as enum ('SIP', 'MUTUAL_FUND', 'STOCKS', 'PPF', 'FD', 'OTHER');
create type public.investment_frequency as enum ('ONE_TIME', 'DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY');
create type public.custom_field_type as enum ('TEXT', 'NUMBER', 'DROPDOWN', 'BOOLEAN', 'DATE');

-- ─────────────────────────────────────────────────────────────── helpers
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ─────────────────────────────────────────────────────────────── profiles
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text check (char_length(full_name) <= 80),
  currency    char(3) not null default 'INR' check (currency ~ '^[A-Z]{3}$'),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────── categories
create table public.categories (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  type         public.transaction_type not null,
  name         text not null check (char_length(btrim(name)) between 1 and 40),
  icon         text not null default 'other' check (char_length(icon) <= 40),
  color        text not null default 'slate' check (char_length(color) <= 20),
  sort_order   integer not null default 0,
  is_system    boolean not null default false,
  archived_at  timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (id, user_id),
  unique (id, user_id, type)
);
create unique index categories_user_type_name_key on public.categories (user_id, type, lower(name));
create index categories_user_idx on public.categories (user_id, type, sort_order);

create table public.subcategories (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  category_id  uuid not null,
  name         text not null check (char_length(btrim(name)) between 1 and 40),
  sort_order   integer not null default 0,
  archived_at  timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (id, user_id),
  unique (id, user_id, category_id),
  foreign key (category_id, user_id) references public.categories (id, user_id) on delete cascade
);
create unique index subcategories_category_name_key on public.subcategories (category_id, lower(name));
create index subcategories_user_idx on public.subcategories (user_id);

-- ─────────────────────────────────────────────────────────────── investments
create table public.investments (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name        text not null check (char_length(btrim(name)) between 1 and 80),
  type        public.investment_type not null,
  amount      numeric(14, 2) not null check (amount > 0),
  frequency   public.investment_frequency not null default 'MONTHLY',
  start_date  date not null default current_date,
  end_date    date,
  notes       text check (char_length(notes) <= 1000),
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (id, user_id),
  check (end_date is null or end_date >= start_date)
);
create index investments_user_idx on public.investments (user_id, active);

-- ─────────────────────────────────────────────────────────────── recurring
create table public.recurring_transactions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users (id) on delete cascade,
  type            public.transaction_type not null,
  amount          numeric(14, 2) not null check (amount > 0),
  category_id     uuid not null,
  subcategory_id  uuid,
  description     text check (char_length(description) <= 200),
  frequency       public.recurrence_frequency not null,
  start_date      date not null,
  end_date        date,
  next_run_date   date not null,
  is_purchase     boolean not null default false,
  investment_id   uuid,
  active          boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (id, user_id),
  check (end_date is null or end_date >= start_date),
  foreign key (category_id, user_id, type) references public.categories (id, user_id, type),
  foreign key (subcategory_id, user_id, category_id) references public.subcategories (id, user_id, category_id),
  foreign key (investment_id, user_id) references public.investments (id, user_id) on delete set null (investment_id)
);
create index recurring_due_idx on public.recurring_transactions (user_id, next_run_date) where active;

-- ─────────────────────────────────────────────────────────────── transactions
create table public.transactions (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null default auth.uid() references auth.users (id) on delete cascade,
  type              public.transaction_type not null,
  amount            numeric(14, 2) not null check (amount > 0 and amount < 1000000000000),
  category_id       uuid not null,
  subcategory_id    uuid,
  transaction_date  date not null default current_date,
  description       text check (char_length(description) <= 200),
  notes             text check (char_length(notes) <= 1000),
  custom_metadata   jsonb not null default '{}'::jsonb check (jsonb_typeof(custom_metadata) = 'object'),
  is_purchase       boolean not null default false,
  recurring_id      uuid,
  investment_id     uuid,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (id, user_id),
  -- category must belong to the same user AND match the transaction type
  foreign key (category_id, user_id, type) references public.categories (id, user_id, type),
  -- subcategory must belong to the same user AND to the chosen category
  foreign key (subcategory_id, user_id, category_id) references public.subcategories (id, user_id, category_id),
  foreign key (recurring_id, user_id) references public.recurring_transactions (id, user_id) on delete set null (recurring_id),
  foreign key (investment_id, user_id) references public.investments (id, user_id) on delete set null (investment_id)
);
create index transactions_user_date_idx on public.transactions (user_id, transaction_date desc, created_at desc);
create index transactions_user_type_date_idx on public.transactions (user_id, type, transaction_date);
create index transactions_category_idx on public.transactions (category_id, transaction_date);
create index transactions_subcategory_idx on public.transactions (subcategory_id) where subcategory_id is not null;
create index transactions_purchase_idx on public.transactions (user_id, transaction_date) where is_purchase;
create index transactions_recurring_idx on public.transactions (recurring_id) where recurring_id is not null;
create index transactions_investment_idx on public.transactions (investment_id) where investment_id is not null;

-- ─────────────────────────────────────────────────────────────── custom fields
create table public.custom_field_definitions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name        text not null check (char_length(btrim(name)) between 1 and 40),
  field_type  public.custom_field_type not null,
  -- DROPDOWN choices: ["UPI", "Card", "Cash"]
  options     jsonb not null default '[]'::jsonb check (jsonb_typeof(options) = 'array'),
  sort_order  integer not null default 0,
  archived_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (id, user_id)
);
create unique index custom_fields_user_name_key on public.custom_field_definitions (user_id, lower(name));

create table public.transaction_custom_fields (
  transaction_id  uuid not null,
  field_id        uuid not null,
  user_id         uuid not null default auth.uid() references auth.users (id) on delete cascade,
  value           jsonb not null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  primary key (transaction_id, field_id),
  foreign key (transaction_id, user_id) references public.transactions (id, user_id) on delete cascade,
  foreign key (field_id, user_id) references public.custom_field_definitions (id, user_id) on delete cascade
);
create index transaction_custom_fields_field_idx on public.transaction_custom_fields (field_id);
create index transaction_custom_fields_user_idx on public.transaction_custom_fields (user_id);

-- ─────────────────────────────────────────────────────────────── budgets
create table public.budgets (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  category_id  uuid not null,
  month        date not null check (extract(day from month) = 1),
  amount       numeric(14, 2) not null check (amount > 0),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (user_id, category_id, month),
  foreign key (category_id, user_id) references public.categories (id, user_id) on delete cascade
);
create index budgets_category_idx on public.budgets (category_id);

-- ─────────────────────────────────────────────────────────────── goals
create table public.financial_goals (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name            text not null check (char_length(btrim(name)) between 1 and 60),
  target_amount   numeric(14, 2) not null check (target_amount > 0),
  current_amount  numeric(14, 2) not null default 0 check (current_amount >= 0),
  target_date     date,
  icon            text not null default 'growth',
  color           text not null default 'green',
  achieved_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index financial_goals_user_idx on public.financial_goals (user_id);

-- ─────────────────────────────────────────────────────────────── monthly plans
create table public.monthly_plans (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users (id) on delete cascade,
  month           date not null check (extract(day from month) = 1),
  monthly_income  numeric(14, 2) not null default 0 check (monthly_income >= 0),
  -- { rent, emi, family_support, investments, goals }
  inputs          jsonb not null default '{}'::jsonb check (jsonb_typeof(inputs) = 'object'),
  -- { needs: 50, lifestyle: 15, family: 10, investments: 15, savings: 5, flexible: 5 }
  allocations     jsonb not null default '{}'::jsonb check (jsonb_typeof(allocations) = 'object'),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (user_id, month)
);

-- ─────────────────────────────────────────────────────────────── updated_at triggers
do $$
declare t text;
begin
  foreach t in array array[
    'profiles', 'categories', 'subcategories', 'investments', 'recurring_transactions',
    'transactions', 'custom_field_definitions', 'transaction_custom_fields', 'budgets',
    'financial_goals', 'monthly_plans'
  ] loop
    execute format(
      'create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()', t
    );
  end loop;
end $$;
