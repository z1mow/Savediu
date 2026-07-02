import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminClient } from "@/components/admin/admin-client";
import { createClient } from "@/lib/supabase/server";
import { toTRY, type ExchangeRate, type Profile } from "@/lib/types";

export const metadata: Metadata = { title: "Admin" };

export default async function AdminPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Sunucu tarafında rol kontrolü — admin değilse panele geri gönder.
  // (RLS zaten veriyi korur; bu kontrol sayfayı tamamen gizler.)
  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (me?.role !== "admin") redirect("/dashboard");

  const [
    { data: profilesData },
    { data: txData },
    { count: activeSubsCount },
    { data: ratesData },
  ] = await Promise.all([
    supabase.from("profiles").select("*").order("created_at", { ascending: false }),
    supabase.from("transactions").select("user_id, type, amount, currency"),
    supabase
      .from("subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true),
    supabase.from("exchange_rates").select("*").order("code"),
  ]);

  const profiles = (profilesData ?? []) as (Profile & { email: string | null })[];
  const rates = (ratesData ?? []) as ExchangeRate[];
  const transactions = (txData ?? []) as {
    user_id: string;
    type: "income" | "expense";
    amount: number;
    currency: string;
  }[];

  // Platform istatistikleri
  let totalVolume = 0;
  const txCountByUser = new Map<string, number>();
  for (const t of transactions) {
    totalVolume += toTRY(Number(t.amount), t.currency, rates);
    txCountByUser.set(t.user_id, (txCountByUser.get(t.user_id) ?? 0) + 1);
  }

  return (
    <AdminClient
      currentUserId={user.id}
      users={profiles.map((p) => ({
        id: p.id,
        fullName: p.full_name,
        email: p.email ?? null,
        role: p.role,
        createdAt: p.created_at,
        txCount: txCountByUser.get(p.id) ?? 0,
      }))}
      stats={{
        totalUsers: profiles.length,
        totalTransactions: transactions.length,
        totalVolume,
        activeSubscriptions: activeSubsCount ?? 0,
      }}
      rates={rates.map((r) => ({
        code: r.code.trim() as ExchangeRate["code"],
        rate_to_try: Number(r.rate_to_try),
        updated_at: r.updated_at,
      }))}
    />
  );
}
