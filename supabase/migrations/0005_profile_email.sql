-- ============================================================
-- Savediu · 0005 · profiles.email sütunu (Admin paneli için)
-- auth.users'a client'tan erişilemediğinden e-postayı profile kopyalarız.
-- ============================================================

alter table public.profiles add column if not exists email text;

-- Mevcut kullanıcıların e-postalarını doldur
update public.profiles p
set email = u.email
from auth.users u
where u.id = p.id and p.email is null;

-- Yeni kayıtlarda e-posta da yazılsın diye trigger fonksiyonunu güncelle
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url, email)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url',
    new.email
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
