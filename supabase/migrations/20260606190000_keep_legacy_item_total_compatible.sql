alter table public.order_items
  add column if not exists total numeric(10,2),
  add column if not exists total_price numeric(10,2);

update public.order_items
set
  total = coalesce(total, total_price, unit_price * quantity),
  total_price = coalesce(total_price, total, unit_price * quantity)
where total is null or total_price is null;

alter table public.order_items
  alter column total set default 0,
  alter column total_price set default 0;

notify pgrst, 'reload schema';
