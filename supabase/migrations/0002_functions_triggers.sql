-- ============================================================
-- Savediu · 0002 · Fonksiyonlar ve Trigger'lar
-- ============================================================

-- ------------------------------------------------------------
-- is_admin() · RLS politikalarında kullanılır.
-- SECURITY DEFINER: profiles tablosuna RLS'e takılmadan bakar,
-- böylece "policy içinde policy" sonsuz döngüsü oluşmaz.
-- ------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

-- ------------------------------------------------------------
-- handle_new_user() · Yeni kayıt olan her kullanıcı için
-- otomatik profil + varsayılan kategoriler oluşturur.
-- ------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  );

  insert into public.categories (user_id, name, type, icon, color) values
    (new.id, 'Konut',           'expense', 'home',            '#6366f1'),
    (new.id, 'Market',          'expense', 'shopping-cart',   '#22c55e'),
    (new.id, 'Faturalar',       'expense', 'receipt',         '#f59e0b'),
    (new.id, 'Ulaşım',          'expense', 'car',             '#0ea5e9'),
    (new.id, 'Eğlence',         'expense', 'clapperboard',    '#ec4899'),
    (new.id, 'Sağlık',          'expense', 'heart-pulse',     '#ef4444'),
    (new.id, 'Abonelikler',     'expense', 'repeat',          '#8b5cf6'),
    (new.id, 'Diğer Gider',     'expense', 'circle-ellipsis', '#737373'),
    (new.id, 'Maaş',            'income',  'banknote',        '#16a34a'),
    (new.id, 'Serbest Çalışma', 'income',  'laptop',          '#0d9488'),
    (new.id, 'Yatırım',         'income',  'trending-up',     '#ca8a04'),
    (new.id, 'Diğer Gelir',     'income',  'circle-plus',     '#525252');

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------
-- protect_profile_role() · Normal kullanıcının kendi rolünü
-- 'admin' yapmasını engeller (yetki yükseltme koruması).
-- ------------------------------------------------------------
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'Rol degisikligini sadece adminler yapabilir';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger before_profile_update
  before update on public.profiles
  for each row execute function public.protect_profile_role();
