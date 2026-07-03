// Popüler servisler: hızlı ekleme + marka renkli kartlar

export interface ServicePreset {
  name: string;
  gradient: string; // tailwind gradient sınıfları
}

// Monokrom sistem: marka renkleri yerine nötr gri gradyanlar; ayrım
// avatar içindeki baş harf ve ince ton farkıyla sağlanır.
export const SERVICE_PRESETS: ServicePreset[] = [
  { name: "Netflix", gradient: "from-neutral-700 to-neutral-900" },
  { name: "Spotify", gradient: "from-neutral-700 to-neutral-900" },
  { name: "YouTube Premium", gradient: "from-neutral-700 to-neutral-900" },
  { name: "iCloud+", gradient: "from-neutral-700 to-neutral-900" },
  { name: "Google One", gradient: "from-neutral-700 to-neutral-900" },
  { name: "Amazon Prime", gradient: "from-neutral-700 to-neutral-900" },
  { name: "Disney+", gradient: "from-neutral-700 to-neutral-900" },
  { name: "ChatGPT Plus", gradient: "from-neutral-700 to-neutral-900" },
];

const FALLBACK_GRADIENTS = [
  "from-neutral-600 to-neutral-800",
  "from-neutral-700 to-neutral-900",
  "from-neutral-500 to-neutral-700",
  "from-neutral-600 to-neutral-900",
  "from-neutral-700 to-neutral-800",
  "from-neutral-500 to-neutral-800",
];

/** Abonelik adına uyan marka gradyanı; yoksa isme göre sabit bir renk. */
export function gradientFor(name: string): string {
  const lower = name.toLocaleLowerCase("tr");
  const preset = SERVICE_PRESETS.find(
    (p) =>
      lower.includes(p.name.toLocaleLowerCase("tr").split(" ")[0]) ||
      p.name.toLocaleLowerCase("tr").includes(lower)
  );
  if (preset) return preset.gradient;

  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return FALLBACK_GRADIENTS[hash % FALLBACK_GRADIENTS.length];
}
