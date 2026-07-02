"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowDownLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate, formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

interface Item {
  id: string;
  type: "income" | "expense";
  amount: number;
  currency: string;
  date: string;
  description: string | null;
  categoryName: string;
  categoryColor: string | null;
}

export function RecentTransactions({ items }: { items: Item[] }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.36, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="glass rounded-3xl p-6"
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-medium">Son İşlemler</h2>
          <p className="text-sm text-muted-foreground">En güncel hareketleriniz</p>
        </div>
        <Button variant="ghost" size="sm" asChild className="rounded-full">
          <Link href="/transactions">
            Tümü <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="flex h-32 flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
          Henüz işlem yok
          <Button size="sm" asChild className="rounded-full">
            <Link href="/transactions">İlk işlemini ekle</Link>
          </Button>
        </div>
      ) : (
        <ul className="divide-y divide-border/60">
          {items.map((t) => (
            <li key={t.id} className="flex items-center gap-4 py-3.5">
              <span
                className={cn(
                  "flex size-10 items-center justify-center rounded-2xl",
                  t.type === "income"
                    ? "bg-emerald-500/10 text-emerald-500"
                    : "bg-rose-500/10 text-rose-500"
                )}
              >
                {t.type === "income" ? (
                  <ArrowUpRight className="size-4.5" />
                ) : (
                  <ArrowDownLeft className="size-4.5" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {t.description || t.categoryName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t.categoryName} · {formatDate(t.date)}
                </p>
              </div>
              <span
                className={cn(
                  "tabular-nums text-sm font-semibold",
                  t.type === "income" ? "text-emerald-500" : "text-rose-500"
                )}
              >
                {t.type === "income" ? "+" : "−"}
                {formatMoney(t.amount, t.currency)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </motion.section>
  );
}
