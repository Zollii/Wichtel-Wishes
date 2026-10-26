import { LIMITS, PIN_LENGTH } from "./forms";

// Parses form input for server actions. Each helper returns either
// `{ data }` or `{ error }` with a message for the user.

export function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function tooLong(label: string, max: number) {
  return { error: `${label} darf höchstens ${max} Zeichen lang sein.` };
}

/** Accepts "amazon.de/…" as well as full URLs, but only http(s). */
function normalizeUrl(raw: string) {
  if (!raw) return { url: null };
  if (raw.length > LIMITS.url) return tooLong("Der Link", LIMITS.url);
  const candidate = /^[a-z][a-z\d+.-]*:/i.test(raw) ? raw : `https://${raw}`;
  try {
    const url = new URL(candidate);
    if (url.protocol === "http:" || url.protocol === "https:") {
      return { url: url.href };
    }
  } catch {
    // fall through
  }
  return { error: "Bitte gib einen gültigen Link ein (z. B. https://…)." };
}

export function personInput(formData: FormData) {
  const name = readText(formData, "name");
  if (!name) return { error: "Bitte gib einen Namen ein." };
  if (name.length > LIMITS.personName) return tooLong("Der Name", LIMITS.personName);
  return { data: { name } };
}

const PIN_PATTERN = new RegExp(`^\\d{${PIN_LENGTH}}$`);

export function pinInput(formData: FormData, key = "pin") {
  const pin = readText(formData, key);
  if (!PIN_PATTERN.test(pin)) return { error: `Die PIN besteht aus genau ${PIN_LENGTH} Ziffern.` };
  return { data: pin };
}

/** "1111", "1234", "9876" – the first PINs anybody would try. */
function isObvious(pin: string) {
  const steps = new Set([...pin].slice(1).map((digit, index) => Number(digit) - Number(pin[index])));
  return steps.size === 1 && [0, 1, -1].includes([...steps][0]);
}

/** A PIN somebody chooses for themselves. */
export function newPinInput(formData: FormData) {
  const input = pinInput(formData);
  if ("error" in input) return input;
  if (isObvious(input.data)) {
    return { error: "Diese PIN ist zu leicht zu erraten. Bitte wähle eine andere." };
  }
  return input;
}

export function wishlistInput(formData: FormData) {
  const title = readText(formData, "title");
  const description = readText(formData, "description");
  if (!title) return { error: "Bitte gib einen Titel ein." };
  if (title.length > LIMITS.wishlistTitle) {
    return tooLong("Der Titel", LIMITS.wishlistTitle);
  }
  if (description.length > LIMITS.description) {
    return tooLong("Die Beschreibung", LIMITS.description);
  }
  return {
    data: { title, description: description || null, wichtelOnly: readWichtelOnly(formData) },
  };
}

/** "wichtel" (default) or "family" from the visibility radio buttons. */
export function readWichtelOnly(formData: FormData) {
  return formData.get("visibility") !== "family";
}

export function itemInput(formData: FormData) {
  const name = readText(formData, "name");
  const description = readText(formData, "description");
  if (!name) return { error: "Bitte gib an, was du dir wünschst." };
  if (name.length > LIMITS.itemName) return tooLong("Der Name", LIMITS.itemName);
  if (description.length > LIMITS.description) {
    return tooLong("Die Beschreibung", LIMITS.description);
  }
  const link = normalizeUrl(readText(formData, "url"));
  if ("error" in link) return link;
  return { data: { name, description: description || null, url: link.url } };
}
