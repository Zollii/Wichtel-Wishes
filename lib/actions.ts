"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isUniqueViolation, prisma } from "./db";
import { parseId } from "./format";
import type { FormState } from "./forms";
import { checkPin, hashPin } from "./pin";
import {
  endOtherSessions,
  endSession,
  getCurrentPerson,
  getSignedInPerson,
  startSession,
} from "./session";
import { itemInput, newPinInput, pinInput, wishlistInput } from "./validation";

function refreshAll() {
  revalidatePath("/", "layout");
}

const NO_PERSON = { error: "Bitte melde dich zuerst an." };
const NOT_OWNER = { error: "Du kannst nur deine eigenen Wunschlisten bearbeiten." };

/** Resolves a wishlist the current person is allowed to edit. */
async function ownWishlist(wishlistId: number | null) {
  const person = await getCurrentPerson();
  if (!person) return NO_PERSON;
  const wishlist = wishlistId
    ? await prisma.wishlist.findUnique({
        where: { id: wishlistId },
        select: { id: true, ownerId: true },
      })
    : null;
  if (!wishlist) return { error: "Diese Wunschliste gibt es nicht mehr." };
  if (wishlist.ownerId !== person.id) return NOT_OWNER;
  return { person, wishlist };
}

/** Resolves an item on one of the current person's wishlists. */
async function ownItem(itemId: number | null) {
  const person = await getCurrentPerson();
  if (!person) return NO_PERSON;
  const item = itemId
    ? await prisma.wishlistItem.findUnique({
        where: { id: itemId },
        select: { id: true, wishlist: { select: { ownerId: true } } },
      })
    : null;
  if (!item) return { error: "Diesen Wunsch gibt es nicht mehr." };
  if (item.wishlist.ownerId !== person.id) return NOT_OWNER;
  return { person, item };
}

// ---------------------------------------------------------------------------
// Profile & PIN

/** First visit: whoever picks a free profile sets its PIN. */
export async function setUpProfile(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const id = parseId(formData.get("personId"));
  if (!id) return { error: "Diese Person gibt es nicht." };
  const input = newPinInput(formData);
  if ("error" in input) return input;

  // Atomic check-and-set: only succeeds while the profile is still free.
  const { count } = await prisma.user.updateMany({
    where: { id, pinHash: null, sessions: { none: {} } },
    data: {
      pinHash: await hashPin(input.data),
      pinSetAt: new Date(),
      pinFailedAttempts: 0,
      pinLockedUntil: null,
    },
  });
  if (count === 0) {
    return { error: "Dieses Profil hat inzwischen schon jemand eingerichtet." };
  }

  await startSession(id);
  refreshAll();
  redirect(`/user/${id}`);
}

export async function signIn(_previous: FormState, formData: FormData): Promise<FormState> {
  const id = parseId(formData.get("personId"));
  if (!id) return { error: "Diese Person gibt es nicht." };
  const input = pinInput(formData);
  if ("error" in input) return input;

  const result = await checkPin(id, input.data);
  if ("error" in result) return result;

  await startSession(id);
  // Remembered after all – the admin no longer needs to help.
  await prisma.user.update({ where: { id }, data: { pinResetRequestedAt: null } });
  refreshAll();
  // With a PIN from the admin, the start page asks for their own one first.
  redirect(result.mustChange ? "/" : `/user/${id}`);
}

export async function signOut() {
  await endSession();
  refreshAll();
  redirect("/");
}

/** "PIN vergessen?" – the admin sees the request and assigns a new PIN. */
export async function requestPinReset(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const id = parseId(formData.get("personId"));
  if (!id) return { error: "Diese Person gibt es nicht." };

  await prisma.user.updateMany({
    where: { id, pinResetRequestedAt: null },
    data: { pinResetRequestedAt: new Date() },
  });
  refreshAll();
  return { ok: true };
}

/**
 * Sets a PIN only the signed-in person knows and signs out their other
 * devices. Replacing their own PIN needs the current one; a missing PIN or
 * one from the admin doesn't.
 */
