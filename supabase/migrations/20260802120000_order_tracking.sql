alter table public.orders
  add column if not exists tracking_code text,
  add column if not exists tracking_sent_at timestamptz,
  add column if not exists tracking_carrier text default 'Correios';

notify pgrst, 'reload schema';
