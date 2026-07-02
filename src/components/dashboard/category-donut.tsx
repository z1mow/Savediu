"use client";

import { motion } from "framer-motion";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { cn } from "@/lib/utils";

interface Slice {
  name: string;
  color: string | null;
  value: number;
}

const FALLBACK_COLORS = [
  "var(--chart-3)",
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-4)",
  "var(--chart-5)",
];

function DonutTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { name: string; value: number }[];
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-2xl px-4 py-2.5 text-sm">
      <span className="font-medium">{payload[0].name}</span>{" "}
      <span className="tabular-nums text-muted-foreground">
        {new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 }).format(
          payload[0].value
        )}{" "}
        ₺
      </span>
    </div>
  );
}

export function CategoryDonut({
  data,
  className,
}: {
  data: Slice[];
  className?: string;
}) {
  const total = data.reduce((sum, s) => sum + s.value, 0);
  const top = data.slice(0, 5);

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.28, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={cn("glass rounded-3xl p-6", className)}
    >
      <h2 className="font-medium">Gider Dağılımı</h2>
      <p className="text-sm text-muted-foreground">Bu ayın kategorileri</p>

      {data.length === 0 ? (
        <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">
          Bu ay henüz gider kaydı yok
        </div>
      ) : (
        <>
          <div className="relative mx-auto mt-2 h-44 w-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip content={<DonutTooltip />} />
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={58}
                  outerRadius={80}
                  paddingAngle={3}
                  cornerRadius={6}
                  strokeWidth={0}
                >
                  {data.map((slice, i) => (
                    <Cell
                      key={slice.name}
                      fill={slice.color ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length]}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xs text-muted-foreground">Toplam</span>
              <span className="text-lg font-semibold tabular-nums">
                {new Intl.NumberFormat("tr-TR", {
                  notation: "compact",
                  maximumFractionDigits: 1,
                }).format(total)}{" "}
                ₺
              </span>
            </div>
          </div>

          <ul className="mt-4 space-y-2">
            {top.map((slice, i) => (
              <li key={slice.name} className="flex items-center gap-2.5 text-sm">
                <span
                  className="size-2.5 rounded-full"
                  style={{
                    background:
                      slice.color ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length],
                  }}
                />
                <span className="flex-1 truncate text-muted-foreground">
                  {slice.name}
                </span>
                <span className="tabular-nums font-medium">
                  %{total ? Math.round((slice.value / total) * 100) : 0}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </motion.section>
  );
}
