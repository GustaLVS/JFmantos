alter table public.orders
  add column if not exists customer_document text,
  add column if not exists payment_method text,
  add column if not exists payment_provider text default 'mercado_pago',
  add column if not exists payment_provider_order_id text,
  add column if not exists payment_provider_payment_id text,
  add column if not exists paid_at timestamptz,
  add column if not exists cancelled_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

alter table public.order_items
  add column if not exists team text,
  add column if not exists category text,
  add column if not exists season text,
  add column if not exists image text;

alter table public.payments
  add column if not exists provider text not null default 'mercado_pago',
  add column if not exists method text,
  add column if not exists provider_payment_id text,
  add column if not exists provider_preference_id text,
  add column if not exists provider_status text,
  add column if not exists provider_status_detail text,
  add column if not exists payment_url text,
  add column if not exists qr_code text,
  add column if not exists qr_code_base64 text,
  add column if not exists barcode text,
  add column if not exists boleto_url text,
  add column if not exists raw_response jsonb,
  add column if not exists updated_at timestamptz not null default now();

notify pgrst, 'reload schema';
