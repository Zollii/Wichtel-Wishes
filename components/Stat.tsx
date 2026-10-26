import type { ReactNode } from "react";

/** One tile in a `<dl>` stats strip. */
export function Stat({ label, value, note }: { label: string; value: ReactNode; note?: string }) {
  return (
    <div className="bg-surface px-5 py-4">
      <dt className="text-xs font-medium tracking-wide text-muted uppercase">{label}</dt>
      <dd className="mt-1 flex items-baseline gap-2 font-display text-3xl font-semibold tabular-nums">
        {value}
        {note && <span className="font-sans text-sm font-normal text-muted">{note}</span>}
      </dd>
    </div>
  );
}
