-- Zimran Chat — Supabase schema
-- Run this once in the Supabase SQL editor for your project.

create extension if not exists "pgcrypto";

-- threads ---------------------------------------------------------------
create table if not exists threads (
  id         uuid primary key default gen_random_uuid(),
  title      text        not null,
  user_id    text        not null default 'guest',
  created_at timestamptz not null default now()
);

alter table threads enable row level security;

create policy "threads: public read-write"
  on threads for all
  using (true)
  with check (true);

-- messages --------------------------------------------------------------
create table if not exists messages (
  id         uuid primary key default gen_random_uuid(),
  thread_id  uuid        not null references threads(id) on delete cascade,
  sender_id  text        not null,
  text       text        not null,
  status     text        not null default 'sent',
  created_at timestamptz not null default now()
);

alter table messages enable row level security;

create policy "messages: public read-write"
  on messages for all
  using (true)
  with check (true);

-- index for fast message look-ups
create index if not exists messages_thread_id_idx on messages(thread_id, created_at);