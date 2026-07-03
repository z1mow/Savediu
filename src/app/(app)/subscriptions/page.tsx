import type { Metadata } from "next";
import { SubscriptionsClient } from "@/components/subscriptions/subscriptions-client";
import { createClient } from "@/lib/supabase/server";
import type {
  Category,
  ExchangeRate,
  Subscription,
  SubscriptionPriceChange,
} from "@/lib/types";

export const metadata: Metadata = { title: "Aboneliklerim" };

export default async function SubscriptionsPage() {
  const supabase = await createClient();

  const [{ data: subs }, { data: cats }, { data: rates }, { data: history }] =
    await Promise.all([
      supabase.from("subscriptions").select("*").order("next_billing_on"),
      supabase.from("categories").select("*").eq("type", "expense").order("name"),
      supabase.from("exchange_rates").select("code, rate_to_try"),
      supabase
        .from("subscription_price_history")
        .select("subscription_id, old_amount, new_amount, currency, changed_at")
        .order("changed_at", { ascending: true }),
    ]);

  return (
    <SubscriptionsClient
      subscriptions={(subs ?? []).map((s) => ({
        ...(s as Subscription),
        amount: Number((s as Subscription).amount),
        currency: String((s as Subscription).currency).trim() as Subscription["currency"],
      }))}
      categories={(cats ?? []) as Category[]}
      rates={(rates ?? []) as Pick<ExchangeRate, "code" | "rate_to_try">[]}
      priceHistory={((history ?? []) as SubscriptionPriceChange[]).map((h) => ({
        ...h,
        old_amount: Number(h.old_amount),
        new_amount: Number(h.new_amount),
        currency: String(h.currency).trim(),
      }))}
    />
  );
}
