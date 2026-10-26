import clsx from "clsx";
import { LockClosedIcon, UserGroupIcon } from "@heroicons/react/24/outline";

/**
 * Who can see a wishlist. `viewer` is the owner by default; "drawer" is the
 * person who drew the owner and may therefore see a Wichtel-only list.
 */
export function VisibilityBadge({
  wichtelOnly,
  viewer = "owner",
  className,
}: {
  wichtelOnly: boolean;
  viewer?: "owner" | "drawer";
  className?: string;
}) {
  const Icon = wichtelOnly ? LockClosedIcon : UserGroupIcon;
  const label = !wichtelOnly
    ? "Für die ganze Familie"
    : viewer === "drawer"
      ? "Nur für dich als Wichtel"
      : "Nur für deinen Wichtel";

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        wichtelOnly ? "bg-berry-soft text-berry" : "bg-surface-2 text-muted",
        className,
      )}>
      <Icon className="size-3.5" />
      {label}
    </span>
  );
}
