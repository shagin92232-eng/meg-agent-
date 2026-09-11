-- RAG: semantic search over enabled KB chunks for a given org.
-- Returns cosine similarity (1 - distance), only rows above the threshold.
create or replace function match_kb_chunks(
  p_org_id      uuid,
  p_query_vec   vector(768),
  p_threshold   float default 0.4,
  p_match_count int   default 8
)
returns table (
  id          uuid,
  document_id uuid,
  content     text,
  heading     text,
  metadata    jsonb,
  similarity  float
)
language plpgsql
as $$
begin
  return query
  select k.id, k.document_id, k.content, k.heading, k.metadata,
         (1 - (k.embedding <=> p_query_vec))::float as similarity
  from kb_chunks k
  join kb_documents d on d.id = k.document_id
  where k.org_id = p_org_id
    and d.enabled
    and d.status = 'ready'
    and k.embedding is not null
    and (1 - (k.embedding <=> p_query_vec)) > p_threshold
  order by k.embedding <=> p_query_vec
  limit p_match_count;
end;
$$;

-- Semantic search over enabled products (product knowledge vectors).
create or replace function match_products(
  p_org_id    uuid,
  p_query_vec vector(768),
  p_threshold float default 0.4,
  p_match_count int default 10
)
returns table (
  id          uuid,
  name        text,
  description text,
  price       numeric,
  currency    text,
  category    text,
  image_url   text,
  similarity  float
)
language plpgsql
as $$
begin
  return query
  select p.id, p.name, p.description, p.price, p.currency, p.category, p.image_url,
         (1 - (p.embedding <=> p_query_vec))::float as similarity
  from products p
  where p.org_id = p_org_id
    and p.is_enabled
    and p.embedding is not null
    and (1 - (p.embedding <=> p_query_vec)) > p_threshold
  order by p.embedding <=> p_query_vec
  limit p_match_count;
end;
$$;

-- Helper: resolve the org for the authenticated agent (used by RLS)
create or replace function current_org_id() returns uuid as $$
  select org_id from profiles where id = auth.uid()
$$ language sql stable;

-- ─────────────────────────────────────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────────────────────────────────────
alter table organizations   enable row level security;
alter table profiles        enable row level security;
alter table meta_connections enable row level security;
alter table customers       enable row level security;
alter table conversations   enable row level security;
alter table messages        enable row level security;
alter table products        enable row level security;
alter table orders          enable row level security;
alter table order_items     enable row level security;
alter table kb_documents    enable row level security;
alter table kb_chunks       enable row level security;
alter table settings        enable row level security;
alter table notifications   enable row level security;

create policy "profile read"    on profiles        for select using (id = auth.uid());
create policy "profile update"  on profiles        for update using (id = auth.uid());
create policy "org members"     on organizations   for all using (id = current_org_id());
create policy "meta_org"        on meta_connections for all using (org_id = current_org_id());
create policy "customers_org"   on customers       for all using (org_id = current_org_id());
create policy "conversations_org" on conversations for all using (org_id = current_org_id());
create policy "messages_read"   on messages        for select using (org_id = current_org_id());
create policy "messages_write"   on messages       for insert with check (org_id = current_org_id());
create policy "products_org"     on products       for all using (org_id = current_org_id());
create policy "orders_org"       on orders         for all using (org_id = current_org_id());
create policy "order_items_org"  on order_items    for all using (order_id in (select id from orders where org_id = current_org_id()));
create policy "kb_docs_org"      on kb_documents   for all using (org_id = current_org_id());
create policy "kb_chunks_org"    on kb_chunks      for all using (org_id = current_org_id());
create policy "settings_org"     on settings       for all using (org_id = current_org_id());
create policy "notifications_org" on notifications for all using (org_id = current_org_id());

-- Realtime subscriptions honor RLS automatically (supabase realtime).
