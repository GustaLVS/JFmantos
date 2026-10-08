alter table public.order_items
  add column if not exists personalization_name text,
  add column if not exists personalization_number text;

alter table public.order_items
  add constraint order_items_personalization_name_check
    check (personalization_name is null or char_length(personalization_name) between 1 and 20),
  add constraint order_items_personalization_number_check
    check (personalization_number is null or personalization_number ~ '^[0-9]{1,2}$');

notify pgrst, 'reload schema';
