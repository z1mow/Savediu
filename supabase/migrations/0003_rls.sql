-- ============================================================
-- Savediu · 0003 · Row Level Security Politikaları
-- Kural: kullanıcı SADECE kendi verisini görür/yönetir,
-- admin (is_admin()) HER ŞEYİ görür/yönetir.
-- ============================================================

alter table public.profiles       enable row level security;
alter table public.categories     enable row level security;
alter table public.subscriptions  enable row level security;
alter table public.transactions   enable row level security;
alter table public.exchange_rates enable row level security;

-- ------------------------------------------------------------
-- PROFILES
-- ------------------------------------------------------------
create policy "profiles_select_own_or_admin"
  on public.profiles for select
  to authenticated
  using (id = (select auth.uid()) or public.is_admin());

create policy "profiles_update_own_or_admin"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()) or public.is_admin())
  with check (id = (select auth.uid()) or public.is_admin());

-- Silme sadece admin (kullanıcı hesabı auth.users cascade ile silinir)
create policy "profiles_delete_admin"
  on public.profiles for delete
  to authenticated
  using (public.is_admin());

-- insert politikası yok: profil, SECURITY DEFINER trigger ile oluşur.

-- ------------------------------------------------------------
-- CATEGORIES
-- ------------------------------------------------------------
create policy "categories_select_own_or_admin"
  on public.categories for select
  to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());

create policy "categories_insert_own_or_admin"
  on public.categories for insert
  to authenticated
  with check (user_id = (select auth.uid()) or public.is_admin());

create policy "categories_update_own_or_admin"
  on public.categories for update
  to authenticated
  using (user_id = (select auth.uid()) or public.is_admin())
  with check (user_id = (select auth.uid()) or public.is_admin());

create policy "categories_delete_own_or_admin"
  on public.categories for delete
  to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());

-- ------------------------------------------------------------
-- SUBSCRIPTIONS
-- ------------------------------------------------------------
create policy "subscriptions_select_own_or_admin"
  on public.subscriptions for select
  to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());

create policy "subscriptions_insert_own_or_admin"
  on public.subscriptions for insert
  to authenticated
  with check (user_id = (select auth.uid()) or public.is_admin());

create policy "subscriptions_update_own_or_admin"
  on public.subscriptions for update
  to authenticated
  using (user_id = (select auth.uid()) or public.is_admin())
  with check (user_id = (select auth.uid()) or public.is_admin());

create policy "subscriptions_delete_own_or_admin"
  on public.subscriptions for delete
  to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());

-- ------------------------------------------------------------
-- TRANSACTIONS
-- ------------------------------------------------------------
create policy "transactions_select_own_or_admin"
  on public.transactions for select
  to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());

create policy "transactions_insert_own_or_admin"
  on public.transactions for insert
  to authenticated
  with check (user_id = (select auth.uid()) or public.is_admin());

create policy "transactions_update_own_or_admin"
  on public.transactions for update
  to authenticated
  using (user_id = (select auth.uid()) or public.is_admin())
  with check (user_id = (select auth.uid()) or public.is_admin());

create policy "transactions_delete_own_or_admin"
  on public.transactions for delete
  to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());

-- ------------------------------------------------------------
-- EXCHANGE_RATES · herkes okur, sadece admin yazar
-- ------------------------------------------------------------
create policy "exchange_rates_select_all"
  on public.exchange_rates for select
  to authenticated
  using (true);

create policy "exchange_rates_write_admin"
  on public.exchange_rates for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
