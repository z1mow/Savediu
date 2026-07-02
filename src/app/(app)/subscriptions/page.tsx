import type { Metadata } from "next";
import { SubscriptionsClient } from "@/components/subscriptions/subscriptions-client";
import { createClient } from "@/lib/supabase/server";
import type { Category, ExchangeRate, Subscription } from "@/lib/types";

export const metadata: Metadata = { title: "Aboneliklerim" };

export default async function SubscriptionsPage() {
  const supabase = await createClient();

  const [{ data: subs }, { data: cats }, { data: rates }] = await Promise.all([
    supabase.from("subscriptions").select("*").order("billing_day"),
    supabase.from("categories").select("*").eq("type", "expense").order("name"),
    supabase.from("exchange_rates").select("code, rate_to_try"),
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
    />
  );
}
