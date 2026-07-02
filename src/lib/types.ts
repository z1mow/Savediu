// Savediu · Veritabanı satır tipleri (supabase/migrations şemasıyla birebir)

export type Currency = "TRY" | "USD" | "EUR" | "GBP";

export const CURRENCIES: { code: Currency; symbol: string; label: string }[] = [
  { code: "TRY", symbol: "₺", label: "Türk Lirası" },
  { code: "USD", symbol: "$", label: "ABD Doları" },
  { code: "EUR", symbol: "€", label: "Euro" },
  { code: "GBP", symbol: "£", label: "İngiliz Sterlini" },
];

export type TransactionType = "income" | "expense";
export type Role = "user" | "admin";

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: Role;
  main_currency: Currency;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  type: TransactionType;
  icon: string | null;
  color: string | null;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  category_id: string | null;
  name: string;
  amount: number;
  currency: Currency;
  billing_day: number;
  is_active: boolean;
  last_billed_on: string | null;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  category_id: string | null;
  subscription_id: string | null;
  type: TransactionType;
  amount: number;
  currency: Currency;
  description: string | null;
  date: string;
  created_at: string;
}

export interface ExchangeRate {
  code: Currency;
  rate_to_try: number;
  updated_at: string;
}

/** Tutarı TRY'ye çevirir; kur bulunamazsa olduğu gibi döner. */
export function toTRY(
  amount: number,
  currency: string,
  rates: Pick<ExchangeRate, "code" | "rate_to_try">[]
): number {
  const rate = rates.find((r) => r.code.trim() === currency.trim());
  return rate ? amount * Number(rate.rate_to_try) : amount;
}
