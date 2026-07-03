-- ============================================================
-- Savediu · 0009 · Geçmiş tarihli abonelik ekleme (backfill)
-- (2026-07-03 tarihinde Supabase MCP ile uygulandı)
--
-- Kullanıcı "İlk Ödeme Tarihi" olarak geçmiş bir tarih seçtiğinde,
-- bu fonksiyon o tarihten bugüne kadarki tüm dönemleri işleyip
-- transactions'a kaydeder ve next_billing_on'u bugünden sonraki
-- ilk yenilemeye ilerletir. process_due_subscriptions ile aynı
-- ilerletme mantığını (advance_billing_date) kullanır.
-- ============================================================

create or replace function public.catch_up_subscription(p_subscription_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  sub   record;
  guard int;
begin
  select * into sub from public.subscriptions where id = p_subscription_id for update;

  if sub is null then
    raise exception 'Abonelik bulunamadi';
  end if;

  if sub.user_id <> auth.uid() and not public.is_admin() then
    raise exception 'Yetkisiz erisim';
  end if;

  guard := 0;
  while sub.next_billing_on <= current_date and guard < 600 loop
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
      last_billed_on  = case when guard > 0 then current_date else last_billed_on end
  where id = sub.id;
end;
$$;

grant execute on function public.catch_up_subscription(uuid) to authenticated;
