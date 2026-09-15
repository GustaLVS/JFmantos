alter table public.orders
  add column if not exists zip text,
  add column if not exists zip_code text;

update public.orders
set
  zip = coalesce(zip, zip_code),
  zip_code = coalesce(zip_code, zip)
where zip is null or zip_code is null;

notify pgrst, 'reload schema';
