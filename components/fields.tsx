import clsx from "clsx";
import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";
import { ExclamationCircleIcon } from "@heroicons/react/24/outline";
import { button } from "./ui";

const control = clsx(
  "w-full rounded-2xl border border-line bg-paper px-4 py-3 text-base text-ink transition",
  "placeholder:text-muted/70 focus:border-pine focus:ring-4 focus:ring-pine/15 focus:outline-none",
  "disabled:opacity-60",
);

type FieldProps = {
  label: string;
  hint?: string;
  optional?: boolean;
};

function Label({ htmlFor, label, optional }: FieldProps & { htmlFor: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-2 flex items-baseline justify-between text-sm font-medium">
      {label}
      {optional && <span className="text-xs font-normal text-muted">optional</span>}
    </label>
  );
}

export function TextField({
  label,
  hint,
  optional,
  ...props
}: FieldProps & InputHTMLAttributes<HTMLInputElement> & { id: string }) {
  return (
    <div>
      <Label htmlFor={props.id} label={label} optional={optional} />
      <input type="text" className={control} {...props} />
      {hint && <p className="mt-1.5 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function TextAreaField({
  label,
  hint,
  optional,
  ...props
}: FieldProps & TextareaHTMLAttributes<HTMLTextAreaElement> & { id: string }) {
  return (
    <div>
      <Label htmlFor={props.id} label={label} optional={optional} />
      <textarea rows={3} className={clsx(control, "resize-y")} {...props} />
      {hint && <p className="mt-1.5 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="flex items-start gap-2 rounded-2xl bg-berry-soft px-4 py-3 text-sm text-berry">
      <ExclamationCircleIcon className="mt-px size-5 shrink-0" />
      {message}
    </p>
  );
}

export function Spinner() {
  return (
    <span
      aria-hidden
      className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
    />
  );
}

export function FormActions({
  onCancel,
  pending,
  children,
  pendingLabel,
  variant = "primary",
}: {
  onCancel: () => void;
  pending: boolean;
  children: ReactNode;
  pendingLabel: string;
  variant?: "primary" | "danger";
}) {
  return (
    <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
      <button type="button" onClick={onCancel} className={button("secondary")}>
        Abbrechen
      </button>
      <button type="submit" disabled={pending} className={button(variant)}>
        {pending ? (
          <>
            <Spinner />
            {pendingLabel}
          </>
        ) : (
          children
        )}
      </button>
    </div>
  );
}
