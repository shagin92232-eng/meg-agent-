-- Knowledge base: documents + vector chunks (pgvector)
create table kb_documents (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references organizations on delete cascade,
  title         text not null,
  file_name     text not null,
  storage_path  text not null,                 -- Supabase Storage object path
  mime_type     text not null,
  status        kb_doc_status not null default 'uploading',
  enabled       boolean not null default true,
  category      text,
  product_id    uuid references products(id),
  chunk_count   integer not null default 0,
  token_count   integer not null default 0,
  error         text,
  metadata      jsonb not null default '{}',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index idx_kb_docs_org     on kb_documents(org_id);
create index idx_kb_docs_status  on kb_documents(org_id, status);
create index idx_kb_docs_product on kb_documents(product_id);

create table kb_chunks (
  id          uuid primary key default gen_random_uuid(),
  document_id uuid not null references kb_documents on delete cascade,
  org_id      uuid not null references organizations on delete cascade,
  chunk_index integer not null,
  content     text not null,
  heading     text,
  metadata    jsonb not null default '{}',
  embedding   vector(768),
  token_count integer,
  created_at  timestamptz not null default now()
);
create index idx_kb_chunks_doc  on kb_chunks(document_id);
create index idx_kb_chunks_org  on kb_chunks(org_id);
create index idx_kb_chunks_vec  on kb_chunks using hnsw (embedding vector_cosine_ops) with (m = 20, ef = 256);
create index idx_kb_chunks_head on kb_chunks(org_id, heading);

-- App settings (key/value JSON) per organization
create table settings (
  org_id     uuid not null references organizations on delete cascade,
  key        text not null,
  value      jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (org_id, key)
);
create index idx_settings_org on settings(org_id);

-- In-app notifications
create table notifications (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references organizations on delete cascade,
  user_id    uuid references profiles(id),  -- null => broadcast to all org agents
  type       text not null,
  title      text not null,
  message    text,
  data       jsonb not null default '{}',
  is_read    boolean not null default false,
  created_at timestamptz not null default now()
);
create index idx_notifications_org  on notifications(org_id);
create index idx_notifications_user on notifications(user_id, is_read, created_at desc);
