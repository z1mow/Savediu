"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeftRight,
  BadgeDollarSign,
  Loader2,
  MoreHorizontal,
  Repeat,
  Save,
  ShieldCheck,
  ShieldOff,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createClient } from "@/lib/supabase/client";
import { formatDate, formatMoney } from "@/lib/format";
import type { Currency, Role } from "@/lib/types";
import { cn } from "@/lib/utils";

interface AdminUser {
  id: string;
  fullName: string | null;
  email: string | null;
  role: Role;
  createdAt: string;
  txCount: number;
}

interface Stats {
  totalUsers: number;
  totalTransactions: number;
  totalVolume: number;
  activeSubscriptions: number;
}

interface RateRow {
  code: Currency;
  rate_to_try: number;
  updated_at: string;
}

const easing = [0.22, 1, 0.36, 1] as const;

function StatGrid({ stats }: { stats: Stats }) {
  const cards = [
    {
      title: "Toplam Kullanıcı",
      value: new Intl.NumberFormat("tr-TR").format(stats.totalUsers),
      icon: Users,
      accent: "text-primary bg-primary/10",
    },
    {
      title: "Toplam İşlem",
      value: new Intl.NumberFormat("tr-TR").format(stats.totalTransactions),
      icon: ArrowLeftRight,
      accent: "text-sky-500 bg-sky-500/10",
    },
    {
      title: "Toplam Hacim (₺)",
      value: new Intl.NumberFormat("tr-TR", {
        notation: "compact",
        maximumFractionDigits: 1,
      }).format(stats.totalVolume),
      icon: BadgeDollarSign,
      accent: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10",
    },
    {
      title: "Aktif Abonelik",
      value: new Intl.NumberFormat("tr-TR").format(stats.activeSubscriptions),
      icon: Repeat,
      accent: "text-violet-500 bg-violet-500/10",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, i) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 * i, duration: 0.45, ease: easing }}
          className="glass rounded-3xl p-6"
        >
          <span
            className={cn(
              "flex size-10 items-center justify-center rounded-2xl",
              card.accent
            )}
          >
            <card.icon className="size-5" />
          </span>
          <p className="mt-4 text-2xl font-semibold tabular-nums">{card.value}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">{card.title}</p>
        </motion.div>
      ))}
    </div>
  );
}

function UsersTable({
  users,
  currentUserId,
}: {
  users: AdminUser[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function setRole(userId: string, role: Role) {
    setBusyId(userId);
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ role })
      .eq("id", userId);
    setBusyId(null);

    if (error) {
      toast.error("Rol güncellenemedi");
      return;
    }
    toast.success(role === "admin" ? "Kullanıcı admin yapıldı" : "Admin yetkisi alındı");
    router.refresh();
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.22, duration: 0.45, ease: easing }}
      className="glass overflow-hidden rounded-3xl"
    >
      <div className="px-6 pt-6">
        <h2 className="font-medium">Kullanıcılar</h2>
        <p className="text-sm text-muted-foreground">
          Platformdaki tüm hesaplar ve işlem sayıları
        </p>
      </div>
      <div className="mt-4">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-6">Kullanıcı</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead className="text-right">İşlem</TableHead>
              <TableHead>Kayıt Tarihi</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => {
              const initials = (u.fullName ?? u.email ?? "?")
                .split(" ")
                .map((s) => s[0])
                .slice(0, 2)
                .join("")
                .toUpperCase();
              return (
                <TableRow key={u.id}>
                  <TableCell className="pl-6">
                    <div className="flex items-center gap-3">
                      <Avatar className="size-9">
                        <AvatarFallback className="bg-gradient-to-br from-[#9db9a6] to-[#5f8371] text-xs font-semibold text-white">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {u.fullName ?? "İsimsiz"}
                          {u.id === currentUserId && (
                            <span className="ml-2 text-xs text-muted-foreground">(sen)</span>
                          )}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {u.email ?? "—"}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {u.role === "admin" ? (
                      <Badge className="rounded-full bg-primary/10 text-primary hover:bg-primary/10">
                        <ShieldCheck className="size-3" /> Admin
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="rounded-full">
                        Kullanıcı
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-sm">
                    {u.txCount}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(u.createdAt)}
                  </TableCell>
                  <TableCell>
                    {u.id !== currentUserId && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 rounded-lg"
                            disabled={busyId === u.id}
                            aria-label="Kullanıcı işlemleri"
                          >
                            {busyId === u.id ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <MoreHorizontal className="size-4" />
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl">
                          {u.role === "admin" ? (
                            <DropdownMenuItem onClick={() => setRole(u.id, "user")}>
                              <ShieldOff className="size-4" /> Admin yetkisini al
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => setRole(u.id, "admin")}>
                              <ShieldCheck className="size-4" /> Admin yap
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </motion.section>
  );
}

function RatesEditor({ rates }: { rates: RateRow[] }) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(rates.map((r) => [r.code, String(r.rate_to_try)]))
  );
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();

    const updates = rates
      .filter((r) => r.code !== "TRY")
      .filter((r) => Number(values[r.code]) !== r.rate_to_try)
      .filter((r) => Number(values[r.code]) > 0);

    for (const r of updates) {
      const { error } = await supabase
        .from("exchange_rates")
        .update({ rate_to_try: Number(values[r.code]), updated_at: new Date().toISOString() })
        .eq("code", r.code);
      if (error) {
        setSaving(false);
        toast.error(`${r.code} kuru güncellenemedi`);
        return;
      }
    }

    setSaving(false);
    toast.success(updates.length ? "Kurlar güncellendi" : "Değişiklik yok");
    router.refresh();
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.45, ease: easing }}
      className="glass rounded-3xl p-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-medium">Döviz Kurları</h2>
          <p className="text-sm text-muted-foreground">
            1 birim = kaç ₺? Panel hesaplamaları bu kurları kullanır.
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="rounded-full">
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Kaydet
        </Button>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        {rates
          .filter((r) => r.code !== "TRY")
          .map((r) => (
            <div key={r.code} className="space-y-1.5">
              <label
                htmlFor={`rate-${r.code}`}
                className="text-sm font-medium text-muted-foreground"
              >
                1 {r.code} ={" "}
                <span className="tabular-nums">
                  {formatMoney(Number(values[r.code]) || 0, "TRY")}
                </span>
              </label>
              <Input
                id={`rate-${r.code}`}
                type="number"
                step="0.0001"
                min="0"
                value={values[r.code] ?? ""}
                onChange={(e) =>
                  setValues((prev) => ({ ...prev, [r.code]: e.target.value }))
                }
                className="h-10 rounded-xl tabular-nums"
              />
            </div>
          ))}
      </div>
    </motion.section>
  );
}

export function AdminClient({
  users,
  stats,
  rates,
  currentUserId,
}: {
  users: AdminUser[];
  stats: Stats;
  rates: RateRow[];
  currentUserId: string;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2.5 text-3xl font-semibold tracking-tight">
          <ShieldCheck className="size-7 text-primary" /> Admin Paneli
        </h1>
        <p className="mt-1 text-muted-foreground">
          Platform istatistikleri, kullanıcı yönetimi ve kur ayarları.
        </p>
      </div>

      <StatGrid stats={stats} />
      <UsersTable users={users} currentUserId={currentUserId} />
      <RatesEditor rates={rates} />
    </div>
  );
}
