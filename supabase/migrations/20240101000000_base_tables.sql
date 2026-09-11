-- =============================================================================
-- Messenger AI Agent — Base tables + enums  (Graph API v18.0)
-- =============================================================================
create extension if not exists vector;

create type conversation_status as enum ('open','pending','resolved','archived','spam');
create type order_status as enum ('pending','confirmed','processing','shipped','delivered','cancelled','refunded');
create type payment_status as enum ('pending','paid','failed','refunded');
create type kb_doc_status as enum ('uploading','processing','ready','failed','disabled');

-- Organizations (one deploy = one business; multi-tenant ready)
create table organizations (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  plan       text not null default 'free' check (plan in ('free','starter','pro','enterprise')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Support-agent profiles (linked to Supabase Auth users)
create table profiles (
  id         uuid primary key references auth.users on delete cascade,
  org_id     uuid not null references organizations on delete cascade,
  email      text,
  full_name  text,
  role       text not null default 'support' check (role in ('owner','admin','support')),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Connected Meta (Facebook) Page. page_access_token is server-only (encrypted).
create table meta_connections (
  id                       uuid primary key default gen_random_uuid(),
  org_id                   uuid not null references organizations on delete cascade,
  page_id                  text not null,
  page_name                text,
  page_category            text,
  page_access_token        text,                 -- encrypted blob (server-only)
  page_access_token_expires timestamptz,
  user_access_token        text,                 -- encrypted
  user_id                  text,                 -- Meta user id
  app_id                   text,
  facebook_app_id          text,
  connected                boolean not null default false,
  webhook_verified         boolean not null default false,
  synced_at                timestamptz,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  unique (org_id, page_id)
);

-- Customers = Messenger contacts, identified by their Page-Scoped ID (PSID)
create table customers (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references organizations on delete cascade,
  psid            text not null,                -- page-scoped id (identity on Messenger)
  page_id         text,
  name            text,
  first_name      text,
  last_name       text,
  profile_pic_url text,
  locale          text,
  gender          text,
  timezone        integer,
  is_follower     boolean,
  last_seen_at    timestamptz,
  tags            text[]        default '{}',
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (org_id, page_id, psid)
);
