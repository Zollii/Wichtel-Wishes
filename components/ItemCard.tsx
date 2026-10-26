import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import type { WishlistItem } from "@/generated/prisma/client";
import { externalLink, formatDate } from "@/lib/format";
import { ItemActions } from "./ItemDialogs";
import { button } from "./ui";
import { pickItem } from "./WishlistCards";

export function ItemCard({
  item,
  position,
  editable,
}: {
  item: WishlistItem;
  position: number;
  editable: boolean;
}) {
  const link = externalLink(item.url);

  return (
    <li className="card flex flex-col p-5 sm:p-6">
      <div className="grid grid-cols-[auto_1fr_auto] items-start gap-x-4">
        <span
          aria-hidden
          className="pt-0.5 font-display text-3xl leading-none font-semibold text-gold tabular-nums">
          {String(position).padStart(2, "0")}
        </span>
        <h3 className="min-w-0 font-display text-xl leading-snug font-semibold wrap-break-word">
          {item.name}
        </h3>
        {editable ? (
          <div className="-mt-1 -mr-2">
            <ItemActions item={pickItem(item)} />
          </div>
        ) : (
          <span />
        )}
        {item.description && (
          <p className="col-span-2 col-start-2 mt-2 min-w-0 text-sm whitespace-pre-line text-muted wrap-break-word">
            {item.description}
          </p>
        )}
      </div>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-5">
        <span className="text-xs text-muted">
          Hinzugefügt am {formatDate(item.createdAt, "short")}
        </span>
        {link && (
          <a
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className={`${button("secondary", "sm")} max-w-full`}>
            <span className="sr-only">Ansehen auf</span>
            <span className="truncate">{link.host}</span>
            <ArrowTopRightOnSquareIcon className="size-4 shrink-0" />
          </a>
        )}
      </div>
    </li>
  );
}
