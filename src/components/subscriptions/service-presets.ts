// Popüler servisler: hızlı ekleme + marka renkli kartlar

export interface ServicePreset {
  name: string;
  gradient: string; // tailwind gradient sınıfları
}

export const SERVICE_PRESETS: ServicePreset[] = [
  { name: "Netflix", gradient: "from-red-500 to-red-700" },
  { name: "Spotify", gradient: "from-green-500 to-emerald-600" },
  { name: "YouTube Premium", gradient: "from-red-500 to-rose-600" },
  { name: "iCloud+", gradient: "from-sky-400 to-blue-500" },
  { name: "Google One", gradient: "from-blue-500 to-teal-500" },
  { name: "Amazon Prime", gradient: "from-sky-500 to-indigo-600" },
  { name: "Disney+", gradient: "from-indigo-500 to-blue-700" },
  { name: "ChatGPT Plus", gradient: "from-teal-500 to-emerald-600" },
];

const FALLBACK_GRADIENTS = [
  "from-indigo-500 to-violet-500",
  "from-emerald-500 to-teal-500",
  "from-rose-500 to-orange-500",
  "from-sky-500 to-blue-500",
  "from-fuchsia-500 to-pink-500",
  "from-amber-500 to-yellow-500",
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
