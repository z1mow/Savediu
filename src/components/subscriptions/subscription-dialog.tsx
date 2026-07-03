"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
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
import {
  BILLING_PERIODS,
  CURRENCIES,
  type BillingPeriod,
  type Category,
  type Subscription,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { SERVICE_PRESETS } from "./service-presets";

/**
 * Form, diyalog her açıldığında yeniden mount olur (Radix içerik
 * kapalıyken unmount eder); böylece state props'tan taze başlar.
 */
function SubscriptionForm({
  categories,
  subscription,
  onDone,
}: {
  categories: Category[];
  subscription?: Subscription;
  onDone: () => void;
}) {
  const router = useRouter();
  const isEdit = Boolean(subscription);

  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(subscription?.name ?? "");
  const [amount, setAmount] = useState(
    subscription ? String(subscription.amount) : ""
  );
  const [currency, setCurrency] = useState<string>(subscription?.currency ?? "TRY");
  const [period, setPeriod] = useState<BillingPeriod>(
    subscription?.billing_period ?? "monthly"
  );
  const [startDate, setStartDate] = useState(subscription?.next_billing_on ?? "");
  const [categoryId, setCategoryId] = useState(subscription?.category_id ?? "");

  function applyPreset(presetName: string) {
    setName(presetName);
    // Varsayılan "Abonelikler" kategorisi varsa otomatik seç
    const subsCategory = categories.find((c) => c.name === "Abonelikler");
    if (subsCategory && !categoryId) setCategoryId(subsCategory.id);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const parsedAmount = Number(amount);

    if (!name.trim()) {
      toast.error("Abonelik adı girin");
      return;
    }
    if (!parsedAmount || parsedAmount <= 0) {
      toast.error("Geçerli bir tutar girin");
      return;
    }
    if (!startDate) {
      toast.error(isEdit ? "Sonraki yenileme tarihini seçin" : "İlk ödeme tarihini seçin");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const payload = {
      name: name.trim(),
      amount: parsedAmount,
      currency,
      billing_period: period,
      next_billing_on: startDate,
      // aylıkta güne sadık kalmak için gün bilgisi saklanır
      billing_day: period === "monthly" ? new Date(startDate).getDate() : null,
      category_id: categoryId || null,
    };

    if (isEdit) {
      const { error } = await supabase
        .from("subscriptions")
        .update(payload)
        .eq("id", subscription!.id);
      setLoading(false);

      if (error) {
        toast.error("Abonelik güncellenemedi");
        return;
      }
      toast.success("Abonelik güncellendi");
      onDone();
      router.refresh();
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data: created, error } = await supabase
      .from("subscriptions")
      .insert({ ...payload, user_id: user!.id })
      .select("id")
      .single();

    if (error) {
      setLoading(false);
      toast.error("Abonelik eklenemedi");
      return;
    }

    // Başlangıç tarihi geçmişteyse, aradaki dönemleri ödeme geçmişine işle
    const { error: catchUpError } = await supabase.rpc("catch_up_subscription", {
      p_subscription_id: created.id,
    });
    setLoading(false);

    if (catchUpError) {
      toast.error("Abonelik eklendi ama geçmiş ödemeler işlenemedi");
      onDone();
      router.refresh();
      return;
    }

    toast.success("Abonelik eklendi ✨");
    onDone();
    router.refresh();
  }

  return (
    <>
      {!isEdit && (
        <div className="flex flex-wrap gap-2">
          {SERVICE_PRESETS.map((p) => (
            <button
              key={p.name}
              type="button"
              onClick={() => applyPreset(p.name)}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                name === p.name
                  ? "border-primary/50 bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
              )}
            >
              <span
                className={cn("size-2 rounded-full bg-gradient-to-br", p.gradient)}
              />
              {p.name}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="sub-name">Abonelik Adı</Label>
          <Input
            id="sub-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="örn. Netflix, Sunucu, Domain"
            required
            className="h-10 rounded-xl"
          />
        </div>

        <div className="grid grid-cols-5 gap-3">
          <div className="col-span-3 space-y-2">
            <Label htmlFor="sub-amount">Tutar</Label>
            <Input
              id="sub-amount"
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
            <Select value={currency} onValueChange={(v) => setCurrency(v ?? "TRY")}>
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

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Periyot</Label>
            <Select
              value={period}
              onValueChange={(v) => setPeriod(v as BillingPeriod)}
            >
              <SelectTrigger className="h-10 w-full rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BILLING_PERIODS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="sub-date">
              {isEdit ? "Sonraki Yenileme" : "İlk Ödeme Tarihi"}
            </Label>
            <DatePicker
              id="sub-date"
              value={startDate}
              onChange={setStartDate}
              fromDate={isEdit ? new Date() : undefined}
              placeholder="Tarih seçin"
            />
            {!isEdit && (
              <p className="text-xs text-muted-foreground">
                Geçmiş bir tarih seçerseniz aradaki ödemeler otomatik işlenir.
              </p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Kategori</Label>
          <Select value={categoryId} onValueChange={(v) => setCategoryId(v ?? "")}>
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

export function SubscriptionDialog({
  categories,
  subscription,
  triggerVariant = "default",
}: {
  categories: Category[];
  subscription?: Subscription; // verilirse düzenleme modu
  triggerVariant?: "default" | "outline";
}) {
  const [open, setOpen] = useState(false);
  const isEdit = Boolean(subscription);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          isEdit ? (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Aboneliği düzenle"
              onClick={(e) => e.stopPropagation()}
              className="size-8 rounded-lg text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-foreground"
            >
              <Pencil className="size-4" />
            </Button>
          ) : triggerVariant === "outline" ? (
            <Button variant="outline" className="rounded-full">
              <Plus className="size-4" /> Yeni Abonelik
            </Button>
          ) : (
            <Button className="rounded-full shadow-lg shadow-primary/25">
              <Plus className="size-4" /> Yeni Abonelik
            </Button>
          )
        }
      />
      <DialogContent
        className="rounded-3xl sm:max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <DialogHeader>
          <DialogTitle>{isEdit ? "Aboneliği Düzenle" : "Yeni Abonelik"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Abonelik bilgilerini güncelleyin."
              : "Sabit gideriniz, yenileme günü geldiğinde otomatik olarak giderlerinize eklenir."}
          </DialogDescription>
        </DialogHeader>
        <SubscriptionForm
          categories={categories}
          subscription={subscription}
          onDone={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
