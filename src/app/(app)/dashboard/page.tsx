import type { Metadata } from "next";
import { format, startOfMonth, subMonths } from "date-fns";
import { tr } from "date-fns/locale";
import { StatCards } from "@/components/dashboard/stat-cards";
import { TrendChart } from "@/components/dashboard/trend-chart";
import { CategoryDonut } from "@/components/dashboard/category-donut";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { SubscriptionDialog } from "@/components/subscriptions/subscription-dialog";
import { TransactionDialog } from "@/components/transactions/transaction-dialog";
import { createClient } from "@/lib/supabase/server";
import { toTRY, type Category, type ExchangeRate } from "@/lib/types";

export const metadata: Metadata = { title: "Panel" };

interface TxRow {
  id: string;
  type: "income" | "expense";
  amount: number;
  currency: string;
  date: string;
  description: string | null;
  categories: { name: string; color: string | null } | null;
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const since = format(startOfMonth(subMonths(new Date(), 5)), "yyyy-MM-dd");

  const [{ data: txData }, { data: ratesData }, { data: profileData }, { data: catData }] =
    await Promise.all([
      supabase
        .from("transactions")
        .select("id, type, amount, currency, date, description, categories(name, color)")
        .gte("date", since)
        .order("date", { ascending: false }),
      supabase.from("exchange_rates").select("code, rate_to_try"),
      supabase.from("profiles").select("full_name").eq("id", user!.id).single(),
      supabase.from("categories").select("*").order("name"),
    ]);

  const categories = (catData ?? []) as Category[];

  const transactions = (txData ?? []) as unknown as TxRow[];
  const rates = (ratesData ?? []) as Pick<ExchangeRate, "code" | "rate_to_try">[];

  const inTRY = (t: TxRow) => toTRY(Number(t.amount), t.currency, rates);
  const monthKey = (d: string | Date) =>
    format(typeof d === "string" ? new Date(d) : d, "yyyy-MM");
  const currentKey = monthKey(new Date());

  // Bu ayın toplamları
  let income = 0;
  let expense = 0;
  for (const t of transactions) {
    if (monthKey(t.date) !== currentKey) continue;
    if (t.type === "income") income += inTRY(t);
    else expense += inTRY(t);
  }

  // Son 6 ayın gelir/gider serisi
  const series = Array.from({ length: 6 }, (_, i) => {
    const month = subMonths(new Date(), 5 - i);
    const key = monthKey(month);
    let mIncome = 0;
    let mExpense = 0;
    for (const t of transactions) {
      if (monthKey(t.date) !== key) continue;
      if (t.type === "income") mIncome += inTRY(t);
      else mExpense += inTRY(t);
    }
    return {
      label: format(month, "LLL", { locale: tr }),
      income: Math.round(mIncome),
      expense: Math.round(mExpense),
    };
  });

  // Bu ayın kategori bazlı gider dağılımı
  const byCategory = new Map<string, { name: string; color: string | null; value: number }>();
  for (const t of transactions) {
    if (t.type !== "expense" || monthKey(t.date) !== currentKey) continue;
    const name = t.categories?.name ?? "Kategorisiz";
    const entry = byCategory.get(name) ?? {
      name,
      color: t.categories?.color ?? null,
      value: 0,
    };
    entry.value += inTRY(t);
    byCategory.set(name, entry);
  }
  const categoryData = [...byCategory.values()].sort((a, b) => b.value - a.value);

  const recent = transactions.slice(0, 6).map((t) => ({
    id: t.id,
    type: t.type,
    amount: Number(t.amount),
    currency: t.currency.trim(),
    date: t.date,
    description: t.description,
    categoryName: t.categories?.name ?? "Kategorisiz",
    categoryColor: t.categories?.color ?? null,
  }));

  const firstName = profileData?.full_name?.split(" ")[0];
  const monthLabel = format(new Date(), "LLLL yyyy", { locale: tr });

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            {firstName ? `Merhaba, ${firstName} 👋` : "Merhaba 👋"}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {monthLabel} finansal özetiniz hazır.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <SubscriptionDialog
            categories={categories.filter((c) => c.type === "expense")}
            triggerVariant="outline"
          />
          <TransactionDialog categories={categories} />
        </div>
      </div>

      <StatCards income={income} expense={expense} />

      <div className="grid gap-4 lg:grid-cols-5">
        <TrendChart data={series} className="lg:col-span-3" />
        <CategoryDonut data={categoryData} className="lg:col-span-2" />
      </div>

      <RecentTransactions items={recent} />
    </div>
  );
}
