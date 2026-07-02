"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import {
  BellRing,
  CalendarClock,
  CalendarRange,
  CreditCard,
  Repeat,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { createClient } from "@/lib/supabase/client";
import { formatDate, formatMoney } from "@/lib/format";
import {
  BILLING_PERIODS,
  toTRY,
  type BillingPeriod,
  type Category,
  type ExchangeRate,
  type Subscription,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { SubscriptionDialog } from "./subscription-dialog";
import { SubscriptionHistoryDialog } from "./subscription-history-dialog";
import { gradientFor } from "./service-presets";

const easing = [0.22, 1, 0.36, 1] as const;

function periodInfo(period: BillingPeriod) {
  return BILLING_PERIODS.find((p) => p.value === period) ?? BILLING_PERIODS[1];
}

/** Yenilemeye kaç gün kaldı? (0 = bugün) */
function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

function daysLabel(days: number): string {
  if (days <= 0) return "bugün";
  if (days === 1) return "yarın";
  return `${days} gün sonra`;
}

/** Yenileme tarihini periyoduna göre bir dönem ileri alır (cron'daki mantığın aynısı). */
function advanceBillingDate(d: Date, period: BillingPeriod, billingDay: number | null): Date {
  if (period === "weekly") {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7);
  }
  if (period === "yearly") {
    const next = new Date(d);
    next.setFullYear(next.getFullYear() + 1);
    return next;
  }
  const nextMonth = new Date(d.getFullYear(), d.getMonth() + 1, 1);
  const daysInNext = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0).getDate();
  nextMonth.setDate(Math.min(billingDay ?? d.getDate(), daysInNext));
  return nextMonth;
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
  const [historySub, setHistorySub] = useState<Subscription | null>(null);

  const active = subscriptions.filter((s) => s.is_active);

  // Aylık normalize yük ve yıllık projeksiyon (hepsi ₺)
  const monthlyLoad = active.reduce(
    (sum, s) => sum + toTRY(s.amount, s.currency, rates) * periodInfo(s.billing_period).perMonth,
    0
  );
  const yearlyLoad = monthlyLoad * 12;

  // Önümüzdeki 7 günün yenilemeleri
  const upcoming = active
    .map((s) => ({ sub: s, days: daysUntil(s.next_billing_on) }))
    .filter(({ days }) => days >= 0 && days <= 7)
    .sort((a, b) => a.days - b.days);

  async function toggleActive(sub: Subscription) {
    setBusyId(sub.id);
    const supabase = createClient();

    const updates: { is_active: boolean; next_billing_on?: string } = {
      is_active: !sub.is_active,
    };

    // Duraklatılmış abonelik geri açılırken tarihi geçmişte kalmışsa,
    // geriye dönük faturalama olmaması için tarihi ileri sar.
    if (!sub.is_active) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      let next = new Date(sub.next_billing_on);
      next.setHours(0, 0, 0, 0);
      while (next <= today) {
        next = advanceBillingDate(next, sub.billing_period, sub.billing_day);
      }
      updates.next_billing_on = format(next, "yyyy-MM-dd");
    }

    const { error } = await supabase
      .from("subscriptions")
      .update(updates)
      .eq("id", sub.id);
    setBusyId(null);

    if (error) {
      toast.error("Abonelik güncellenemedi");
      return;
    }
    toast.success(sub.is_active ? "Abonelik duraklatıldı" : "Abonelik aktif");
    router.refresh();
  }

  async function handleDelete(sub: Subscription) {
    setBusyId(sub.id);
    const supabase = createClient();
    const { error } = await supabase.from("subscriptions").delete().eq("id", sub.id);
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
        <SubscriptionDialog categories={categories} />
      </div>

      {/* Aylık yük + yıllık projeksiyon */}
      <div className="grid gap-4 sm:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: easing }}
          className="glass flex items-center gap-4 rounded-3xl p-6"
        >
          <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <CreditCard className="size-5" />
          </span>
          <div>
            <p className="text-sm text-muted-foreground">Aylık abonelik yükü</p>
            <p className="text-2xl font-semibold tabular-nums">
              {formatMoney(monthlyLoad, "TRY")}
              <span className="ml-2 text-sm font-normal text-muted-foreground">/ ay</span>
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06, duration: 0.45, ease: easing }}
          className="glass flex items-center gap-4 rounded-3xl p-6"
        >
          <span className="flex size-11 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
            <CalendarRange className="size-5" />
          </span>
          <div>
            <p className="text-sm text-muted-foreground">Yıllık projeksiyon</p>
            <p className="text-2xl font-semibold tabular-nums">
              {formatMoney(yearlyLoad, "TRY")}
              <span className="ml-2 text-sm font-normal text-muted-foreground">/ yıl</span>
            </p>
          </div>
        </motion.div>
      </div>

      {/* Yaklaşan yenilemeler */}
      {upcoming.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.45, ease: easing }}
          className="glass rounded-3xl p-5"
        >
          <p className="flex items-center gap-2 text-sm font-medium">
            <BellRing className="size-4 text-amber-500" />
            Önümüzdeki 7 gün
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {upcoming.map(({ sub, days }) => (
              <button
                key={sub.id}
                onClick={() => setHistorySub(sub)}
                className="flex items-center gap-2 rounded-full border border-border/60 bg-background/40 px-3.5 py-1.5 text-sm transition-colors hover:border-primary/40"
              >
                <span
                  className={cn(
                    "size-2 rounded-full bg-gradient-to-br",
                    gradientFor(sub.name)
                  )}
                />
                <span className="font-medium">{sub.name}</span>
                <span
                  className={cn(
                    "text-xs",
                    days <= 1 ? "font-medium text-amber-500" : "text-muted-foreground"
                  )}
                >
                  {daysLabel(days)}
                </span>
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Abonelik kartları */}
      {subscriptions.length === 0 ? (
        <div className="glass flex h-52 flex-col items-center justify-center gap-3 rounded-3xl text-sm text-muted-foreground">
          <Repeat className="size-8 opacity-40" />
          <p>Henüz abonelik eklemediniz.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {subscriptions.map((sub, i) => {
            const info = periodInfo(sub.billing_period);
            const days = daysUntil(sub.next_billing_on);
            return (
              <motion.div
                key={sub.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * i, duration: 0.45, ease: easing }}
                onClick={() => setHistorySub(sub)}
                className={cn(
                  "glass group cursor-pointer rounded-3xl p-6 transition-all duration-300 hover:-translate-y-0.5",
                  !sub.is_active && "opacity-55 saturate-50"
                )}
              >
                <div className="flex items-start justify-between">
                  <span
                    className={cn(
                      "flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br text-base font-semibold text-white shadow-md",
                      gradientFor(sub.name)
                    )}
                  >
                    {sub.name.charAt(0).toUpperCase()}
                  </span>
                  <div
                    className="flex items-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Switch
                      checked={sub.is_active}
                      disabled={busyId === sub.id}
                      onCheckedChange={() => toggleActive(sub)}
                      aria-label="Aboneliği aktif/pasif yap"
                    />
                    <SubscriptionDialog categories={categories} subscription={sub} />
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Aboneliği sil"
                      disabled={busyId === sub.id}
                      onClick={() => handleDelete(sub)}
                      className="size-8 rounded-lg text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <h3 className="font-medium">{sub.name}</h3>
                  {sub.billing_period !== "monthly" && (
                    <Badge variant="secondary" className="rounded-full text-[11px]">
                      {info.label}
                    </Badge>
                  )}
                </div>
                <p className="mt-0.5 text-2xl font-semibold tabular-nums">
                  {formatMoney(sub.amount, sub.currency)}
                  <span className="ml-1.5 text-sm font-normal text-muted-foreground">
                    / {info.suffix}
                  </span>
                </p>

                <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <CalendarClock className="size-3.5" />
                    {sub.is_active ? (
                      <>Sonraki: {formatDate(sub.next_billing_on)}</>
                    ) : (
                      <>Duraklatıldı</>
                    )}
                  </span>
                  {sub.is_active && days >= 0 && days <= 7 && (
                    <Badge
                      variant="secondary"
                      className="rounded-full bg-amber-500/10 text-[11px] text-amber-600 dark:text-amber-400"
                    >
                      {daysLabel(days)}
                    </Badge>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <SubscriptionHistoryDialog
        subscription={historySub}
        onClose={() => setHistorySub(null)}
      />
    </div>
  );
}
