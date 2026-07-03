"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeftRight,
  LayoutDashboard,
  LogOut,
  Menu,
  Repeat,
  ShieldCheck,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { Profile } from "@/lib/types";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Panel", icon: LayoutDashboard },
  { href: "/transactions", label: "İşlemler", icon: ArrowLeftRight },
  { href: "/subscriptions", label: "Aboneliklerim", icon: Repeat },
];

function NavLinks({ isAdmin, onNavigate }: { isAdmin: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  const items = isAdmin
    ? [...NAV_ITEMS, { href: "/admin", label: "Admin", icon: ShieldCheck }]
    : NAV_ITEMS;

  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const active = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors",
              active
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
            )}
          >
            {active && (
              <motion.span
                layoutId="nav-active"
                className="absolute inset-0 rounded-xl bg-accent"
                transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
              />
            )}
            <item.icon className="relative z-10 size-4.5" />
            <span className="relative z-10">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function UserMenu({ profile, email }: { profile: Profile | null; email: string }) {
  const router = useRouter();
  const initials = (profile?.full_name ?? email)
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-accent/60">
            <Avatar className="size-9">
              <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">
                {profile?.full_name ?? "Kullanıcı"}
              </span>
              <span className="block truncate text-xs text-muted-foreground">
                {email}
              </span>
            </span>
          </button>
        }
      />
      <DropdownMenuContent align="start" className="w-56 rounded-xl">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            {profile?.role === "admin" ? "Yönetici hesabı" : "Hesap"}
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={signOut}>
          <LogOut className="size-4" /> Çıkış Yap
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AppShell({
  profile,
  email,
  children,
}: {
  profile: Profile | null;
  email: string;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const isAdmin = profile?.role === "admin";

  return (
    <div className="relative flex min-h-dvh w-full">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(40%_30%_at_100%_0%,var(--color-muted)_0%,transparent_60%)]"
      />

      {/* Masaüstü kenar çubuğu */}
      <aside className="sticky top-0 hidden h-dvh w-64 flex-col border-r border-border/60 bg-sidebar/50 px-4 py-6 backdrop-blur-xl lg:flex">
        <Link href="/dashboard" className="px-2">
          <Logo />
        </Link>
        <div className="mt-8 flex-1">
          <NavLinks isAdmin={isAdmin} />
        </div>
        <div className="flex items-center gap-1 border-t border-border/60 pt-4">
          <div className="min-w-0 flex-1">
            <UserMenu profile={profile} email={email} />
          </div>
          <ThemeToggle />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobil üst çubuk */}
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border/60 bg-background/70 px-4 py-3 backdrop-blur-xl lg:hidden">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger
              render={
                <Button variant="ghost" size="icon" aria-label="Menü">
                  <Menu className="size-5" />
                </Button>
              }
            />
            <SheetContent side="left" className="w-72 px-4 py-6">
              <SheetTitle className="sr-only">Menü</SheetTitle>
              <Logo className="px-2" />
              <div className="mt-8 flex-1">
                <NavLinks isAdmin={isAdmin} onNavigate={() => setMobileOpen(false)} />
              </div>
              <div className="border-t border-border/60 pt-4">
                <UserMenu profile={profile} email={email} />
              </div>
            </SheetContent>
          </Sheet>
          <Logo />
          <ThemeToggle />
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-10">
          {children}
        </main>
      </div>
    </div>
  );
}
