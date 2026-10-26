// Shared by lib/session.ts and proxy.ts – keep this file free of imports.

/** Holds the secret token of this device's sign-in. */
export const SESSION_COOKIE = "wichtel_session";

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax",
  path: "/",
  // Browsers cap cookie lifetime at 400 days; proxy.ts renews it on every visit.
  maxAge: 60 * 60 * 24 * 400,
} as const;
