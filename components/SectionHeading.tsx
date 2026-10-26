export function SectionHeading({
  id,
  title,
  meta,
}: {
  id: string;
  title: string;
  meta?: string;
}) {
  return (
    <div className="mb-6 flex items-baseline justify-between gap-4 border-b border-line pb-3">
      <h2 id={id} className="font-display text-3xl font-semibold tracking-tight">
        {title}
      </h2>
      {meta && <span className="shrink-0 text-sm text-muted">{meta}</span>}
    </div>
  );
}
