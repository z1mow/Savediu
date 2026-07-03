"use client";

import { useEffect, useState } from "react";
import { History, Loader2, Receipt, TrendingUp } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import { formatDate, formatMoney } from "@/lib/format";
import type { Subscription, SubscriptionPriceChange } from "@/lib/types";
import { cn } from "@/lib/utils";

interface HistoryRow {
  id: string;
  amount: number;
  currency: string;
  date: string;
  description: string | null;
}

/** Diyalog her açılışta yeniden mount olur; veri o anda çekilir. */
function HistoryContent({ subscription }: { subscription: Subscription }) {
  const [rows, setRows] = useState<HistoryRow[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    supabase
      .from("transactions")
      .select("id, amount, currency, date, description")
      .eq("subscription_id", subscription.id)
      .order("date", { ascending: false })
      .limit(60)
      .then(({ data }) => {
        if (cancelled) return;
        setRows(
          (data ?? []).map((r) => ({
            ...r,
            amount: Number(r.amount),
            currency: String(r.currency).trim(),
          }))
        );
      });

    return () => {
      cancelled = true;
    };
  }, [subscription.id]);

  if (rows === null) {
    return (
      <div className="flex h-32 items-center justify-center">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="flex h-32 flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
        <Receipt className="size-6 opacity-40" />
        Henüz ödeme kaydı yok — ilk yenileme gününü bekliyor.
      </div>
    );
  }

  const total = rows.reduce((sum, r) => sum + r.amount, 0);

  return (
    <>
      <div className="rounded-2xl bg-muted/50 px-4 py-3 text-sm">
        Toplam <span className="font-semibold">{rows.length}</span> ödeme ·{" "}
        <span className="font-semibold tabular-nums">
          {formatMoney(total, subscription.currency)}
        </span>
      </div>
      <ul className="max-h-72 divide-y divide-border/60 overflow-y-auto">
        {rows.map((r) => (
          <li key={r.id} className="flex items-center justify-between py-2.5 text-sm">
            <span className="text-muted-foreground">{formatDate(r.date)}</span>
            <span className="tabular-nums font-medium text-rose-600 dark:text-rose-400">
              −{formatMoney(r.amount, r.currency)}
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}

function PriceChangeList({ changes }: { changes: SubscriptionPriceChange[] }) {
  if (changes.length === 0) return null;

  return (
    <div>
      <p className="mb-2 flex items-center gap-1.5 text-sm font-medium">
        <TrendingUp className="size-4 text-primary" /> Fiyat Geçmişi
      </p>
      <ul className="space-y-1.5">
        {[...changes].reverse().map((c, i) => {
          const pct =
            c.old_amount > 0
              ? Math.round(((c.new_amount - c.old_amount) / c.old_amount) * 100)
              : 0;
          return (
            <li
              key={`${c.changed_at}-${i}`}
              className="flex items-center justify-between rounded-xl bg-muted/50 px-3 py-2 text-sm"
            >
              <span className="text-muted-foreground">{formatDate(c.changed_at)}</span>
              <span className="tabular-nums">
                {formatMoney(c.old_amount, c.currency)} →{" "}
                <span className="font-medium">{formatMoney(c.new_amount, c.currency)}</span>{" "}
                <span
                  className={cn(
                    "text-xs font-medium",
                    pct > 0
                      ? "text-rose-600 dark:text-rose-400"
                      : "text-emerald-600 dark:text-emerald-400"
                  )}
                >
                  ({pct > 0 ? "+" : ""}%{pct})
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function SubscriptionHistoryDialog({
  subscription,
  priceChanges,
  onClose,
}: {
  subscription: Subscription | null;
  priceChanges: SubscriptionPriceChange[];
  onClose: () => void;
}) {
  return (
    <Dialog open={Boolean(subscription)} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="rounded-3xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="size-5 text-primary" />
            {subscription?.name} · Geçmiş
          </DialogTitle>
          <DialogDescription>
            Otomatik işlenen ödemeler ve fiyat değişiklikleri.
          </DialogDescription>
        </DialogHeader>
        {subscription && (
          <>
            <PriceChangeList changes={priceChanges} />
            <HistoryContent key={subscription.id} subscription={subscription} />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
