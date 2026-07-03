-- ============================================================
-- Savediu · 0007 · Abonelik fiyat geçmişi (zam takibi)
-- (2026-07-03 tarihinde Supabase MCP ile uygulandı)
--
-- Abonelik tutarı veya para birimi her değiştiğinde trigger eski
-- ve yeni değeri subscription_price_history tablosuna yazar.
-- UI bu geçmişten "X ayda +%Y" zam rozetini üretir.
-- ============================================================

create table public.subscription_price_history (
  id              uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.subscriptions (id) on delete cascade,
  user_id         uuid not null references public.profiles (id) on delete cascade,
  old_amount      numeric(14, 2) not null,
  new_amount      numeric(14, 2) not null,
  currency        char(3) not null,
  changed_at      timestamptz not null default now()
);

create index idx_price_history_subscription
  on public.subscription_price_history (subscription_id, changed_at desc);

alter table public.subscription_price_history enable row level security;

create policy "price_history_select_own_or_admin"
  on public.subscription_price_history for select
  to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());

-- Kayıtlar trigger ile (SECURITY DEFINER) yazılır; insert/update/delete
-- politikası bilinçli olarak yok — geçmiş kullanıcı tarafından değiştirilemez.

create or replace function public.log_subscription_price_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.amount is distinct from old.amount
     or new.currency is distinct from old.currency then
    insert into public.subscription_price_history
      (subscription_id, user_id, old_amount, new_amount, currency)
    values
      (old.id, old.user_id, old.amount, new.amount, new.currency);
  end if;
  return new;
end;
$$;

create trigger on_subscription_price_change
  before update on public.subscriptions
  for each row execute function public.log_subscription_price_change();
