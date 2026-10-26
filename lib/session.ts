import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "./db";
import { SESSION_COOKIE, SESSION_COOKIE_OPTIONS } from "./session-cookie";

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

/** Signs this device in as the given person, replacing any earlier sign-in. */
export async function startSession(userId: number) {
  await endSession();
  const token = randomBytes(32).toString("base64url");
  await prisma.session.create({ data: { userId, tokenHash: hashToken(token) } });
  (await cookies()).set(SESSION_COOKIE, token, SESSION_COOKIE_OPTIONS);
}

export async function endSession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return;
  await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  store.delete(SESSION_COOKIE);
}

/** Signs the person out on all their other devices. */
export async function endOtherSessions(userId: number) {
  const token = (await cookies()).get(SESSION_COOKIE)?.value ?? "";
  await prisma.session.deleteMany({ where: { userId, tokenHash: { not: hashToken(token) } } });
}

/**
 * Whom this device is signed in as. `pin` is "own" once they use a PIN only
 * they know; "missing" and "temporary" (assigned by the admin) mean they have
 * to choose one first.
 */
export const getSignedInPerson = cache(async () => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    select: { user: { select: { id: true, name: true, pinSetAt: true, pinMustChange: true } } },
  });
  if (!session) return null;
  const { pinSetAt, pinMustChange, ...person } = session.user;
  const pin = !pinSetAt ? "missing" : pinMustChange ? "temporary" : "own";
  return { ...person, pin } as const;
});

/** The current person – nobody until they have chosen their own PIN. */
export const getCurrentPerson = cache(async () => {
  const person = await getSignedInPerson();
  return person?.pin === "own" ? { id: person.id, name: person.name } : null;
});

export type Viewer = { id: number; drawnUserId: number | null };

/**
 * The current person plus whom they drew – decides which wishlists they may
 * see. For pages only: people who still have to choose a PIN are sent to the
 * start page, which asks for it.
 */
export const getViewer = cache(async (): Promise<Viewer | null> => {
  const person = await getSignedInPerson();
  if (!person) return null;
  if (person.pin !== "own") redirect("/");
  const draw = await prisma.user.findUnique({
    where: { id: person.id },
    select: { drawnUserId: true },
  });
  return { id: person.id, drawnUserId: draw?.drawnUserId ?? null };
});
