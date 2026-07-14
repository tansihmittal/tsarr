-- Run this in your Supabase SQL Editor (https://app.supabase.com → SQL Editor)

-- ─── Projects Table ──────────────────────────────────────────────────────────────
-- user_id defaults to auth.uid() because the app's insert/upsert calls never set it
-- explicitly — they rely on Postgres filling it in from the caller's JWT.
create table if not exists projects (
  id          text        primary key,
  user_id     uuid        not null default auth.uid() references auth.users(id) on delete cascade,
  name        text        not null,
  type        text        not null,
  thumbnail   text,
  data        jsonb,
  created_at  bigint      not null,
  updated_at  bigint      not null
);

create index if not exists projects_user_id_idx       on projects(user_id);
create index if not exists projects_updated_at_idx    on projects(updated_at desc);

alter table projects enable row level security;

drop policy if exists "Users can manage their own projects" on projects;
create policy "Users can manage their own projects"
  on projects for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── Presets Table ──────────────────────────────────────────────────────────────
create table if not exists presets (
  id          uuid        default gen_random_uuid() primary key,
  user_id     uuid        not null default auth.uid() references auth.users(id) on delete cascade,
  preset_name text        not null,
  data        jsonb       not null,
  created_at  timestamptz default now()
);

create index if not exists presets_user_id_idx on presets(user_id);

alter table presets enable row level security;

drop policy if exists "Users can manage their own presets" on presets;
create policy "Users can manage their own presets"
  on presets for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
