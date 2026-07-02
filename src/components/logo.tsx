import { Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 text-white shadow-lg shadow-indigo-500/25">
        <Wallet className="size-4.5" strokeWidth={2.2} />
      </span>
      <span className="text-lg font-semibold tracking-tight">Savediu</span>
    </div>
  );
}
