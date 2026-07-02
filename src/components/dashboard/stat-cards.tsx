"use client";

import { useEffect, useState } from "react";
import { animate, motion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight, Scale } from "lucide-react";
import { cn } from "@/lib/utils";

function CountUp({ value, prefix = "" }: { value: number; prefix?: string }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const controls = animate(0, value, {
      duration: 1.1,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: setDisplay,
    });
    return () => controls.stop();
  }, [value]);

  return (
    <span className="tabular-nums">
      {prefix}
      {new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 }).format(display)}
      {" ₺"}
    </span>
  );
}

export function StatCards({ income, expense }: { income: number; expense: number }) {
  const net = income - expense;

  const cards = [
    {
      title: "Bu Ay Gelir",
      value: income,
      icon: ArrowUpRight,
      accent: "text-emerald-500",
      iconBg: "bg-emerald-500/10",
    },
    {
      title: "Bu Ay Gider",
      value: expense,
      icon: ArrowDownRight,
      accent: "text-rose-500",
      iconBg: "bg-rose-500/10",
    },
    {
      title: "Net Bakiye",
      value: Math.abs(net),
      prefix: net < 0 ? "−" : "",
      icon: Scale,
      accent: net >= 0 ? "text-primary" : "text-rose-500",
      iconBg: "bg-primary/10",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {cards.map((card, i) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06 * i, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-3xl p-6 transition-transform duration-300 hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
            <span
              className={cn(
                "flex size-9 items-center justify-center rounded-2xl",
                card.iconBg,
                card.accent
              )}
            >
              <card.icon className="size-4.5" />
            </span>
          </div>
          <p className={cn("mt-3 text-3xl font-semibold tracking-tight", card.accent)}>
            <CountUp value={card.value} prefix={card.prefix} />
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Tüm para birimleri ₺ karşılığıyla toplanır
          </p>
        </motion.div>
      ))}
    </div>
  );
}
