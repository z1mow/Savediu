"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { format } from "date-fns";
import { Loader2, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/date-picker";
import { createClient } from "@/lib/supabase/client";
import { CURRENCIES, type Category, type TransactionType } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface EditableTransaction {
  id: string;
  type: TransactionType;
  amount: number;
  currency: string;
  category_id: string | null;
  date: string;
  description: string | null;
}

/** Form, diyalog her açıldığında yeniden mount olur; state props'tan taze başlar. */
function TransactionForm({
  categories,
  transaction,
  onDone,
}: {
  categories: Category[];
  transaction?: EditableTransaction;
  onDone: () => void;
}) {
  const router = useRouter();
  const isEdit = Boolean(transaction);

  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<TransactionType>(transaction?.type ?? "expense");
  const [amount, setAmount] = useState(transaction ? String(transaction.amount) : "");
  const [currency, setCurrency] = useState(transaction?.currency ?? "TRY");
  const [categoryId, setCategoryId] = useState(transaction?.category_id ?? "");
  const [date, setDate] = useState(
    transaction?.date ?? format(new Date(), "yyyy-MM-dd")
  );
  const [description, setDescription] = useState(transaction?.description ?? "");

  const filteredCategories = useMemo(
    () => categories.filter((c) => c.type === type),
    [categories, type]
  );

  function switchType(next: TransactionType) {
    setType(next);
    setCategoryId("");
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const parsedAmount = Number(amount);

    if (!parsedAmount || parsedAmount <= 0) {
      toast.error("Geçerli bir tutar girin");
      return;
    }
    if (!date) {
      toast.error("Tarih seçin");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const payload = {
      type,
      amount: parsedAmount,
      currency,
      category_id: categoryId || null,
      description: description.trim() || null,
      date,
    };

    let error;
    if (isEdit) {
      ({ error } = await supabase
        .from("transactions")
        .update(payload)
        .eq("id", transaction!.id));
    } else {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      ({ error } = await supabase
        .from("transactions")
        .insert({ ...payload, user_id: user!.id }));
    }

    setLoading(false);

    if (error) {
      toast.error(isEdit ? "İşlem güncellenemedi" : "İşlem eklenemedi");
      return;
    }

    toast.success(
      isEdit ? "İşlem güncellendi" : type === "income" ? "Gelir eklendi 🎉" : "Gider eklendi"
    );
    onDone();
    router.refresh();
  }

  return (
    <>
      {/* Gelir / Gider seçici */}
      <div className="grid grid-cols-2 gap-1 rounded-2xl bg-muted p-1">
        {(
          [
            ["expense", "Gider"],
            ["income", "Gelir"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => switchType(value)}
            className={cn(
              "rounded-xl py-2 text-sm font-medium transition-all",
              type === value
                ? value === "income"
                  ? "bg-background shadow-sm text-emerald-600 dark:text-emerald-400"
                  : "bg-background shadow-sm text-rose-600 dark:text-rose-400"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-5 gap-3">
          <div className="col-span-3 space-y-2">
            <Label htmlFor="tx-amount">Tutar</Label>
            <Input
              id="tx-amount"
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0,00"
              required
              className="h-10 rounded-xl tabular-nums"
            />
          </div>
          <div className="col-span-2 space-y-2">
            <Label>Para Birimi</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger className="h-10 w-full rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.symbol} {c.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Kategori</Label>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger className="h-10 w-full rounded-xl">
              <SelectValue placeholder="Kategori seçin" />
            </SelectTrigger>
            <SelectContent>
              {filteredCategories.map((c) => (
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
        </div>

        <div className="space-y-2">
          <Label htmlFor="tx-date">Tarih</Label>
          <DatePicker id="tx-date" value={date} onChange={setDate} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tx-description">Açıklama (isteğe bağlı)</Label>
          <Input
            id="tx-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="örn. Haftalık market alışverişi"
            className="h-10 rounded-xl"
          />
        </div>

        <Button type="submit" disabled={loading} className="h-11 w-full rounded-xl">
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : isEdit ? (
            <Pencil className="size-4" />
          ) : (
            <Plus className="size-4" />
          )}
          {isEdit ? "Güncelle" : "Kaydet"}
        </Button>
      </form>
    </>
  );
}

export function TransactionDialog({
  categories,
  transaction,
}: {
  categories: Category[];
  transaction?: EditableTransaction; // verilirse düzenleme modu
}) {
  const [open, setOpen] = useState(false);
  const isEdit = Boolean(transaction);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEdit ? (
          <Button
            variant="ghost"
            size="icon"
            aria-label="İşlemi düzenle"
            className="size-8 rounded-lg text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-foreground"
          >
            <Pencil className="size-4" />
          </Button>
        ) : (
          <Button className="rounded-full shadow-lg shadow-primary/25">
            <Plus className="size-4" /> Yeni İşlem
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="rounded-3xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "İşlemi Düzenle" : "Yeni İşlem"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "İşlem bilgilerini güncelleyin." : "Gelir veya gider kaydı oluşturun."}
          </DialogDescription>
        </DialogHeader>
        <TransactionForm
          categories={categories}
          transaction={transaction}
          onDone={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
