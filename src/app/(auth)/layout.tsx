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
        className="pointer-events-none absolute -top-32 left-1/2 h-100 w-175 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#8fae9c]/25 via-[#b9cdc0]/15 to-[#d9c9a8]/25 blur-3xl"
      />
      <Link href="/" className="relative z-10 mb-8">
        <Logo />
      </Link>
      <div className="glass relative z-10 w-full max-w-md rounded-3xl p-8">
        {children}
      </div>
    </div>
  );
}
