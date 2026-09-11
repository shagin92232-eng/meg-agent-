-- Conversations: one Messenger thread per customer+page
create table conversations (
  id                  uuid primary key default gen_random_uuid(),
  org_id              uuid not null references organizations on delete cascade,
  customer_id         uuid references customers,
  page_id             text,
  status              conversation_status not null default 'open',
  ai_mode             boolean not null default true,        -- true => AI auto-replies
  unread_count        integer not null default 0,
  last_message_at     timestamptz,
  last_message_preview text,
  last_message_sender text,                                  -- 'customer' | 'ai' | 'human' | 'system'
  ai_handled          boolean not null default false,
  human_handled       boolean not null default false,
  is_important        boolean not null default false,
    order_id            uuid,                            -- logical ref to orders.id (no FK: avoids circular dep)
  assigned_agent_id   uuid references profiles(id),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index idx_conversations_org    on conversations(org_id);
create index idx_conversations_last   on conversations(org_id, last_message_at desc nulls last);
create index idx_conversations_status  on conversations(org_id, status, ai_mode);

-- Messages
create table messages (
  id             uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations on delete cascade,
  org_id         uuid not null references organizations on delete cascade,
  sender_role    text not null check (sender_role in ('customer','ai','human','system')),
  message_type   text not null default 'text' check (message_type in (
                   'text','image','file','video','audio','template_button','system_event','order_status')),
  content        text,                    -- raw text or caption
  text_content   text,                    -- extracted text (OCR) from images/files, for AI
  mime_type      text,
  url            text,                    -- media URL (Messenger payload URL)
  metadata       jsonb not null default '{}',
  mid            text,                    -- Messenger message id
  sent_by_me     boolean not null default false,
  status         text not null default 'sent' check (status in ('sending','sent','delivered','read','failed')),
  ai_confidence  numeric(5,4),
  created_at     timestamptz not null default now()
);
create index idx_messages_conv  on messages(conversation_id, created_at);
create index idx_messages_org   on messages(org_id, created_at desc);
create index idx_messages_mid   on messages(mid);

-- Products (embedding column powers semantic product search for the AI)
create table products (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references organizations on delete cascade,
  name        text not null,
  description text,
  price       numeric(12,2),
  currency    text not null default 'BDT',
  stock       integer,
  sku         text,
  barcode     text,
  category    text,
  image_url   text,
  is_enabled  boolean not null default true,
  embedding   vector(768),
  metadata    jsonb not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index idx_products_org  on products(org_id);
create index idx_products_cat   on products(org_id, category);
create index idx_products_embed on products using hnsw (embedding vector_cosine_ops) with (m = 20, ef = 256);
