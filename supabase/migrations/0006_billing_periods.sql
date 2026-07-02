-- ============================================================
-- Savediu · 0006 · Abonelik periyotları (haftalık/aylık/yıllık)
--
-- Yenilik: abonelikler artık "next_billing_on" (sonraki yenileme
-- tarihi) üzerinden takip edilir. Cron, tarihi gelen aboneliği
-- faturalar ve tarihi periyoduna göre ileri alır. Sunucu günlerce
-- kapalı kalsa bile kaçan dönemler geriye dönük telafi edilir.
-- ============================================================

-- 1) Yeni sütunlar
alter table public.subscriptions
  add column if not exists billing_period text not null default 'monthly'
    check (billing_period in ('weekly', 'monthly', 'yearly')),
  add column if not exists next_billing_on date;

-- billing_day artık sadece aylık aboneliklerde "ayın kaçı" bilgisini
-- korumak için kullanılır (31 çeken aylarda güne sadık kalmak için).
alter table public.subscriptions alter column billing_day drop not null;

-- 2) Mevcut kayıtların next_billing_on değerini doldur
with calc as (
  select
    s.id,
    s.billing_day,
    s.last_billed_on,
    date_trunc('month', current_date)::date                       as m0,
    extract(day from (date_trunc('month', current_date)
                      + interval '1 month - 1 day'))::int          as dim0,
    (date_trunc('month', current_date) + interval '1 month')::date as m1,
    extract(day from (date_trunc('month', current_date)
                      + interval '2 month - 1 day'))::int          as dim1
  from public.subscriptions s
)
update public.subscriptions s
set next_billing_on = case
  -- bu ay zaten faturalandıysa ya da gün geçtiyse → gelecek ay
  when (c.last_billed_on is not null and c.last_billed_on >= c.m0)
       or extract(day from current_date)::int > least(c.billing_day, c.dim0)
  then c.m1 + (least(c.billing_day, c.dim1) - 1)
  else c.m0 + (least(c.billing_day, c.dim0) - 1)
end
from calc c
where s.id = c.id and s.next_billing_on is null;

alter table public.subscriptions alter column next_billing_on set not null;

drop index if exists idx_subscriptions_due;
create index idx_subscriptions_next_billing
  on public.subscriptions (next_billing_on) where is_active;

-- 3) Yenileme tarihini periyoduna göre ileri alan yardımcı fonksiyon
create or replace function public.advance_billing_date(
  d date,
  period text,
  bday smallint
)
returns date
language plpgsql
immutable
as $$
declare
  next_month date;
begin
  if period = 'weekly' then
    return d + 7;
  elsif period = 'yearly' then
    -- 29 Şubat gibi durumlarda Postgres otomatik olarak 28'e çeker
    return (d + interval '1 year')::date;
  else
    -- aylık: billing_day'e sadık kal, kısa aylarda son güne çek
    next_month := (date_trunc('month', d) + interval '1 month')::date;
    return next_month + (
      least(
        coalesce(bday, extract(day from d)::int),
        extract(day from (next_month + interval '1 month - 1 day'))::int
      ) - 1
    );
  end if;
end;
$$;

-- 4) Cron fonksiyonunu yeni modele göre yeniden yaz
create or replace function public.process_due_subscriptions()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  sub   record;
  guard int;
begin
  for sub in
    select * from public.subscriptions
    where is_active and next_billing_on <= current_date
    for update
  loop
    guard := 0;
    -- kaçırılan her dönem için ayrı kayıt at (en fazla 36 dönem geriye)
    while sub.next_billing_on <= current_date and guard < 36 loop
      insert into public.transactions
        (user_id, category_id, subscription_id, type, amount, currency, description, date)
      values
        (sub.user_id, sub.category_id, sub.id, 'expense', sub.amount, sub.currency,
         sub.name || ' · Otomatik yenileme', sub.next_billing_on);

      sub.next_billing_on := public.advance_billing_date(
        sub.next_billing_on, sub.billing_period, sub.billing_day
      );
      guard := guard + 1;
    end loop;

    update public.subscriptions
    set next_billing_on = sub.next_billing_on,
        last_billed_on  = current_date
    where id = sub.id;
  end loop;
end;
$$;
