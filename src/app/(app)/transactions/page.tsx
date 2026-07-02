import type { Metadata } from "next";
import { TransactionsClient } from "@/components/transactions/transactions-client";
import { createClient } from "@/lib/supabase/server";
import type { Category } from "@/lib/types";

export const metadata: Metadata = { title: "İşlemler" };

export default async function TransactionsPage() {
  const supabase = await createClient();

  const [{ data: txData }, { data: catData }] = await Promise.all([
    supabase
      .from("transactions")
      .select("id, type, amount, currency, date, description, category_id, categories(name, color)")
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(200),
    supabase.from("categories").select("*").order("name"),
  ]);

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
      categoryName: row.categories?.name ?? "Kategorisiz",
      categoryColor: row.categories?.color ?? null,
    };
  });

  return (
    <TransactionsClient
      transactions={transactions}
      categories={(catData ?? []) as Category[]}
    />
  );
}
