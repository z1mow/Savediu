# Savediu

Modern, çok kullanıcılı gelir-gider ve abonelik takip uygulaması.

**Stack:** Next.js (App Router) · Tailwind CSS · shadcn/ui · Framer Motion · Recharts · Supabase (PostgreSQL + Auth + RLS + pg_cron) · Vercel

## Kurulum

1. Bağımlılıkları yükleyin:

   ```bash
   npm install
   ```

2. [Supabase](https://supabase.com)'de bir proje oluşturun ve SQL Editor'de şu dosyaları **sırayla** çalıştırın:

   - `supabase/migrations/0001_schema.sql` — tablolar ve indeksler
   - `supabase/migrations/0002_functions_triggers.sql` — otomatik profil/kategori oluşturma
   - `supabase/migrations/0003_rls.sql` — Row Level Security (admin istisnası dahil)
   - `supabase/migrations/0004_subscriptions_cron.sql` — otomatik abonelik yenileme (pg_cron)

3. `.env.example` dosyasını `.env.local` olarak kopyalayıp Supabase anahtarlarınızı girin:

   ```bash
   cp .env.example .env.local
   ```

4. Geliştirme sunucusunu başlatın:

   ```bash
   npm run dev
   ```

## Admin yetkisi verme

Kayıt olduktan sonra Supabase SQL Editor'de:

```sql
update public.profiles set role = 'admin' where id = 'KULLANICI-UUID';
```

## Deploy

`master`'a push edilen her commit Vercel'de otomatik deploy olur. Vercel proje ayarlarında `NEXT_PUBLIC_SUPABASE_URL` ve `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` ortam değişkenlerini tanımlamayı unutmayın.
