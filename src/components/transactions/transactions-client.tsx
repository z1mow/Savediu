"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { addMonths, format, isSameMonth } from "date-fns";
import { tr } from "date-fns/locale";
import { motion } from "framer-motion";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CategoryManager } from "@/components/categories/category-manager";
import {
  TransactionDialog,
  type EditableTransaction,
} from "@/components/transactions/transaction-dialog";
import { createClient } from "@/lib/supabase/client";
import { formatDate, formatMoney } from "@/lib/format";
import { CURRENCIES, toTRY, type Category, type ExchangeRate } from "@/lib/types";
import { cn } from "@/lib/utils";

interface TxItem extends EditableTransaction {
  categoryName: string;
  categoryColor: string | null;
}

const easing = [0.22, 1, 0.36, 1] as const;

export function TransactionsClient({
  transactions,
  categories,
  rates,
  month,
  summary,
}: {
  transactions: TxItem[];
  categories: Category[];
  rates: Pick<ExchangeRate, "code" | "rate_to_try">[];
  month: string; // yyyy-MM
  summary: { income: number; expense: number };
}) {
  const router = useRouter();
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">("all");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [currencyFilter, setCurrencyFilter] = useState("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const monthDate = new Date(`${month}-01T00:00:00`);
  const isCurrentMonth = isSameMonth(monthDate, new Date());

  function goToMonth(delta: number) {
    const target = format(addMonths(monthDate, delta), "yyyy-MM");
    router.push(`/transactions?month=${target}`);
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLocaleLowerCase("tr");
    return transactions.filter((t) => {
      if (typeFilter !== "all" && t.type !== typeFilter) return false;
      if (categoryFilter !== "all" && t.category_id !== categoryFilter) return false;
      if (currencyFilter !== "all" && t.currency !== currencyFilter) return false;
      if (
        q &&
        !(t.description ?? "").toLocaleLowerCase("tr").includes(q) &&
        !t.categoryName.toLocaleLowerCase("tr").includes(q)
      )
        return false;
      return true;
    });
  }, [transactions, typeFilter, categoryFilter, currencyFilter, search]);

  const hasActiveFilter =
    typeFilter !== "all" ||
    categoryFilter !== "all" ||
    currencyFilter !== "all" ||
    search.trim() !== "";

  // Filtrelenen sonucun net toplamı (₺)
  const filteredNet = useMemo(
    () =>
      filtered.reduce((sum, t) => {
        const val = toTRY(t.amount, t.currency, rates);
        return sum + (t.type === "income" ? val : -val);
      }, 0),
    [filtered, rates]
  );

  function clearFilters() {
    setTypeFilter("all");
    setCategoryFilter("all");
    setCurrencyFilter("all");
    setSearch("");
  }

  async function handleDelete(t: TxItem) {
    setDeletingId(t.id);
    const supabase = createClient();
    const { error } = await supabase.from("transactions").delete().eq("id", t.id);
    setDeletingId(null);

    if (error) {
      toast.error("İşlem silinemedi");
      return;
    }

    router.refresh();
    toast.success("İşlem silindi", {
      duration: 6000,
      action: {
        label: "Geri Al",
        onClick: async () => {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          const { error: restoreError } = await supabase.from("transactions").insert({
            id: t.id,
            user_id: user!.id,
            type: t.type,
            amount: t.amount,
            currency: t.currency,
            category_id: t.category_id,
            description: t.description,
            date: t.date,
          });
          if (restoreError) {
            toast.error("Geri alınamadı");
            return;
          }
          toast.success("İşlem geri alındı");
          router.refresh();
        },
      },
    });
  }

  const net = summary.income - summary.expense;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">İşlemler</h1>
          <p className="mt-1 text-muted-foreground">
            Tüm gelir ve gider hareketleriniz.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CategoryManager categories={categories} />
          <TransactionDialog categories={categories} />
        </div>
      </div>

      {/* Ay gezinme + dönem özeti */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: easing }}
        className="glass flex flex-wrap items-center justify-between gap-4 rounded-3xl px-5 py-4"
      >
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Önceki ay"
            onClick={() => goToMonth(-1)}
            className="size-9 rounded-full"
          >
            <ChevronLeft className="size-4.5" />
          </Button>
          <span className="min-w-32 text-center font-medium capitalize">
            {format(monthDate, "LLLL yyyy", { locale: tr })}
          </span>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Sonraki ay"
            disabled={isCurrentMonth}
            onClick={() => goToMonth(1)}
            className="size-9 rounded-full"
          >
            <ChevronRight className="size-4.5" />
          </Button>
        </div>

        <div className="flex items-center gap-6 text-sm">
          <span>
            <span className="text-muted-foreground">Gelir </span>
            <span className="font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
              +{formatMoney(summary.income, "TRY")}
            </span>
          </span>
          <span>
            <span className="text-muted-foreground">Gider </span>
            <span className="font-semibold tabular-nums text-rose-600 dark:text-rose-400">
              −{formatMoney(summary.expense, "TRY")}
            </span>
          </span>
          <span>
            <span className="text-muted-foreground">Net </span>
            <span
              className={cn(
                "font-semibold tabular-nums",
                net >= 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400"
              )}
            >
              {net < 0 && "−"}
              {formatMoney(Math.abs(net), "TRY")}
            </span>
          </span>
        </div>
      </motion.div>

      {/* Arama ve filtreler */}
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative min-w-52 flex-1 sm:max-w-xs">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Açıklama veya kategori ara…"
            className="h-10 rounded-full pl-9"
          />
        </div>

        <Tabs
          value={typeFilter}
          onValueChange={(v) => setTypeFilter(v as typeof typeFilter)}
        >
          <TabsList className="rounded-full">
            <TabsTrigger value="all" className="rounded-full px-4">
              Tümü
            </TabsTrigger>
            <TabsTrigger value="income" className="rounded-full px-4">
              Gelir
            </TabsTrigger>
            <TabsTrigger value="expense" className="rounded-full px-4">
              Gider
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v ?? "all")}>
          <SelectTrigger className="h-10 w-40 rounded-full">
            <SelectValue placeholder="Kategori" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm kategoriler</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                <span className="flex items-center gap-2">
                  <span
                    className="size-2 rounded-full"
                    style={{ background: c.color ?? "var(--muted-foreground)" }}
                  />
                  {c.name}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={currencyFilter} onValueChange={(v) => setCurrencyFilter(v ?? "all")}>
          <SelectTrigger className="h-10 w-28 rounded-full">
            <SelectValue placeholder="Döviz" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tümü</SelectItem>
            {CURRENCIES.map((c) => (
              <SelectItem key={c.code} value={c.code}>
                {c.symbol} {c.code}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilter && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="rounded-full text-muted-foreground"
          >
            <X className="size-3.5" /> Temizle
          </Button>
        )}
      </div>

      {hasActiveFilter && (
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{filtered.length}</span> işlem
          bulundu · net{" "}
          <span
            className={cn(
              "font-medium tabular-nums",
              filteredNet >= 0
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-rose-600 dark:text-rose-400"
            )}
          >
            {filteredNet < 0 && "−"}
            {formatMoney(Math.abs(filteredNet), "TRY")}
          </span>
        </p>
      )}

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.45, ease: easing }}
        className="glass overflow-hidden rounded-3xl"
      >
        {filtered.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
            {transactions.length === 0 ? (
              <>
                <p>Bu ayda işlem yok.</p>
                <p>Sağ üstteki &quot;Yeni İşlem&quot; ile ekleyin.</p>
              </>
            ) : (
              <p>Filtrelere uyan işlem bulunamadı.</p>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-6">İşlem</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Tarih</TableHead>
                <TableHead className="text-right">Tutar</TableHead>
                <TableHead className="w-20" />
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
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
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
                      t.type === "income"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-rose-600 dark:text-rose-400"
                    )}
                  >
                    {t.type === "income" ? "+" : "−"}
                    {formatMoney(t.amount, t.currency)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-0.5 pr-2">
                      <TransactionDialog categories={categories} transaction={t} />
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="İşlemi sil"
                        disabled={deletingId === t.id}
                        onClick={() => handleDelete(t)}
                        className="size-8 rounded-lg text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
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
