import "server-only";

import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const ADMIN_COOKIE = "wichtel_admin";
const SESSION_SECONDS = 12 * 60 * 60;

function adminPassword() {
  return process.env.ADMIN_PASSWORD || null;
}

function sha256(value: string) {
  return createHash("sha256").update(value).digest();
}

/** Signs the expiry time. The key derives from the password, so changing it logs admins out. */
function sign(expires: number, password: string) {
  return createHmac("sha256", sha256(`wichtel-admin:${password}`))
    .update(String(expires))
    .digest("base64url");
}

export function isAdminConfigured() {
  return adminPassword() !== null;
}

export function checkAdminPassword(input: string) {
  const password = adminPassword();
  return password !== null && timingSafeEqual(sha256(input), sha256(password));
}

export async function startAdminSession() {
  const password = adminPassword();
  if (!password) return;
  const expires = Date.now() + SESSION_SECONDS * 1000;
  (await cookies()).set(ADMIN_COOKIE, `${expires}.${sign(expires, password)}`, {
    httpOnly: true,
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_SECONDS,
  });
}

export async function endAdminSession() {
  (await cookies()).delete(ADMIN_COOKIE);
}

export async function isAdmin() {
  const password = adminPassword();
  if (!password) return false;
  const [expiresText, signature] = (await cookies()).get(ADMIN_COOKIE)?.value.split(".") ?? [];
  const expires = Number(expiresText);
  if (!signature || !Number.isFinite(expires) || expires < Date.now()) return false;
  const expected = Buffer.from(sign(expires, password));
  const actual = Buffer.from(signature);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/** Guards every admin page and admin action. */
export async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}
