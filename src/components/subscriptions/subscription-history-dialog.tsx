"use client";

import { useEffect, useState } from "react";
import { History, Loader2, Receipt } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import { formatDate, formatMoney } from "@/lib/format";
import type { Subscription } from "@/lib/types";

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

export function SubscriptionHistoryDialog({
  subscription,
  onClose,
}: {
  subscription: Subscription | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={Boolean(subscription)} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="rounded-3xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="size-5 text-primary" />
            {subscription?.name} · Ödeme Geçmişi
          </DialogTitle>
          <DialogDescription>
            Bu aboneliğin otomatik işlenen ödemeleri.
          </DialogDescription>
        </DialogHeader>
        {subscription && (
          <HistoryContent key={subscription.id} subscription={subscription} />
        )}
      </DialogContent>
    </Dialog>
  );
}
