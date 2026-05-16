create extension if not exists "pgcrypto";

create table if not exists recognition_sessions (
  id uuid primary key default gen_random_uuid(),
  anon_user_id uuid not null,
  mode text not null check (mode in ('life_english', 'sports_action')),
  input_type text not null check (input_type in ('image', 'video_frames')),
  status text not null check (status in ('processing', 'completed', 'failed')),
  candidates jsonb not null default '[]'::jsonb,
  selected_candidate_id text null,
  error_message text null,
  created_at timestamptz not null default now()
);

create table if not exists learning_cards (
  id uuid primary key default gen_random_uuid(),
  anon_user_id uuid not null,
  mode text not null check (mode in ('life_english', 'sports_action')),
  source_type text not null check (source_type in ('image', 'video', 'manual')),
  source_asset_url text null,
  phrase_en text not null,
  meaning_zh text not null,
  part_of_speech text null,
  ipa text null,
  example_en text not null,
  example_zh text not null,
  related_expressions jsonb not null default '[]'::jsonb,
  confusables jsonb not null default '[]'::jsonb,
  usage_scenarios jsonb not null default '[]'::jsonb,
  natural_sentence_patterns jsonb not null default '[]'::jsonb,
  raw_ai_result jsonb null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists media_assets (
  id uuid primary key default gen_random_uuid(),
  anon_user_id uuid not null,
  source_type text not null check (source_type in ('image', 'video_frame')),
  storage_path text not null,
  mime_type text not null,
  size_bytes integer null,
  created_at timestamptz not null default now()
);

create index if not exists recognition_sessions_anon_created_idx
  on recognition_sessions (anon_user_id, created_at desc);

create index if not exists learning_cards_anon_created_idx
  on learning_cards (anon_user_id, created_at desc);

create index if not exists learning_cards_anon_mode_created_idx
  on learning_cards (anon_user_id, mode, created_at desc);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists learning_cards_set_updated_at on learning_cards;
create trigger learning_cards_set_updated_at
before update on learning_cards
for each row
execute function set_updated_at();
