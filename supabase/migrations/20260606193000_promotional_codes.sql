create table if not exists public.promotional_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  description text,
  discount_type text not null check (discount_type in ('percent', 'fixed')),
  value numeric(10,2) not null check (value > 0),
  minimum_order numeric(10,2) not null default 0,
  maximum_discount numeric(10,2),
  usage_limit integer,
  used_count integer not null default 0,
  starts_at timestamptz,
  expires_at timestamptz,
  active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists promotional_codes_code_upper_idx
  on public.promotional_codes (upper(code));

alter table public.orders
  add column if not exists promotional_code_id uuid references public.promotional_codes(id) on delete set null,
  add column if not exists promo_code text,
  add column if not exists promo_discount numeric(10,2) not null default 0;

create table if not exists public.promo_redemptions (
  id uuid primary key default gen_random_uuid(),
  promotional_code_id uuid not null references public.promotional_codes(id) on delete cascade,
  order_id uuid not null unique references public.orders(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  discount_amount numeric(10,2) not null default 0,
  created_at timestamptz not null default now()
);

alter table public.promotional_codes enable row level security;
alter table public.promo_redemptions enable row level security;

drop policy if exists "admins can view promotional codes" on public.promotional_codes;
create policy "admins can view promotional codes"
on public.promotional_codes for select
to authenticated
using (public.is_admin());

drop policy if exists "admins can create promotional codes" on public.promotional_codes;
create policy "admins can create promotional codes"
on public.promotional_codes for insert
to authenticated
with check (public.is_admin() and created_by = auth.uid());

drop policy if exists "admins can update promotional codes" on public.promotional_codes;
create policy "admins can update promotional codes"
on public.promotional_codes for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "admins can delete promotional codes" on public.promotional_codes;
create policy "admins can delete promotional codes"
on public.promotional_codes for delete
to authenticated
using (public.is_admin());

drop policy if exists "customers can view own promo redemptions" on public.promo_redemptions;
create policy "customers can view own promo redemptions"
on public.promo_redemptions for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

notify pgrst, 'reload schema';
