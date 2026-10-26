import "server-only";

import { cache } from "react";
import type { Prisma } from "../generated/prisma/client";
import { prisma } from "./db";
import type { Viewer } from "./session";

// ---------------------------------------------------------------------------
// Visibility: everybody sees family lists; Wichtel-only lists are visible to
// their owner and to whoever has drawn the owner.

export function canSeeWishlist(
  wishlist: { ownerId: number; wichtelOnly: boolean },
  viewer: Viewer | null,
) {
  if (!wishlist.wichtelOnly) return true;
  return viewer !== null && (viewer.id === wishlist.ownerId || viewer.drawnUserId === wishlist.ownerId);
}

function visibleTo(viewer: Viewer | null): Prisma.WishlistWhereInput {
  const owners = viewer ? [viewer.id, viewer.drawnUserId].filter((id) => id !== null) : [];
  return { OR: [{ wichtelOnly: false }, { ownerId: { in: owners } }] };
}

// ---------------------------------------------------------------------------
// Queries

/**
 * Start page: only shown to signed-out devices, so only family lists count.
 * `signIn` is "free" until somebody sets up the profile, "pin" once it has a
 * PIN and "pending" while it is signed in somewhere but has no PIN yet.
 */
export const getPeople = cache(async () => {
  const people = await prisma.user.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      pinSetAt: true,
      pinResetRequestedAt: true,
      _count: { select: { sessions: true, wishlists: { where: { wichtelOnly: false } } } },
      wishlists: {
        where: { wichtelOnly: false },
        select: { title: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });
  return people.map(({ pinSetAt, pinResetRequestedAt, _count, ...person }) => ({
    ...person,
    wishlistCount: _count.wishlists,
    signIn: pinSetAt ? "pin" : _count.sessions > 0 ? "pending" : "free",
    resetRequested: pinResetRequestedAt !== null,
  }) as const);
});

export const getPerson = cache((id: number) =>
  prisma.user.findUnique({ where: { id }, select: { id: true, name: true } }),
);

/** A person's wishlists, limited to what the viewer may see. */
export const getVisibleWishlists = cache((ownerId: number, viewer: Viewer | null) =>
  prisma.wishlist.findMany({
    where: { AND: [{ ownerId }, visibleTo(viewer)] },
    orderBy: { createdAt: "desc" },
    include: { items: { orderBy: { id: "asc" } } },
  }),
);

/**
 * Whom this person has drawn, with all of their lists (the drawer may see
 * every one). Secret: only for that person's own page.
 */
export const getDraw = cache(async (personId: number) => {
  const person = await prisma.user.findUnique({
    where: { id: personId },
    select: {
      drawnAt: true,
      drawnUser: {
        select: {
          id: true,
          name: true,
          wishlists: { select: { id: true }, orderBy: { createdAt: "desc" } },
        },
      },
    },
  });
  return person?.drawnUser ? { ...person.drawnUser, drawnAt: person.drawnAt } : null;
});

export const getOtherPeople = cache((excludePersonId: number) =>
  prisma.user.findMany({
    where: { id: { not: excludePersonId } },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  }),
);

/**
 * Status for the admin. The admin takes part in the draw as well, so only the
 * number of entered draws is included – not even *who* has entered one, which
 * would give away the drawer when a drawn person is deleted.
 */
export async function getAdminOverview() {
  const [people, drawnCount] = await Promise.all([
    prisma.user.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        pinSetAt: true,
        pinResetRequestedAt: true,
        _count: { select: { sessions: true } },
        wishlists: {
          orderBy: { createdAt: "desc" },
          select: { id: true, title: true, wichtelOnly: true },
        },
      },
    }),
    prisma.user.count({ where: { drawnUserId: { not: null } } }),
  ]);
  const pinRequests = people
    .filter((person) => person.pinResetRequestedAt)
    .map((person) => ({ id: person.id, name: person.name, requestedAt: person.pinResetRequestedAt! }))
    .sort((a, b) => a.requestedAt.getTime() - b.requestedAt.getTime());
  return { people, drawnCount, pinRequests };
}

/** Check `canSeeWishlist` before showing the result. */
export const getWishlist = cache((id: number) =>
  prisma.wishlist.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, name: true } },
      items: { orderBy: { id: "asc" } },
    },
  }),
);
