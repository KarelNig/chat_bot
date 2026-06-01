-- Zimran Chat — Full schema (run in Supabase SQL editor)
-- Safe to re-run: uses CREATE IF NOT EXISTS + ALTER IF NOT EXISTS

create extension if not exists "pgcrypto";

-- profiles ---------------------------------------------------------------
create table if not exists profiles (
  id         uuid primary key default gen_random_uuid(),
  username   text not null unique,
  avatar_url text,
  created_at timestamptz not null default now()
);
alter table profiles enable row level security;
create policy "profiles: public read-write" on profiles for all using (true) with check (true);

-- threads ----------------------------------------------------------------
create table if not exists threads (
  id          uuid primary key default gen_random_uuid(),
  title       text        not null,
  user_id     text        not null default ''guest'',
  type        text        not null default ''ai'',
  receiver_id uuid        references profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);

-- Add new columns to existing deployments (safe no-op if already present)
do $$ begin
  if not exists (select 1 from information_schema.columns
                 where table_name=''threads'' and column_name=''type'') then
    alter table threads add column type text not null default ''ai'';
  end if;
  if not exists (select 1 from information_schema.columns
                 where table_name=''threads'' and column_name=''receiver_id'') then
    alter table threads add column receiver_id uuid references profiles(id) on delete set null;
  end if;
end $$;

alter table threads enable row level security;
create policy "threads: public read-write" on threads for all using (true) with check (true);

-- messages ---------------------------------------------------------------
create table if not exists messages (
  id         uuid primary key default gen_random_uuid(),
  thread_id  uuid        not null references threads(id) on delete cascade,
  sender_id  text        not null,
  text       text        not null,
  status     text        not null default ''sent'',
  created_at timestamptz not null default now()
);
alter table messages enable row level security;
create policy "messages: public read-write" on messages for all using (true) with check (true);
create index if not exists messages_thread_id_idx on messages(thread_id, created_at);