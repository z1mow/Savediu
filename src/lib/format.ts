// Savediu · tr-TR biçimlendirme yardımcıları

export function formatMoney(amount: number, currency = "TRY"): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(typeof date === "string" ? new Date(date) : date);
}

export function currencySymbol(code: string): string {
  const map: Record<string, string> = { TRY: "₺", USD: "$", EUR: "€", GBP: "£" };
  return map[code.trim()] ?? code;
}
