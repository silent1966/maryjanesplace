-- Mary Jane's Place — member portal schema
-- Run this once in your Supabase project: Dashboard → SQL Editor → New query → paste → Run.

-- 1) Members table (one row per signed-in member; id = the auth user id)
create table if not exists public.members (
  id          uuid primary key references auth.users (id) on delete cascade,
  member_no   text unique,
  full_name   text,
  email       text,
  join_date   date default current_date,
  tier        text default 'Member',
  points      integer not null default 0,
  created_at  timestamptz default now()
);

-- 2) Sequential, human-friendly member number: MJP-2026-0001, 0002, ...
create sequence if not exists public.member_no_seq start 1;

create or replace function public.assign_member_no()
returns trigger language plpgsql as $$
begin
  if new.member_no is null then
    new.member_no := 'MJP-2026-' || lpad(nextval('public.member_no_seq')::text, 4, '0');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_assign_member_no on public.members;
create trigger trg_assign_member_no
  before insert on public.members
  for each row execute function public.assign_member_no();

-- 3) Stop members editing their own points (loyalty integrity).
--    Staff add points using the service_role key (Supabase dashboard / admin tools),
--    which bypasses these checks.
create or replace function public.guard_points()
returns trigger language plpgsql as $$
begin
  if new.points is distinct from old.points then
    raise exception 'points can only be changed by staff';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guard_points on public.members;
create trigger trg_guard_points
  before update on public.members
  for each row execute function public.guard_points();

-- 4) Row Level Security: a member can only see and manage their own row.
alter table public.members enable row level security;

drop policy if exists "members read own"   on public.members;
drop policy if exists "members insert own" on public.members;
drop policy if exists "members update own" on public.members;

create policy "members read own"   on public.members for select using (auth.uid() = id);
create policy "members insert own" on public.members for insert with check (auth.uid() = id);
create policy "members update own" on public.members for update using (auth.uid() = id);

-- Done. To add loyalty points later, run e.g. (as service_role / dashboard):
--   update public.members set points = points + 25 where member_no = 'MJP-2026-0001';
