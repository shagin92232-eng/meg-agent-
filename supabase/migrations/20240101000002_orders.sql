-- Orders + order items
create table orders (
  id             uuid primary key default gen_random_uuid(),
  org_id         uuid not null references organizations on delete cascade,
  order_number   text not null unique,
  customer_id    uuid references customers,
  conversation_id uuid references conversations,
  status         order_status not null default 'pending',
  total_amount   numeric(14,2) not null default 0,
  currency       text not null default 'BDT',
  payment_status payment_status not null default 'pending',
  payment_method text,
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index idx_orders_org      on orders(org_id);
create index idx_orders_status   on orders(org_id, status);
create index idx_orders_customer on orders(customer_id);
create index idx_orders_conv     on orders(conversation_id);
create index idx_orders_created  on orders(org_id, created_at desc);

create table order_items (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references orders on delete cascade,
  product_id  uuid references products,
  product_name text not null,
  quantity     integer not null default 1,
  unit_price   numeric(12,2) not null,
  total_price  numeric(14,2) not null
);
create index idx_order_items_order on order_items(order_id);
