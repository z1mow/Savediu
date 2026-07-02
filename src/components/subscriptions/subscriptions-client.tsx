"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { CalendarClock, CreditCard, Loader2, Plus, Repeat, Trash2 } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import { createClient } from "@/lib/supabase/client";
import { formatDate, formatMoney } from "@/lib/format";
import { CURRENCIES, toTRY, type Category, type ExchangeRate, type Subscription } from "@/lib/types";
import { cn } from "@/lib/utils";

const CARD_GRADIENTS = [
  "from-indigo-500 to-violet-500",
  "from-emerald-500 to-teal-500",
  "from-rose-500 to-orange-500",
  "from-sky-500 to-blue-500",
  "from-fuchsia-500 to-pink-500",
  "from-amber-500 to-yellow-500",
];

/** Bu abonelik bir sonraki hangi tarihte yenilenir? */
function nextBillingDate(sub: Subscription): Date {
  const now = new Date();
  const billedThisMonth =
    sub.last_billed_on &&
    new Date(sub.last_billed_on).getMonth() === now.getMonth() &&
    new Date(sub.last_billed_on).getFullYear() === now.getFullYear();

  const target = new Date(now.getFullYear(), now.getMonth(), 1);
  if (billedThisMonth || now.getDate() > sub.billing_day) {
    target.setMonth(target.getMonth() + 1);
  }
  const daysInTarget = new Date(
    target.getFullYear(),
    target.getMonth() + 1,
    0
  ).getDate();
  target.setDate(Math.min(sub.billing_day, daysInTarget));
  return target;
}

function AddSubscriptionDialog({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currency, setCurrency] = useState("TRY");
  const [categoryId, setCategoryId] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const amount = Number(form.get("amount"));
    const billingDay = Number(form.get("billing_day"));

    if (!amount || amount <= 0) {
      toast.error("Geçerli bir tutar girin");
      return;
    }
    if (!billingDay || billingDay < 1 || billingDay > 31) {
      toast.error("Yenileme günü 1-31 arasında olmalı");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase.from("subscriptions").insert({
      user_id: user!.id,
      name: String(form.get("name")).trim(),
      amount,
      currency,
      billing_day: billingDay,
      category_id: categoryId || null,
    });

    setLoading(false);

    if (error) {
      toast.error("Abonelik eklenemedi, lütfen tekrar deneyin");
      return;
    }

    toast.success("Abonelik eklendi ✨");
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-full shadow-lg shadow-primary/25">
          <Plus className="size-4" /> Yeni Abonelik
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-3xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Yeni Abonelik</DialogTitle>
          <DialogDescription>
            Sabit gideriniz her ay belirlediğiniz günde otomatik olarak
            giderlerinize eklenir.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Abonelik Adı</Label>
            <Input
              id="name"
              name="name"
              placeholder="örn. Netflix, Spotify, Sunucu"
              required
              className="h-10 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-5 gap-3">
            <div className="col-span-3 space-y-2">
              <Label htmlFor="amount">Aylık Tutar</Label>
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
            <Label htmlFor="billing_day">Yenileme Günü (ayın kaçı?)</Label>
            <Input
              id="billing_day"
              name="billing_day"
              type="number"
              min="1"
              max="31"
              placeholder="örn. 15"
              required
              className="h-10 rounded-xl tabular-nums"
            />
          </div>

          <div className="space-y-2">
            <Label>Kategori</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="h-10 w-full rounded-xl">
                <SelectValue placeholder="Kategori seçin" />
              </SelectTrigger>
              <SelectContent>
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

export function SubscriptionsClient({
  subscriptions,
  categories,
  rates,
}: {
  subscriptions: Subscription[];
  categories: Category[];
  rates: Pick<ExchangeRate, "code" | "rate_to_try">[];
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  const monthlyTotal = subscriptions
    .filter((s) => s.is_active)
    .reduce((sum, s) => sum + toTRY(s.amount, s.currency, rates), 0);

  async function toggleActive(sub: Subscription) {
    setBusyId(sub.id);
    const supabase = createClient();
    const { error } = await supabase
      .from("subscriptions")
      .update({ is_active: !sub.is_active })
      .eq("id", sub.id);
    setBusyId(null);

    if (error) {
      toast.error("Abonelik güncellenemedi");
      return;
    }
    toast.success(sub.is_active ? "Abonelik duraklatıldı" : "Abonelik aktif");
    router.refresh();
  }

  async function handleDelete(id: string) {
    setBusyId(id);
    const supabase = createClient();
    const { error } = await supabase.from("subscriptions").delete().eq("id", id);
    setBusyId(null);

    if (error) {
      toast.error("Abonelik silinemedi");
      return;
    }
    toast.success("Abonelik silindi");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Aboneliklerim</h1>
          <p className="mt-1 text-muted-foreground">
            Sabit giderleriniz — günü gelince otomatik işlenir.
          </p>
        </div>
        <AddSubscriptionDialog categories={categories} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="glass flex items-center gap-4 rounded-3xl p-6"
      >
        <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <CreditCard className="size-5" />
        </span>
        <div>
          <p className="text-sm text-muted-foreground">Aktif aboneliklerin aylık yükü</p>
          <p className="text-2xl font-semibold tabular-nums">
            {formatMoney(monthlyTotal, "TRY")}
            <span className="ml-2 text-sm font-normal text-muted-foreground">/ ay</span>
          </p>
        </div>
      </motion.div>

      {subscriptions.length === 0 ? (
        <div className="glass flex h-52 flex-col items-center justify-center gap-3 rounded-3xl text-sm text-muted-foreground">
          <Repeat className="size-8 opacity-40" />
          <p>Henüz abonelik eklemediniz.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {subscriptions.map((sub, i) => (
            <motion.div
              key={sub.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                "glass group rounded-3xl p-6 transition-all duration-300 hover:-translate-y-0.5",
                !sub.is_active && "opacity-55 saturate-50"
              )}
            >
              <div className="flex items-start justify-between">
                <span
                  className={cn(
                    "flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br text-base font-semibold text-white shadow-md",
                    CARD_GRADIENTS[i % CARD_GRADIENTS.length]
                  )}
                >
                  {sub.name.charAt(0).toUpperCase()}
                </span>
                <div className="flex items-center gap-1">
                  <Switch
                    checked={sub.is_active}
                    disabled={busyId === sub.id}
                    onCheckedChange={() => toggleActive(sub)}
                    aria-label="Aboneliği aktif/pasif yap"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Aboneliği sil"
                    disabled={busyId === sub.id}
                    onClick={() => handleDelete(sub.id)}
                    className="size-8 rounded-lg text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>

              <h3 className="mt-4 font-medium">{sub.name}</h3>
              <p className="mt-0.5 text-2xl font-semibold tabular-nums">
                {formatMoney(sub.amount, sub.currency)}
                <span className="ml-1.5 text-sm font-normal text-muted-foreground">/ ay</span>
              </p>

              <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                <CalendarClock className="size-3.5" />
                {sub.is_active ? (
                  <>Sonraki yenileme: {formatDate(nextBillingDate(sub))}</>
                ) : (
                  <>Duraklatıldı</>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
