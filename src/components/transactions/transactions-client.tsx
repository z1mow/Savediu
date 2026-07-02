"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowDownLeft, ArrowUpRight, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TransactionDialog } from "@/components/transactions/transaction-dialog";
import { createClient } from "@/lib/supabase/client";
import { formatDate, formatMoney } from "@/lib/format";
import type { Category } from "@/lib/types";
import { cn } from "@/lib/utils";

interface TxItem {
  id: string;
  type: "income" | "expense";
  amount: number;
  currency: string;
  date: string;
  description: string | null;
  categoryName: string;
  categoryColor: string | null;
}

export function TransactionsClient({
  transactions,
  categories,
}: {
  transactions: TxItem[];
  categories: Category[];
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | "income" | "expense">("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = useMemo(
    () => (filter === "all" ? transactions : transactions.filter((t) => t.type === filter)),
    [transactions, filter]
  );

  async function handleDelete(id: string) {
    setDeletingId(id);
    const supabase = createClient();
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    setDeletingId(null);

    if (error) {
      toast.error("İşlem silinemedi");
      return;
    }
    toast.success("İşlem silindi");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">İşlemler</h1>
          <p className="mt-1 text-muted-foreground">
            Tüm gelir ve gider hareketleriniz.
          </p>
        </div>
        <TransactionDialog categories={categories} />
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
        <TabsList className="rounded-full">
          <TabsTrigger value="all" className="rounded-full px-4">
            Tümü
          </TabsTrigger>
          <TabsTrigger value="income" className="rounded-full px-4">
            Gelirler
          </TabsTrigger>
          <TabsTrigger value="expense" className="rounded-full px-4">
            Giderler
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="glass overflow-hidden rounded-3xl"
      >
        {filtered.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
            <p>Gösterilecek işlem yok.</p>
            <p>Sağ üstteki &quot;Yeni İşlem&quot; ile başlayın.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-6">İşlem</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Tarih</TableHead>
                <TableHead className="text-right">Tutar</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((t) => (
                <TableRow key={t.id} className="group">
                  <TableCell className="pl-6">
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          "flex size-9 shrink-0 items-center justify-center rounded-xl",
                          t.type === "income"
                            ? "bg-emerald-500/10 text-emerald-500"
                            : "bg-rose-500/10 text-rose-500"
                        )}
                      >
                        {t.type === "income" ? (
                          <ArrowUpRight className="size-4" />
                        ) : (
                          <ArrowDownLeft className="size-4" />
                        )}
                      </span>
                      <span className="max-w-52 truncate font-medium">
                        {t.description || t.categoryName}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                      <span
                        className="size-2 rounded-full"
                        style={{ background: t.categoryColor ?? "var(--muted-foreground)" }}
                      />
                      {t.categoryName}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(t.date)}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right tabular-nums font-semibold",
                      t.type === "income" ? "text-emerald-500" : "text-rose-500"
                    )}
                  >
                    {t.type === "income" ? "+" : "−"}
                    {formatMoney(t.amount, t.currency)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="İşlemi sil"
                      disabled={deletingId === t.id}
                      onClick={() => handleDelete(t.id)}
                      className="size-8 rounded-lg text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </motion.div>
    </div>
  );
}
