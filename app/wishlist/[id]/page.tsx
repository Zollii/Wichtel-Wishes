import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, GiftIcon } from "@heroicons/react/24/outline";
import { Avatar } from "@/components/Avatar";
import { EmptyState } from "@/components/EmptyState";
import { AddItemButton } from "@/components/ItemDialogs";
import { ItemCard } from "@/components/ItemCard";
import { SectionHeading } from "@/components/SectionHeading";
import { Stat } from "@/components/Stat";
import { DeleteWishlistButton, EditWishlistButton } from "@/components/WishlistDialogs";
import { VisibilityBadge } from "@/components/VisibilityBadge";
import { canSeeWishlist, getWishlist } from "@/lib/data";
import { daysSince, externalLink, formatDate, parseId, plural, possessive } from "@/lib/format";
import { getViewer } from "@/lib/session";

type Props = { params: Promise<{ id: string }> };

/** The wishlist, or null if it doesn't exist or the viewer may not see it. */
async function loadWishlist(params: Props["params"]) {
  const id = parseId((await params).id);
  if (!id) return null;
  const [wishlist, viewer] = await Promise.all([getWishlist(id), getViewer()]);
  return wishlist && canSeeWishlist(wishlist, viewer) ? { wishlist, viewer } : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const found = await loadWishlist(params);
  return {
    title: found ? `${found.wishlist.title} – ${found.wishlist.owner.name}` : "Nicht gefunden",
  };
}

export default async function WishlistPage({ params }: Props) {
  // Hidden lists answer with 404, exactly like lists that don't exist.
  const found = await loadWishlist(params);
  if (!found) notFound();

  const { wishlist, viewer } = found;
  const { owner, items } = wishlist;
  const isOwner = viewer?.id === owner.id;
  const fields = {
    id: wishlist.id,
    title: wishlist.title,
    description: wishlist.description,
    wichtelOnly: wishlist.wichtelOnly,
  };

  const withLink = items.filter((item) => externalLink(item.url)).length;
  const withDetails = items.filter((item) => item.description).length;
  const age = daysSince(wishlist.createdAt);

  return (
    <div className="space-y-12">
      <Link
        href={`/user/${owner.id}`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition hover:text-ink">
        <ArrowLeftIcon className="size-4" />
        {isOwner ? "Meine Wunschlisten" : `${possessive(owner.name)} Wunschlisten`}
      </Link>

      <header className="card relative overflow-hidden p-6 sm:p-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-3 text-sm text-muted">
              <Avatar name={owner.name} size="sm" ring={false} />
              <p>
                Wunschliste von{" "}
                <Link href={`/user/${owner.id}`} className="font-medium text-ink hover:underline">
                  {owner.name}
                </Link>
                <span className="hidden sm:inline"> · erstellt am {formatDate(wishlist.createdAt)}</span>
              </p>
            </div>
            <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight wrap-break-word sm:text-5xl">
              {wishlist.title}
            </h1>
            {wishlist.description && (
              <p className="mt-4 max-w-2xl text-lg whitespace-pre-line text-muted wrap-break-word">
                {wishlist.description}
              </p>
            )}
            {(isOwner || wishlist.wichtelOnly) && (
              <VisibilityBadge
                wichtelOnly={wishlist.wichtelOnly}
                viewer={isOwner ? "owner" : "drawer"}
                className="mt-5"
              />
            )}
          </div>

          {isOwner && (
            <div className="flex shrink-0 items-center gap-1">
              <AddItemButton wishlist={fields} variant="primary" />
              <EditWishlistButton wishlist={fields} />
              <DeleteWishlistButton wishlist={fields} returnToProfile />
            </div>
          )}
        </div>

        <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-4">
          <Stat label="Wünsche" value={items.length} />
          <Stat label="Mit Link" value={withLink} />
          <Stat
            label="Mit Details"
            value={withDetails}
            note={items.length > 0 ? `${Math.round((withDetails / items.length) * 100)} %` : undefined}
          />
          <Stat label={age === 1 ? "Tag alt" : "Tage alt"} value={age} />
        </dl>
      </header>

      <section aria-labelledby="wishes">
        <SectionHeading
          id="wishes"
          title="Wünsche"
          meta={items.length > 0 ? plural(items.length, "Wunsch", "Wünsche") : undefined}
        />
        {items.length === 0 ? (
          <EmptyState
            icon={GiftIcon}
            title="Noch keine Wünsche"
            action={isOwner && <AddItemButton wishlist={fields} variant="primary" />}>
            {isOwner
              ? "Füge deinen ersten Wunsch hinzu – gerne mit Link zum Produkt."
              : `${owner.name} hat dieser Liste noch nichts hinzugefügt.`}
          </EmptyState>
        ) : (
          <ol className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {items.map((item, index) => (
              <ItemCard key={item.id} item={item} position={index + 1} editable={isOwner} />
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
