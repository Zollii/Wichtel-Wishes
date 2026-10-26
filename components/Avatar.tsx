import clsx from "clsx";
import { hashIndex, initials } from "@/lib/format";

const tones = [
  "bg-tone-1",
  "bg-tone-2",
  "bg-tone-3",
  "bg-tone-4",
  "bg-tone-5",
  "bg-tone-6",
];

const sizes = {
  sm: "size-8 text-xs",
  md: "size-11 text-sm",
  lg: "size-16 text-xl",
  xl: "size-20 text-2xl",
};

export function Avatar({
  name,
  size = "md",
  ring = true,
  className,
}: {
  name: string;
  size?: keyof typeof sizes;
  /** Halo that separates large avatars from the background. */
  ring?: boolean;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={clsx(
        "inline-grid shrink-0 place-items-center rounded-full font-display font-semibold text-white select-none",
        ring && "ring-4 ring-surface",
        tones[hashIndex(name, tones.length)],
        sizes[size],
        className,
      )}>
      {initials(name)}
    </span>
  );
}
