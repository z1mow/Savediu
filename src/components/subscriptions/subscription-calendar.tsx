"use client";

import { format, getDaysInMonth, startOfMonth } from "date-fns";
import { tr } from "date-fns/locale";
import { motion } from "framer-motion";
import { CalendarDays } from "lucide-react";
import type { Subscription } from "@/lib/types";
import { cn } from "@/lib/utils";
import { gradientFor } from "./service-presets";

const WEEKDAYS = ["Pt", "Sa", "Ça", "Pe", "Cu", "Ct", "Pz"];
const easing = [0.22, 1, 0.36, 1] as const;

/** Aktif aboneliklerin bu ay içinde yenilendiği günleri hesaplar. */
function renewalsByDay(subs: Subscription[], monthDate: Date): Map<number, Subscription[]> {
  const map = new Map<number, Subscription[]>();
  const daysInMonth = getDaysInMonth(monthDate);
  const y = monthDate.getFullYear();
  const m = monthDate.getMonth();

  const add = (day: number, sub: Subscription) => {
    if (day < 1 || day > daysInMonth) return;
    const list = map.get(day) ?? [];
    if (!list.some((s) => s.id === sub.id)) map.set(day, [...list, sub]);
  };

  for (const sub of subs) {
    if (!sub.is_active) continue;
    const next = new Date(sub.next_billing_on + "T00:00:00");

    if (sub.billing_period === "monthly") {
      add(Math.min(sub.billing_day ?? next.getDate(), daysInMonth), sub);
    } else if (sub.billing_period === "weekly") {
      // next_billing_on ile aynı haftanın gününe denk gelen tüm günler
      for (let day = 1; day <= daysInMonth; day++) {
        const diff = Math.round(
          (new Date(y, m, day).getTime() - next.getTime()) / 86_400_000
        );
        if (diff % 7 === 0) add(day, sub);
      }
    } else if (next.getFullYear() === y && next.getMonth() === m) {
      add(next.getDate(), sub);
    }
  }
  return map;
}

export function SubscriptionCalendar({
  subscriptions,
  className,
}: {
  subscriptions: Subscription[];
  className?: string;
}) {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const daysInMonth = getDaysInMonth(now);
  // Pazartesi = 0 olacak şekilde ayın ilk gününün haftadaki yeri
  const firstWeekday = (monthStart.getDay() + 6) % 7;
  const renewals = renewalsByDay(subscriptions, now);
  const today = now.getDate();

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.18, duration: 0.45, ease: easing }}
      className={cn("glass rounded-3xl p-6", className)}
    >
      <h2 className="flex items-center gap-2 font-medium">
        <CalendarDays className="size-4.5 text-primary" />
        <span className="capitalize">{format(now, "LLLL yyyy", { locale: tr })}</span>
      </h2>
      <p className="text-sm text-muted-foreground">Bu ayın yenileme takvimi</p>

      <div className="mt-4 grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((d) => (
          <span key={d} className="pb-1 text-[11px] font-medium text-muted-foreground">
            {d}
          </span>
        ))}
        {Array.from({ length: firstWeekday }).map((_, i) => (
          <span key={`pad-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
          const daySubs = renewals.get(day);
          return (
            <div
              key={day}
              title={daySubs?.map((s) => s.name).join(", ")}
              className={cn(
                "relative flex aspect-square flex-col items-center justify-center rounded-xl text-sm tabular-nums",
                day === today && "bg-primary/10 font-semibold text-primary",
                daySubs && "bg-accent"
              )}
            >
              {day}
              {daySubs && (
                <span className="absolute bottom-1 flex gap-0.5">
                  {daySubs.slice(0, 3).map((s) => (
                    <span
                      key={s.id}
                      className={cn(
                        "size-1.5 rounded-full bg-gradient-to-br",
                        gradientFor(s.name)
                      )}
                    />
                  ))}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </motion.section>
  );
}
