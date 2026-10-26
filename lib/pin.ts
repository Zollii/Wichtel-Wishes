import "server-only";

import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { prisma } from "./db";

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: Buffer,
  keyLength: number,
) => Promise<Buffer>;

// Four digits are guessed quickly, so every 5th wrong try locks the profile:
// 15 minutes at first, twice as long each further round, at most a day. Only
// the right PIN (or a new one) resets the count.
const TRIES_PER_ROUND = 5;
const FIRST_LOCK_MINUTES = 15;
const MAX_LOCK_MINUTES = 24 * 60;

export async function hashPin(pin: string) {
  const salt = randomBytes(16);
  const key = await scryptAsync(pin, salt, 32);
  return `${salt.toString("base64url")}.${key.toString("base64url")}`;
}

async function pinMatches(pin: string, stored: string) {
  const [salt, key] = stored.split(".");
  const expected = Buffer.from(key, "base64url");
  const actual = await scryptAsync(pin, Buffer.from(salt, "base64url"), expected.length);
  return timingSafeEqual(actual, expected);
}

function lockedMessage(until: Date) {
  const minutes = Math.max(1, Math.ceil((until.getTime() - Date.now()) / 60_000));
  const hours = Math.ceil(minutes / 60);
  const wait =
    minutes === 1
      ? "eine Minute"
      : minutes < 60
        ? `${minutes} Minuten`
        : hours === 1
          ? "eine Stunde"
          : `${hours} Stunden`;
  return { error: `Zu viele falsche Versuche. Bitte warte ${wait} und versuch es dann noch einmal.` };
}

/** Checks somebody's PIN, counting wrong tries. */
export async function checkPin(
  userId: number,
  pin: string,
): Promise<{ error: string } | { mustChange: boolean }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { pinHash: true, pinMustChange: true, pinFailedAttempts: true, pinLockedUntil: true },
  });
  if (!user?.pinHash) return { error: "Für dieses Profil gibt es noch keine PIN." };
  if (user.pinLockedUntil && user.pinLockedUntil > new Date()) {
    return lockedMessage(user.pinLockedUntil);
  }

  // The try is counted – and the lock set if it ends a round – before the
  // PIN is compared. Guesses sent in parallel all read the same count, so
  // only one of them gets through.
  const failures = user.pinFailedAttempts + 1;
  const lockedUntil =
    failures % TRIES_PER_ROUND === 0
      ? new Date(
          Date.now() +
            Math.min(FIRST_LOCK_MINUTES * 2 ** (failures / TRIES_PER_ROUND - 1), MAX_LOCK_MINUTES) *
              60_000,
        )
      : undefined;
  const { count } = await prisma.user.updateMany({
    where: { id: userId, pinFailedAttempts: user.pinFailedAttempts },
    data: { pinFailedAttempts: failures, pinLockedUntil: lockedUntil },
  });
  if (count === 0) return { error: "Bitte versuch es gleich noch einmal." };

  if (await pinMatches(pin, user.pinHash)) {
    await prisma.user.update({
      where: { id: userId },
      data: { pinFailedAttempts: 0, pinLockedUntil: null },
    });
    return { mustChange: user.pinMustChange };
  }

  // Slow down guessing.
  await new Promise((resolve) => setTimeout(resolve, 1000));
  if (lockedUntil) return lockedMessage(lockedUntil);
  const left = TRIES_PER_ROUND - (failures % TRIES_PER_ROUND);
  return { error: `Die PIN stimmt nicht. Noch ${left === 1 ? "ein Versuch" : `${left} Versuche`}.` };
}
