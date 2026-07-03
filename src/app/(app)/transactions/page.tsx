import type { Metadata } from "next";
import { addMonths, format, isValid, parse } from "date-fns";
import { TransactionsClient } from "@/components/transactions/transactions-client";
import { createClient } from "@/lib/supabase/server";
import { toTRY, type Category, type ExchangeRate } from "@/lib/types";

export const metadata: Metadata = { title: "İşlemler" };

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month: monthParam } = await searchParams;

  // ?month=yyyy-MM — geçersizse içinde bulunulan ay
  const parsed = monthParam
    ? parse(monthParam, "yyyy-MM", new Date())
    : new Date();
  const monthDate = isValid(parsed) ? parsed : new Date();
  const month = format(monthDate, "yyyy-MM");
  const rangeStart = `${month}-01`;
  const rangeEnd = format(addMonths(new Date(rangeStart), 1), "yyyy-MM-dd");

  const supabase = await createClient();

  const [{ data: txData }, { data: catData }, { data: ratesData }] =
    await Promise.all([
      supabase
        .from("transactions")
        .select(
          "id, type, amount, currency, date, description, category_id, categories(name, color)"
        )
        .gte("date", rangeStart)
        .lt("date", rangeEnd)
        .order("date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(500),
      supabase.from("categories").select("*").order("name"),
      supabase.from("exchange_rates").select("code, rate_to_try"),
    ]);

  const rates = (ratesData ?? []) as Pick<ExchangeRate, "code" | "rate_to_try">[];

  const transactions = (txData ?? []).map((t) => {
    const row = t as unknown as {
      id: string;
      type: "income" | "expense";
      amount: number;
      currency: string;
      date: string;
      description: string | null;
      category_id: string | null;
      categories: { name: string; color: string | null } | null;
    };
    return {
      id: row.id,
      type: row.type,
      amount: Number(row.amount),
      currency: row.currency.trim(),
      date: row.date,
      description: row.description,
      category_id: row.category_id,
      categoryName: row.categories?.name ?? "Kategorisiz",
      categoryColor: row.categories?.color ?? null,
    };
  });

  // Ay özeti (₺ karşılığıyla)
  let income = 0;
  let expense = 0;
  for (const t of transactions) {
    const val = toTRY(t.amount, t.currency, rates);
    if (t.type === "income") income += val;
    else expense += val;
  }

  return (
    <TransactionsClient
      transactions={transactions}
      categories={(catData ?? []) as Category[]}
      rates={rates}
      month={month}
      summary={{ income, expense }}
    />
  );
}
