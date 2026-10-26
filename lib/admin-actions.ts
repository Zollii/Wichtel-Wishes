"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  checkAdminPassword,
  endAdminSession,
  isAdminConfigured,
  requireAdmin,
  startAdminSession,
} from "./admin";
import { isUniqueViolation, prisma } from "./db";
import { parseId } from "./format";
import type { FormState } from "./forms";
import { hashPin } from "./pin";
import { personInput, pinInput, readWichtelOnly } from "./validation";

function refreshAll() {
  revalidatePath("/", "layout");
}

// ---------------------------------------------------------------------------
// Login

export async function adminLogin(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  if (!isAdminConfigured()) return { error: "Es ist kein Admin-Passwort eingerichtet." };

  const password = formData.get("password");
  if (typeof password !== "string" || !checkAdminPassword(password)) {
    // Slow down password guessing.
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return { error: "Das Passwort stimmt nicht." };
  }

  await startAdminSession();
  redirect("/admin");
}

export async function adminLogout() {
  await endAdminSession();
  redirect("/");
}

// ---------------------------------------------------------------------------
// Family members

export async function addPerson(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const input = personInput(formData);
  if ("error" in input) return input;

  try {
    await prisma.user.create({ data: input.data });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { error: `„${input.data.name}“ gibt es in der Familie schon.` };
    }
    throw error;
  }
  refreshAll();
  return { ok: true };
}

export async function renamePerson(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const id = parseId(formData.get("personId"));
  if (!id) return { error: "Diese Person gibt es nicht mehr." };
  const input = personInput(formData);
  if ("error" in input) return input;

  try {
    await prisma.user.update({ where: { id }, data: input.data });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { error: `„${input.data.name}“ gibt es in der Familie schon.` };
    }
    throw error;
  }
  refreshAll();
  return { ok: true };
}

export async function deletePerson(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const id = parseId(formData.get("personId"));
  if (!id) return { error: "Diese Person gibt es nicht mehr." };

  // Wishlists cascade; whoever had drawn this person gets their draw reset.
  await prisma.user.deleteMany({ where: { id } });
  refreshAll();
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Sign-in & draws

/** E.g. for a lost phone. A profile without PIN becomes free to pick again. */
export async function signOutDevices(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const id = parseId(formData.get("personId"));
  if (!id) return { error: "Diese Person gibt es nicht mehr." };

  await prisma.session.deleteMany({ where: { userId: id } });
  refreshAll();
  return { ok: true };
}

/**
 * Answers "PIN vergessen?". Only possible while the person asks for it, and
 * the person has to choose their own PIN right after signing in with this one
 * – so the admin can't quietly sign in as somebody and look up their draw.
 */
export async function assignPin(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const id = parseId(formData.get("personId"));
  if (!id) return { error: "Diese Person gibt es nicht mehr." };
  const input = pinInput(formData);
  if ("error" in input) return input;

  const { count } = await prisma.user.updateMany({
    where: { id, pinResetRequestedAt: { not: null } },
    data: {
      pinHash: await hashPin(input.data),
      pinSetAt: new Date(),
      pinMustChange: true,
      pinResetRequestedAt: null,
      pinFailedAttempts: 0,
      pinLockedUntil: null,
    },
  });
  if (count === 0) return { error: "Diese Anfrage ist bereits erledigt." };
  // Whoever is signed in with the old PIN is out.
  await prisma.session.deleteMany({ where: { userId: id } });
  refreshAll();
  return { ok: true };
}

export async function dismissPinRequest(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const id = parseId(formData.get("personId"));
  if (!id) return { error: "Diese Person gibt es nicht mehr." };

  await prisma.user.updateMany({ where: { id }, data: { pinResetRequestedAt: null } });
  refreshAll();
  return { ok: true };
}

export async function resetDraw(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const id = parseId(formData.get("personId"));
  if (!id) return { error: "Diese Person gibt es nicht mehr." };

  await prisma.user.updateMany({
    where: { id },
    data: { drawnUserId: null, drawnAt: null },
  });
  refreshAll();
  return { ok: true };
}

/** Switches a wishlist between "only my Wichtel" and "whole family". */
export async function setWishlistVisibility(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const id = parseId(formData.get("wishlistId"));
  if (!id) return { error: "Diese Wunschliste gibt es nicht mehr." };

  await prisma.wishlist.updateMany({
    where: { id },
    data: { wichtelOnly: readWichtelOnly(formData) },
  });
  refreshAll();
  return { ok: true };
}

/** Starts a new round, e.g. for next Christmas. */
export async function resetAllDraws(): Promise<FormState> {
  await requireAdmin();
  await prisma.user.updateMany({ data: { drawnUserId: null, drawnAt: null } });
  refreshAll();
  return { ok: true };
}
