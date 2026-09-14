-- Ensure conversation-level metadata JSON exists for agent summary/compression storage.
alter table conversations
  add column if not exists metadata jsonb not null default '{}';
