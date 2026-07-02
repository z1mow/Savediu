"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, MailCheck, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export function RegisterForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [awaitingConfirm, setAwaitingConfirm] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const password = String(form.get("password"));

    if (password.length < 6) {
      toast.error("Şifre en az 6 karakter olmalı");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email: String(form.get("email")),
      password,
      options: {
        data: { full_name: String(form.get("full_name")) },
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    });

    setLoading(false);

    if (error) {
      toast.error(
        error.message.includes("already registered")
          ? "Bu e-posta ile zaten bir hesap var"
          : "Kayıt oluşturulamadı, lütfen tekrar deneyin"
      );
      return;
    }

    // E-posta doğrulaması kapalıysa oturum hemen açılır
    if (data.session) {
      router.push("/dashboard");
      router.refresh();
      return;
    }

    setAwaitingConfirm(true);
  }

  if (awaitingConfirm) {
    return (
      <div className="text-center">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <MailCheck className="size-7" />
        </span>
        <h1 className="mt-5 text-2xl font-semibold tracking-tight">
          E-postanı kontrol et
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sana bir doğrulama bağlantısı gönderdik. Bağlantıya tıkladığında
          Savediu paneline yönlendirileceksin.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Hesap oluştur</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Ücretsiz kaydolun, finansınızı dakikalar içinde düzenleyin.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div className="space-y-2">
          <Label htmlFor="full_name">Ad Soyad</Label>
          <Input
            id="full_name"
            name="full_name"
            placeholder="Adınız Soyadınız"
            autoComplete="name"
            required
            className="h-11 rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">E-posta</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="ornek@eposta.com"
            autoComplete="email"
            required
            className="h-11 rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Şifre</Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="En az 6 karakter"
            autoComplete="new-password"
            required
            className="h-11 rounded-xl"
          />
        </div>
        <Button
          type="submit"
          disabled={loading}
          className="h-11 w-full rounded-xl shadow-lg shadow-primary/25"
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <UserPlus className="size-4" />
          )}
          Kayıt Ol
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Zaten hesabınız var mı?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Giriş yapın
        </Link>
      </p>
    </div>
  );
}
