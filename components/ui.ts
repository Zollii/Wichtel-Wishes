import clsx from "clsx";

const variants = {
  primary: "bg-pine text-on-pine shadow-sm hover:bg-pine-strong",
  secondary:
    "border border-line bg-surface text-ink hover:border-ink/25 hover:bg-surface-2",
  ghost: "text-muted hover:bg-ink/6 hover:text-ink",
  danger: "bg-berry text-on-berry shadow-sm hover:brightness-110",
};

const sizes = {
  sm: "h-9 px-3.5 text-sm",
  md: "h-11 px-5 text-sm",
  icon: "size-9",
};

export function button(
  variant: keyof typeof variants = "primary",
  size: keyof typeof sizes = "md",
) {
  return clsx(
    "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full font-medium transition",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine",
    "disabled:pointer-events-none disabled:opacity-50",
    variants[variant],
    sizes[size],
  );
}
