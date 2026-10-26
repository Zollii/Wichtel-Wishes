import Link from "next/link";
import clsx from "clsx";
import { ArrowRightIcon, LinkIcon } from "@heroicons/react/24/outline";
import type { Wishlist, WishlistItem } from "@/generated/prisma/client";
import { externalLink, formatDate, plural } from "@/lib/format";
import { AddItemButton, ItemActions } from "./ItemDialogs";
import { VisibilityBadge } from "./VisibilityBadge";
import { DeleteWishlistButton, EditWishlistButton } from "./WishlistDialogs";

const ribbons = ["bg-pine", "bg-berry", "bg-gold"];
const PREVIEW_COUNT = 3;

export function pickItem({ id, name, description, url }: WishlistItem) {
  return { id, name, description, url };
}

/** A wishlist owned by the current person, with inline management. */
export function OwnWishlistCard({
  wishlist,
}: {
  wishlist: Wishlist & { items: WishlistItem[] };
}) {
  const { items } = wishlist;
  const hiddenCount = items.length - PREVIEW_COUNT;
  // Only pass what the client dialogs need.
  const fields = {
    id: wishlist.id,
    title: wishlist.title,
    description: wishlist.description,
    wichtelOnly: wishlist.wichtelOnly,
  };

  return (
    <article className="card relative flex flex-col overflow-hidden p-6 sm:p-7">
      <span
        aria-hidden
        className={clsx("absolute inset-x-0 top-0 h-1.5", ribbons[wishlist.id % ribbons.length])}
      />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="eyebrow">{plural(items.length, "Wunsch", "Wünsche")}</p>
          <h3 className="mt-1.5 font-display text-2xl leading-tight font-semibold wrap-break-word">
            <Link
              href={`/wishlist/${wishlist.id}`}
              className="decoration-gold decoration-2 underline-offset-4 hover:underline">
              {wishlist.title}
            </Link>
          </h3>
          {wishlist.description && (
            <p className="mt-2 line-clamp-2 text-sm text-muted">{wishlist.description}</p>
          )}
          <VisibilityBadge wichtelOnly={wishlist.wichtelOnly} className="mt-3" />
        </div>
        <div className="-mt-1 -mr-2 flex shrink-0">
          <EditWishlistButton wishlist={fields} />
          <DeleteWishlistButton wishlist={fields} />
        </div>
      </div>

      {items.length === 0 ? (
        <p className="mt-5 rounded-2xl bg-surface-2 px-4 py-5 text-center text-sm text-muted">
          Noch leer – was wünschst du dir?
        </p>
      ) : (
        <ul className="mt-5 divide-y divide-line border-y border-line">
          {items.slice(0, PREVIEW_COUNT).map((item) => {
            const link = externalLink(item.url);
            return (
              <li key={item.id} className="flex items-center gap-3 py-2">
                <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-gold" />
                <span className="min-w-0 flex-1 truncate">{item.name}</span>
                {link && (
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 rounded-full p-1.5 text-muted transition hover:bg-pine-soft hover:text-pine"
                    title={link.host}>
                    <LinkIcon className="size-4" />
                    <span className="sr-only">Link zu {link.host}</span>
                  </a>
                )}
                <ItemActions item={pickItem(item)} />
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-5">
        <AddItemButton wishlist={fields} />
        <Link
          href={`/wishlist/${wishlist.id}`}
          className="group inline-flex items-center gap-1.5 text-sm font-medium text-pine">
          {hiddenCount > 0 ? `Alle ${items.length} ansehen` : "Liste öffnen"}
          <ArrowRightIcon className="size-4 transition group-hover:translate-x-0.5" />
        </Link>
      </div>
    </article>
  );
}

/**
 * A compact, fully clickable card for somebody else's wishlist. Wichtel-only
 * lists only ever reach this card for the person who drew the owner.
 */
export function WishlistTeaser({
  wishlist,
}: {
  wishlist: Wishlist & { _count: { items: number } };
}) {
  return (
    <Link
      href={`/wishlist/${wishlist.id}`}
      className="card group relative flex flex-col overflow-hidden p-5 transition hover:-translate-y-0.5 hover:border-pine/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine">
      <span
        aria-hidden
        className={clsx("absolute inset-y-0 left-0 w-1", ribbons[wishlist.id % ribbons.length])}
      />
      <h4 className="font-display text-xl leading-snug font-semibold wrap-break-word">{wishlist.title}</h4>
      {wishlist.description && (
        <p className="mt-1.5 line-clamp-2 text-sm text-muted">{wishlist.description}</p>
      )}
      {wishlist.wichtelOnly && (
        <VisibilityBadge wichtelOnly viewer="drawer" className="mt-3 self-start" />
      )}
      <div className="mt-auto flex items-center justify-between gap-3 pt-4 text-sm">
        <span className="rounded-full bg-gold-soft px-2.5 py-1 font-medium text-gold">
          {plural(wishlist._count.items, "Wunsch", "Wünsche")}
        </span>
        <span className="text-xs text-muted">{formatDate(wishlist.createdAt, "short")}</span>
      </div>
    </Link>
  );
}
