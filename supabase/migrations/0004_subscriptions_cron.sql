-- ============================================================
-- Savediu · 0004 · Otomatik Abonelik Yenileme (pg_cron)
--
-- Nasıl çalışır:
--  1. pg_cron her gece 00:05 UTC'de process_due_subscriptions()
--     fonksiyonunu çalıştırır.
--  2. Fonksiyon, faturalama günü gelmiş (veya bu ay içinde geçmiş
--     ama henüz işlenmemiş) tüm aktif abonelikleri bulur ve her
--     biri için transactions tablosuna 'expense' kaydı ekler.
--  3. last_billed_on güncellenir → aynı ay ikinci kez faturalanmaz.
--
-- Kenar durumlar:
--  - billing_day = 31 ve ay 30 çekiyorsa → ayın son günü faturalanır.
--  - Cron bir gün kaçırırsa → sonraki çalıştırmada telafi eder
--    (koşul "=" değil "<=" olduğu için).
-- ============================================================

-- pg_cron eklentisini etkinleştir
-- (Alternatif: Supabase Dashboard → Database → Extensions → pg_cron)
create extension if not exists pg_cron;

-- ------------------------------------------------------------
-- process_due_subscriptions() · günü gelen abonelikleri gidere çevirir
-- SECURITY DEFINER: cron, RLS'e takılmadan tüm kullanıcılar adına yazar.
-- ------------------------------------------------------------
create or replace function public.process_due_subscriptions()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  today         date := current_date;
  month_start   date := date_trunc('month', current_date)::date;
  days_in_month int  := extract(day from (date_trunc('month', current_date)
                                          + interval '1 month - 1 day'))::int;
begin
  with due as (
    select s.id, s.user_id, s.category_id, s.name, s.amount, s.currency
    from public.subscriptions s
    where s.is_active
      -- bu ayın efektif faturalama günü geldi ya da geçti
      and least(s.billing_day, days_in_month) <= extract(day from today)::int
      -- bu ay henüz faturalanmadı
      and (s.last_billed_on is null or s.last_billed_on < month_start)
  ),
  inserted as (
    insert into public.transactions
      (user_id, category_id, subscription_id, type, amount, currency, description, date)
    select
      d.user_id, d.category_id, d.id, 'expense', d.amount, d.currency,
      d.name || ' · Otomatik yenileme', today
    from due d
    returning subscription_id
  )
  update public.subscriptions s
  set last_billed_on = today
  from inserted i
  where s.id = i.subscription_id;
end;
$$;

-- Kullanıcıların bu fonksiyonu elle çağırmasını engelle
revoke execute on function public.process_due_subscriptions() from anon, authenticated;

-- ------------------------------------------------------------
-- Cron görevi · her gece 00:05 UTC (Türkiye saatiyle 03:05)
-- ------------------------------------------------------------
select cron.schedule(
  'savediu-process-subscriptions',
  '5 0 * * *',
  $$ select public.process_due_subscriptions(); $$
);
