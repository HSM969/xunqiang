-- 循腔 · Supabase 建表脚本
-- 用法：Supabase 项目 → 左侧 SQL Editor → New query → 粘贴全部 → Run

-- 1) 玩家登记表
create table if not exists public.players (
  id          text primary key,
  name        text not null,
  age         int,
  agong       text,
  frequency   text,
  shadow      text,
  created_at  timestamptz default now()
);

-- 2) 成绩表
create table if not exists public.results (
  id             bigint generated always as identity primary key,
  player_id      text,
  name           text,
  age            int,
  agong          text,
  frequency      text,
  shadow         text,
  grade          text,
  score          int,
  exact          int,
  late           int,
  miss           int,
  max_combo      int,
  processed      int,
  total_notes    int,
  completion     int,
  finished_early boolean,
  finished_at    timestamptz default now()
);

-- 3) 开启行级安全：只允许"写入"，不允许匿名读取（保护姓名和年龄）
alter table public.players enable row level security;
alter table public.results enable row level security;

drop policy if exists "anon insert players" on public.players;
drop policy if exists "anon insert results" on public.results;

create policy "anon insert players" on public.players
  for insert to anon with check (true);

create policy "anon insert results" on public.results
  for insert to anon with check (true);

-- 说明：
-- · 前端用 anon key，只能 insert，读不到任何一条数据。
-- · 你自己在 Supabase 网页后台（Table Editor）能看到全部数据，也能导出 CSV。
