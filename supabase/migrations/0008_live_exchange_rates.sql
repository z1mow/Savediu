-- ============================================================
-- Savediu · 0008 · Canlı döviz kurları (http + pg_cron)
-- (2026-07-03 tarihinde Supabase MCP ile uygulandı)
--
-- Her gün 05:15 UTC'de Frankfurter API'sinden (ECB verisi,
-- ücretsiz, anahtarsız) USD/EUR/GBP kurları çekilir ve
-- exchange_rates tablosu güncellenir. Admin panelindeki kur
-- düzenleyici manuel müdahale için durmaya devam eder.
-- ============================================================

create extension if not exists http with schema extensions;

create or replace function public.update_exchange_rates()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  resp   jsonb;
  r_code text;
  r_val  numeric;
begin
  -- 1 TRY = x DÖVIZ döner; biz tersini (1 DÖVIZ = x TRY) saklarız
  select content::jsonb into resp
  from extensions.http_get(
    'https://api.frankfurter.dev/v1/latest?base=TRY&symbols=USD,EUR,GBP'
  );

  if resp is null or resp -> 'rates' is null then
    raise warning 'Savediu: kur verisi alinamadi';
    return;
  end if;

  for r_code, r_val in
    select key, value::numeric from jsonb_each_text(resp -> 'rates')
  loop
    if r_val > 0 then
      update public.exchange_rates
      set rate_to_try = round(1 / r_val, 6),
          updated_at  = now()
      where code = r_code;
    end if;
  end loop;
end;
$$;

revoke execute on function public.update_exchange_rates() from anon, authenticated;

-- Her gün 05:15 UTC (TR 08:15) — abonelik cron'undan ayrı saatte
select cron.schedule(
  'savediu-update-rates',
  '15 5 * * *',
  $$ select public.update_exchange_rates(); $$
);
