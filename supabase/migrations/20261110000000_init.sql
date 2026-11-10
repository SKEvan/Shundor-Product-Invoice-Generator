-- =============================================================================
-- Shundor Product — invoice database
--
-- Run this once in Supabase Dashboard → SQL Editor (or `supabase db push`).
--
-- Tables
--   invoice_counters  one row per month, holds the last serial used (SP-YYMM-NNN)
--   invoices          one row per invoice (customer, charges, totals)
--   invoice_items     the products on each invoice
--
-- API functions (called from the app with supabase.rpc)
--   create_invoice(p_invoice, p_items)        allocates the next monthly number
--   update_invoice(p_id, p_invoice, p_items)  edits an invoice, keeps its number
--
-- Helpers live in the `private` schema, which the public API does not expose.
-- =============================================================================

create schema if not exists private;

-- -----------------------------------------------------------------------------
-- Tables
-- -----------------------------------------------------------------------------

create table public.invoice_counters (
  period      text primary key check (period ~ '^[0-9]{4}$'), -- 'YYMM', e.g. '2611'
  last_serial integer not null default 0 check (last_serial >= 0)
);

create table public.invoices (
  id               uuid primary key default gen_random_uuid(),
  invoice_no       text not null unique,                 -- 'SP-2611-001'
  period           text not null,                        -- 'YYMM' (Dhaka time)
  serial           integer not null check (serial > 0),  -- resets every month

  customer_name    text not null,
  customer_phone   text not null,
  customer_address text not null default '',
  customer_thana   text not null default '',

  delivery_zone    text not null check (delivery_zone in ('inside_dhaka', 'outside_dhaka')),
  delivery_charge  numeric(12, 2) not null default 0 check (delivery_charge >= 0),
  discount         numeric(12, 2) not null default 0 check (discount >= 0),
  advance_paid     numeric(12, 2) not null default 0 check (advance_paid >= 0),
  advance_method   text not null default 'bkash' check (advance_method in ('bkash', 'nagad', 'none')),

  -- Calculated by private.recalculate_totals(); never trust the client for these.
  subtotal         numeric(12, 2) not null default 0,
  total            numeric(12, 2) not null default 0,
  amount_due       numeric(12, 2) not null default 0,

  note             text not null default '',
  raw_order_text   text not null default '',             -- what the owner pasted

  created_by       uuid default auth.uid() references auth.users (id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  unique (period, serial)
);

create index invoices_created_at_idx on public.invoices (created_at desc);

create table public.invoice_items (
  id           uuid primary key default gen_random_uuid(),
  invoice_id   uuid not null references public.invoices (id) on delete cascade,
  position     smallint not null,
  product_name text not null check (length(trim(product_name)) > 0),
  color        text not null default '',
  quantity     integer not null check (quantity > 0),
  unit_price   numeric(12, 2) not null check (unit_price >= 0),
  line_total   numeric(12, 2) generated always as (quantity * unit_price) stored
);

create index invoice_items_invoice_id_idx on public.invoice_items (invoice_id, position);

-- -----------------------------------------------------------------------------
-- Keep updated_at fresh
-- -----------------------------------------------------------------------------

create function private.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger invoices_touch_updated_at
before update on public.invoices
for each row execute function private.touch_updated_at();

-- -----------------------------------------------------------------------------
-- Row Level Security: only a signed-in user (the owner) can read or write.
-- Sign-ups are disabled in the dashboard, so the owner is the only user.
-- -----------------------------------------------------------------------------

alter table public.invoice_counters enable row level security;
alter table public.invoices         enable row level security;
alter table public.invoice_items    enable row level security;

create policy "Owner full access" on public.invoice_counters
  for all to authenticated using (true) with check (true);

create policy "Owner full access" on public.invoices
  for all to authenticated using (true) with check (true);

create policy "Owner full access" on public.invoice_items
  for all to authenticated using (true) with check (true);

-- -----------------------------------------------------------------------------
-- Private helpers
-- -----------------------------------------------------------------------------

-- Replaces all items of an invoice with the given JSON array:
-- [{ "product_name": "...", "color": "...", "quantity": 1, "unit_price": 450 }, ...]
create function private.replace_items(p_invoice_id uuid, p_items jsonb)
returns void
language plpgsql
set search_path = ''
as $$
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'An invoice needs at least one item';
  end if;

  delete from public.invoice_items where invoice_id = p_invoice_id;

  insert into public.invoice_items (invoice_id, position, product_name, color, quantity, unit_price)
  select
    p_invoice_id,
    item.ordinality::smallint,
    trim(item.value ->> 'product_name'),
    coalesce(trim(item.value ->> 'color'), ''),
    (item.value ->> 'quantity')::integer,
    (item.value ->> 'unit_price')::numeric
  from jsonb_array_elements(p_items) with ordinality as item;
end;
$$;

-- Subtotal = Σ line totals; Total = subtotal + delivery − discount;
-- Amount due (cash on delivery) = total − advance, never below zero.
create function private.recalculate_totals(p_invoice_id uuid)
returns void
language plpgsql
set search_path = ''
as $$
begin
  update public.invoices i
  set subtotal   = s.subtotal,
      total      = s.subtotal + i.delivery_charge - i.discount,
      amount_due = greatest(s.subtotal + i.delivery_charge - i.discount - i.advance_paid, 0)
  from (
    select coalesce(sum(line_total), 0) as subtotal
    from public.invoice_items
    where invoice_id = p_invoice_id
  ) s
  where i.id = p_invoice_id;
end;
$$;

-- The invoice as JSON, with its items embedded — same shape as
-- `select('*, invoice_items(*)')` so the app can use one mapper for both.
create function private.invoice_json(p_invoice_id uuid)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select to_jsonb(i) || jsonb_build_object(
    'invoice_items',
    coalesce(
      (select jsonb_agg(to_jsonb(it) order by it.position)
       from public.invoice_items it
       where it.invoice_id = i.id),
      '[]'::jsonb
    )
  )
  from public.invoices i
  where i.id = p_invoice_id;
$$;

-- -----------------------------------------------------------------------------
-- Public API
-- -----------------------------------------------------------------------------

-- p_invoice keys: customer_name, customer_phone, customer_address, customer_thana,
-- delivery_zone, delivery_charge, discount, advance_paid, advance_method, note,
-- raw_order_text
create function public.create_invoice(p_invoice jsonb, p_items jsonb)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  v_period text := to_char(now() at time zone 'Asia/Dhaka', 'YYMM');
  v_serial integer;
  v_id     uuid;
begin
  -- Atomic: two devices saving at the same moment still get different numbers.
  insert into public.invoice_counters as c (period, last_serial)
  values (v_period, 1)
  on conflict (period) do update set last_serial = c.last_serial + 1
  returning last_serial into v_serial;

  insert into public.invoices (
    invoice_no, period, serial,
    customer_name, customer_phone, customer_address, customer_thana,
    delivery_zone, delivery_charge, discount, advance_paid, advance_method,
    note, raw_order_text
  )
  values (
    'SP-' || v_period || '-' || lpad(v_serial::text, greatest(3, length(v_serial::text)), '0'),
    v_period,
    v_serial,
    trim(p_invoice ->> 'customer_name'),
    trim(p_invoice ->> 'customer_phone'),
    coalesce(trim(p_invoice ->> 'customer_address'), ''),
    coalesce(trim(p_invoice ->> 'customer_thana'), ''),
    p_invoice ->> 'delivery_zone',
    coalesce((p_invoice ->> 'delivery_charge')::numeric, 0),
    coalesce((p_invoice ->> 'discount')::numeric, 0),
    coalesce((p_invoice ->> 'advance_paid')::numeric, 0),
    coalesce(p_invoice ->> 'advance_method', 'bkash'),
    coalesce(p_invoice ->> 'note', ''),
    coalesce(p_invoice ->> 'raw_order_text', '')
  )
  returning id into v_id;

  perform private.replace_items(v_id, p_items);
  perform private.recalculate_totals(v_id);

  return private.invoice_json(v_id);
end;
$$;

create function public.update_invoice(p_id uuid, p_invoice jsonb, p_items jsonb)
returns jsonb
language plpgsql
set search_path = ''
as $$
begin
  update public.invoices
  set customer_name    = trim(p_invoice ->> 'customer_name'),
      customer_phone   = trim(p_invoice ->> 'customer_phone'),
      customer_address = coalesce(trim(p_invoice ->> 'customer_address'), ''),
      customer_thana   = coalesce(trim(p_invoice ->> 'customer_thana'), ''),
      delivery_zone    = p_invoice ->> 'delivery_zone',
      delivery_charge  = coalesce((p_invoice ->> 'delivery_charge')::numeric, 0),
      discount         = coalesce((p_invoice ->> 'discount')::numeric, 0),
      advance_paid     = coalesce((p_invoice ->> 'advance_paid')::numeric, 0),
      advance_method   = coalesce(p_invoice ->> 'advance_method', 'bkash'),
      note             = coalesce(p_invoice ->> 'note', '')
  where id = p_id;

  if not found then
    raise exception 'Invoice % not found', p_id;
  end if;

  perform private.replace_items(p_id, p_items);
  perform private.recalculate_totals(p_id);

  return private.invoice_json(p_id);
end;
$$;

-- -----------------------------------------------------------------------------
-- Permissions: only signed-in users may call anything.
-- -----------------------------------------------------------------------------

grant usage on schema private to authenticated;
grant execute on all functions in schema private to authenticated;

revoke execute on function public.create_invoice(jsonb, jsonb)      from public, anon;
revoke execute on function public.update_invoice(uuid, jsonb, jsonb) from public, anon;
grant  execute on function public.create_invoice(jsonb, jsonb)      to authenticated;
grant  execute on function public.update_invoice(uuid, jsonb, jsonb) to authenticated;
