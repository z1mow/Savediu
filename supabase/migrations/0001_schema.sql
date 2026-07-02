-- ============================================================
-- Savediu · 0001 · Şema (Tablolar + İndeksler)
-- Supabase SQL Editor'de sırayla çalıştırın: 0001 → 0002 → 0003 → 0004
-- ============================================================

-- ------------------------------------------------------------
-- PROFILES · auth.users ile 1:1, rol ve ana para birimi burada
-- ------------------------------------------------------------
create table public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  full_name     text,
  avatar_url    text,
  role          text not null default 'user' check (role in ('user', 'admin')),
  main_currency char(3) not null default 'TRY',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ------------------------------------------------------------
-- CATEGORIES · kullanıcıya özel gelir/gider kategorileri
-- ------------------------------------------------------------
create table public.categories (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  name       text not null,
  type       text not null check (type in ('income', 'expense')),
  icon       text,          -- lucide ikon adı (örn. 'home', 'shopping-cart')
  color      text,          -- hex renk (örn. '#6366f1')
  created_at timestamptz not null default now(),
  unique (user_id, name, type)
);

-- ------------------------------------------------------------
-- SUBSCRIPTIONS · sabit giderler, her ay billing_day gününde yenilenir
-- ------------------------------------------------------------
create table public.subscriptions (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles (id) on delete cascade,
  category_id    uuid references public.categories (id) on delete set null,
  name           text not null,
  amount         numeric(14, 2) not null check (amount > 0),
  currency       char(3) not null default 'TRY',
  billing_day    smallint not null check (billing_day between 1 and 31),
  is_active      boolean not null default true,
  last_billed_on date,   -- çifte faturalamayı önler (ay bazında kontrol edilir)
  created_at     timestamptz not null default now()
);

-- ------------------------------------------------------------
-- TRANSACTIONS · tüm gelir/gider hareketleri
-- ------------------------------------------------------------
create table public.transactions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles (id) on delete cascade,
  category_id     uuid references public.categories (id) on delete set null,
  subscription_id uuid references public.subscriptions (id) on delete set null,
  type            text not null check (type in ('income', 'expense')),
  amount          numeric(14, 2) not null check (amount > 0),
  currency        char(3) not null default 'TRY',
  description     text,
  date            date not null default current_date,
  created_at      timestamptz not null default now()
);

-- ------------------------------------------------------------
-- EXCHANGE_RATES · basit kur tablosu (1 birim = X TRY)
-- Dashboard tüm tutarları bu kurlarla ana para birimine çevirir.
-- Kurları admin panelinden veya SQL ile güncelleyebilirsiniz.
-- ------------------------------------------------------------
create table public.exchange_rates (
  code        char(3) primary key,
  rate_to_try numeric(14, 6) not null check (rate_to_try > 0),
  updated_at  timestamptz not null default now()
);

insert into public.exchange_rates (code, rate_to_try) values
  ('TRY', 1),
  ('USD', 41.50),   -- örnek kur, güncelleyin
  ('EUR', 48.20),   -- örnek kur, güncelleyin
  ('GBP', 55.80)    -- örnek kur, güncelleyin
on conflict (code) do nothing;

-- ------------------------------------------------------------
-- İNDEKSLER · en sık sorgu desenleri için
-- ------------------------------------------------------------
create index idx_transactions_user_date on public.transactions (user_id, date desc);
create index idx_transactions_user_type on public.transactions (user_id, type);
create index idx_categories_user        on public.categories (user_id);
create index idx_subscriptions_user     on public.subscriptions (user_id);
create index idx_subscriptions_due      on public.subscriptions (billing_day) where is_active;
