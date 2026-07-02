"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { format } from "date-fns";
import { Loader2, Plus } from "lucide-react";
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
import { createClient } from "@/lib/supabase/client";
import { CURRENCIES, type Category, type TransactionType } from "@/lib/types";
import { cn } from "@/lib/utils";

export function TransactionDialog({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<TransactionType>("expense");
  const [categoryId, setCategoryId] = useState<string>("");
  const [currency, setCurrency] = useState("TRY");

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
    const form = new FormData(e.currentTarget);
    const amount = Number(form.get("amount"));

    if (!amount || amount <= 0) {
      toast.error("Geçerli bir tutar girin");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase.from("transactions").insert({
      user_id: user!.id,
      type,
      amount,
      currency,
      category_id: categoryId || null,
      description: String(form.get("description") ?? "").trim() || null,
      date: String(form.get("date")),
    });

    setLoading(false);

    if (error) {
      toast.error("İşlem eklenemedi, lütfen tekrar deneyin");
      return;
    }

    toast.success(type === "income" ? "Gelir eklendi 🎉" : "Gider eklendi");
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-full shadow-lg shadow-primary/25">
          <Plus className="size-4" /> Yeni İşlem
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-3xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Yeni İşlem</DialogTitle>
          <DialogDescription>Gelir veya gider kaydı oluşturun.</DialogDescription>
        </DialogHeader>

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
              <Label htmlFor="amount">Tutar</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                min="0.01"
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
            <Label htmlFor="date">Tarih</Label>
            <Input
              id="date"
              name="date"
              type="date"
              defaultValue={format(new Date(), "yyyy-MM-dd")}
              required
              className="h-10 rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Açıklama (isteğe bağlı)</Label>
            <Input
              id="description"
              name="description"
              placeholder="örn. Haftalık market alışverişi"
              className="h-10 rounded-xl"
            />
          </div>

          <Button type="submit" disabled={loading} className="h-11 w-full rounded-xl">
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            Kaydet
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
