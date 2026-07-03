import Link from "next/link";
import { Logo } from "@/components/logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-4 py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_0%,var(--color-muted)_0%,transparent_70%)]"
      />
      <Link href="/" className="relative z-10 mb-8">
        <Logo />
      </Link>
      <div className="relative z-10 w-full max-w-md rounded-3xl bg-card p-8 shadow-xl shadow-black/5 ring-1 ring-foreground/10">
        {children}
      </div>
    </div>
  );
}
