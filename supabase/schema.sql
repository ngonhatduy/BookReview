-- ============================================================================
-- BookWeb (Tủ Sách Của Mình) — Supabase Schema, RLS Policies, Storage & Seed
-- Run this entire script once in Supabase Dashboard -> SQL Editor
-- ============================================================================

create extension if not exists pgcrypto;

-- 1. Profiles table (linked 1:1 with auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  role text not null default 'viewer' check (role in ('admin', 'viewer')),
  created_at timestamptz not null default now()
);

-- 2. Helper function to check whether current authenticated user is admin
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

-- 3. Automatically create profile on signup; first user becomes 'admin'
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  assigned_role text;
begin
  -- Serialize first-admin check to prevent race conditions
  perform pg_advisory_xact_lock(918273645);

  if not exists (select 1 from public.profiles where role = 'admin') then
    assigned_role := 'admin';
  else
    assigned_role := 'viewer';
  end if;

  insert into public.profiles (id, email, display_name, role)
  values (
    new.id,
    new.email,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
      split_part(coalesce(new.email, 'user'), '@', 1)
    ),
    assigned_role
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- 4. Prevent non-admins from elevating their own role via client UPDATE
create or replace function public.prevent_non_admin_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role then
    -- Allow direct database/SQL editor changes where auth.uid() is null
    if auth.uid() is not null and not public.is_admin() then
      raise exception 'Only admins can change user roles';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_role on public.profiles;
create trigger protect_profile_role
  before update on public.profiles
  for each row
  execute function public.prevent_non_admin_role_change();

-- 5. Books table
create table if not exists public.books (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  cover_url text,
  genres text[] not null default '{}',
  rating smallint not null check (rating between 1 and 5),
  finished_at date,
  created_at timestamptz not null default now()
);

-- 6. Enable Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.books enable row level security;

-- Profiles policies
drop policy if exists "Users can view own profile or admin views all" on public.profiles;
create policy "Users can view own profile or admin views all"
  on public.profiles
  for select
  using (auth.uid() = id or public.is_admin());

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Books policies (Public read; Admin-only write)
drop policy if exists "Anyone can view books" on public.books;
create policy "Anyone can view books"
  on public.books
  for select
  using (true);

drop policy if exists "Admins can insert books" on public.books;
create policy "Admins can insert books"
  on public.books
  for insert
  with check (public.is_admin());

drop policy if exists "Admins can update books" on public.books;
create policy "Admins can update books"
  on public.books
  for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can delete books" on public.books;
create policy "Admins can delete books"
  on public.books
  for delete
  using (public.is_admin());

-- 7. Storage bucket for book cover images
insert into storage.buckets (id, name, public)
values ('book-covers', 'book-covers', true)
on conflict (id) do nothing;

drop policy if exists "Public can view book covers" on storage.objects;
create policy "Public can view book covers"
  on storage.objects
  for select
  using (bucket_id = 'book-covers');

drop policy if exists "Admins can upload book covers" on storage.objects;
create policy "Admins can upload book covers"
  on storage.objects
  for insert
  with check (bucket_id = 'book-covers' and public.is_admin());

drop policy if exists "Admins can update book covers" on storage.objects;
create policy "Admins can update book covers"
  on storage.objects
  for update
  using (bucket_id = 'book-covers' and public.is_admin())
  with check (bucket_id = 'book-covers' and public.is_admin());

drop policy if exists "Admins can delete book covers" on storage.objects;
create policy "Admins can delete book covers"
  on storage.objects
  for delete
  using (bucket_id = 'book-covers' and public.is_admin());

-- 8. Seed initial 19 books (only when public.books is empty)
do $$
begin
  if not exists (select 1 from public.books) then
    insert into public.books (title, cover_url, genres, rating, finished_at) values
      ('Nhập Vai Thám Tử - Murdle (1)', null, array['Detective', 'Puzzle'], 4, null),
      ('Cửa Tiệm Chỉ Mở Vào Ngày Mưa', null, array['Fiction', 'Healing', 'Fantasy'], 4, null),
      ('Sherlock Holmes - Tuyển Tập Những Vụ Án Hóc Búa Nhất', null, array['Psychology', 'Crime', 'Detective'], 5, null),
      ('Sự Im Lặng Của Bầy Cừu', null, array['Crime', 'Psychology'], 5, null),
      ('Gửi Tới Người Mùa Đông Này Sẽ Không Còn Nữa', null, array['Fiction', 'Healing'], 4, null),
      ('Lễ Tốt Nghiệp Sinh Tử', null, array['Fantasy', 'Fiction'], 3, null),
      ('The Convenience Store By The Sea', null, array['Healing', 'Slice of Life'], 4, null),
      ('What You Are Looking For Is In The Library', null, array['Slice of Life', 'Healing'], 5, null),
      ('Thư Viện Nửa Đêm', null, array['Fiction', 'Healing'], 4, null),
      ('Cửa Hàng Tiện Lợi Bất Tiện', null, array['Healing', 'Slice of Life'], 5, null),
      ('Khi Tách Cà Phê Còn Chưa Nguội', null, array['Healing', 'Fiction'], 4, null),
      ('Khi Lời Nói Dối Còn Chưa Lộ Diện', null, array['Healing', 'Fiction'], 4, null),
      ('Khi Ký Ức Còn Chưa Phai Nhạt', null, array['Healing', 'Fiction'], 4, null),
      ('Hiệu Sách Ma Mị', null, array['Fiction', 'Healing', 'Romance'], 3, null),
      ('Thám Tử Ẩm Thực Kamogawa', null, array['Healing', 'Food'], 4, null),
      ('Thám Tử Ẩm Thực Kamogawa 2 (Tiệm ăn hoài niệm)', null, array['Healing', 'Food'], 4, null),
      ('Tiệm Bánh Nửa Đêm', null, array['Healing', 'Fiction', 'Slice of Life'], 3, '2026-10-23'),
      ('Người Đàn Ông Mang Tên Ove', null, array['Healing'], 5, '2026-10-02'),
      ('Ngôi Nhà Bên Bờ Biển Xanh Thẳm', null, array['Fiction', 'Healing', 'Romance'], 5, '2026-09-04');
  end if;
end $$;