export async function changePin(_previous: FormState, formData: FormData): Promise<FormState> {
  const person = await getSignedInPerson();
  if (!person) return NO_PERSON;
  const input = newPinInput(formData);
  if ("error" in input) return input;

  if (person.pin === "own") {
    const current = pinInput(formData, "currentPin");
    if ("error" in current) return { error: "Bitte gib deine bisherige PIN ein." };
    const result = await checkPin(person.id, current.data);
    if ("error" in result) return result;
  }

  await prisma.user.update({
    where: { id: person.id },
    data: {
      pinHash: await hashPin(input.data),
      pinSetAt: new Date(),
      pinMustChange: false,
      pinResetRequestedAt: null,
      pinFailedAttempts: 0,
      pinLockedUntil: null,
    },
  });
  await endOtherSessions(person.id);
  refreshAll();
  if (person.pin !== "own") redirect(`/user/${person.id}`);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Secret Santa draw – can only be undone by an admin

export async function recordDraw(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const person = await getCurrentPerson();
  if (!person) return NO_PERSON;

  const drawnId = parseId(formData.get("drawnId"));
  const drawn = drawnId
    ? await prisma.user.findUnique({ where: { id: drawnId }, select: { id: true } })
    : null;
  if (!drawn || drawn.id === person.id) {
    return { error: "Bitte wähle die Person aus, die du gezogen hast." };
  }

  try {
    const { count } = await prisma.user.updateMany({
      where: { id: person.id, drawnUserId: null },
      data: { drawnUserId: drawn.id, drawnAt: new Date() },
    });
    if (count === 0) return { error: "Du hast deine Ziehung bereits eingetragen." };
  } catch (error) {
    // drawnUserId is unique: somebody else already entered this person.
    if (isUniqueViolation(error)) {
      return {
        error:
          "Diese Person hat bereits jemand anderes eingetragen. Bitte wende dich an den Admin.",
      };
    }
    throw error;
  }

  refreshAll();
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Wishlists

export async function createWishlist(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const person = await getCurrentPerson();
  if (!person) return NO_PERSON;
  const input = wishlistInput(formData);
  if ("error" in input) return input;

  await prisma.wishlist.create({ data: { ...input.data, ownerId: person.id } });
  refreshAll();
  return { ok: true };
}

export async function updateWishlist(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const owned = await ownWishlist(parseId(formData.get("wishlistId")));
  if ("error" in owned) return owned;
  const input = wishlistInput(formData);
  if ("error" in input) return input;

  await prisma.wishlist.update({
    where: { id: owned.wishlist.id },
    data: input.data,
  });
  refreshAll();
  return { ok: true };
}

export async function deleteWishlist(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const owned = await ownWishlist(parseId(formData.get("wishlistId")));
  if ("error" in owned) return owned;

  await prisma.wishlist.delete({ where: { id: owned.wishlist.id } });
  refreshAll();
  // When deleted from its own page, that page no longer exists.
  if (formData.get("returnToProfile") === "1") {
    redirect(`/user/${owned.person.id}`);
  }
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Wishlist items

export async function addItem(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const owned = await ownWishlist(parseId(formData.get("wishlistId")));
  if ("error" in owned) return owned;
  const input = itemInput(formData);
  if ("error" in input) return input;

  await prisma.wishlistItem.create({
    data: { ...input.data, wishlistId: owned.wishlist.id },
  });
  refreshAll();
  return { ok: true };
}

export async function updateItem(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const owned = await ownItem(parseId(formData.get("itemId")));
  if ("error" in owned) return owned;
  const input = itemInput(formData);
  if ("error" in input) return input;

  await prisma.wishlistItem.update({
    where: { id: owned.item.id },
    data: input.data,
  });
  refreshAll();
  return { ok: true };
}

export async function deleteItem(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const owned = await ownItem(parseId(formData.get("itemId")));
  if ("error" in owned) return owned;

  await prisma.wishlistItem.delete({ where: { id: owned.item.id } });
  refreshAll();
  return { ok: true };
}
