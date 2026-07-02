"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  LineChart,
  Repeat,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";

const features = [
  {
    icon: LineChart,
    title: "Zarif Grafikler",
    desc: "Aylık trendlerinizi ve kategori dağılımınızı tek bakışta görün.",
  },
  {
    icon: Repeat,
    title: "Otomatik Abonelikler",
    desc: "Netflix, Spotify, sunucu… Günü gelince gideriniz otomatik işlenir.",
  },
  {
    icon: Wallet,
    title: "Çoklu Para Birimi",
    desc: "₺, $, € — hepsini girin, Savediu tek para biriminde toplasın.",
  },
  {
    icon: ShieldCheck,
    title: "Güvenli & Özel",
    desc: "Row Level Security ile verinizi sadece siz görürsünüz.",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.08 * i, duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export default function LandingPage() {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden">
      {/* Arka plan ışıltısı */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-130 w-200 -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-500/20 via-violet-500/15 to-fuchsia-500/20 blur-3xl"
      />

      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
        <Logo />
        <nav className="flex items-center gap-2">
          <Button variant="ghost" asChild>
            <Link href="/login">Giriş Yap</Link>
          </Button>
          <Button asChild className="rounded-full px-5">
            <Link href="/register">Kayıt Ol</Link>
          </Button>
        </nav>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col items-center px-6 pt-20 pb-24 text-center">
        <motion.div variants={fadeUp} initial="hidden" animate="show" custom={0}>
          <span className="glass inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm text-muted-foreground">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Kişisel finansın yeni adresi
          </span>
        </motion.div>

        <motion.h1
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={1}
          className="mt-6 max-w-3xl text-5xl font-semibold tracking-tight text-balance sm:text-6xl"
        >
          Paranızın nereye gittiğini{" "}
          <span className="bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 bg-clip-text text-transparent">
            zarafetle
          </span>{" "}
          takip edin
        </motion.h1>

        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={2}
          className="mt-6 max-w-xl text-lg text-muted-foreground text-pretty"
        >
          Savediu; gelirlerinizi, giderlerinizi ve aboneliklerinizi tek bir
          büyüleyici panelde toplar. Kaydolun, ilk işleminizi saniyeler içinde
          ekleyin.
        </motion.p>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={3}
          className="mt-10 flex items-center gap-3"
        >
          <Button size="lg" asChild className="rounded-full px-7 shadow-lg shadow-primary/25">
            <Link href="/register">
              Ücretsiz Başla <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild className="rounded-full px-7">
            <Link href="/login">Giriş Yap</Link>
          </Button>
        </motion.div>

        <div className="mt-24 grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-40px" }}
              custom={i}
              className="glass rounded-3xl p-6 text-left transition-transform duration-300 hover:-translate-y-1"
            >
              <span className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <f.icon className="size-5" />
              </span>
              <h3 className="mt-4 font-medium">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </main>

      <footer className="relative z-10 border-t border-border/60 py-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Savediu — Akıllı gelir-gider takibi
      </footer>
    </div>
  );
}
