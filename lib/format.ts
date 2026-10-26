const TIME_ZONE = "Europe/Berlin";

const dateFormats = {
  long: new Intl.DateTimeFormat("de-DE", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: TIME_ZONE,
  }),
  short: new Intl.DateTimeFormat("de-DE", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: TIME_ZONE,
  }),
};

export function formatDate(date: Date, style: keyof typeof dateFormats = "long") {
  return dateFormats[style].format(date);
}

export function daysSince(date: Date) {
  return Math.max(0, Math.floor((Date.now() - date.getTime()) / 86_400_000));
}

/** "1 Wunsch", "3 Wünsche" */
export function plural(count: number, singular: string, pluralForm: string) {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

/** German genitive for names: "Annas", "Klaus’" */
export function possessive(name: string) {
  return /[sßxz]$/i.test(name) ? `${name}’` : `${name}s`;
}

/** "Anna" → "A", "Oma Gerti" → "OG" */
export function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  const letters = parts.length > 1 ? parts[0][0] + parts.at(-1)![0] : parts[0][0];
  return letters.toUpperCase();
}

/** Stable pseudo-random index for a string, used to pick avatar colours. */
export function hashIndex(value: string, modulo: number) {
  let hash = 0;
  for (const char of value) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return hash % modulo;
}

export function parseId(value: unknown) {
  if (typeof value !== "string" || !/^\d+$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

/** Only http(s) links are rendered as clickable product links. */
export function externalLink(url: string | null) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    return { href: parsed.href, host: parsed.hostname.replace(/^www\./, "") };
  } catch {
    return null;
  }
}
