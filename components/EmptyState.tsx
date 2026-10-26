import type { ComponentType, ReactNode, SVGProps } from "react";

export function EmptyState({
  icon: Icon,
  title,
  children,
  action,
}: {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-3xl border-2 border-dashed border-line px-6 py-14 text-center">
      <span className="grid size-16 place-items-center rounded-full bg-gold-soft text-gold">
        <Icon className="size-8" />
      </span>
      <h3 className="mt-5 font-display text-2xl font-semibold">{title}</h3>
      {children && <p className="mt-2 max-w-md text-muted">{children}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
