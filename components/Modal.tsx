"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { button } from "./ui";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  children: ReactNode;
};

/**
 * Native <dialog> based modal: focus trapping, Escape and the top layer come
 * for free. Content only mounts while open, so forms start fresh every time.
 */
export function Modal({ open, onClose, title, description, children }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      // A click on the dialog element itself means the backdrop was clicked.
      onClick={(event) => event.target === event.currentTarget && onClose()}
      className="modal m-auto w-[min(100%-2rem,34rem)] rounded-3xl border border-line bg-surface p-0 text-ink shadow-2xl">
      {open && (
        <div className="relative p-6 sm:p-8">
          <h2 id={titleId} className="pr-10 font-display text-2xl leading-tight font-semibold">
            {title}
          </h2>
          {description && <p className="mt-1.5 text-sm text-muted">{description}</p>}
          <div className="mt-6">{children}</div>
          {/* Rendered last so the first form field receives initial focus. */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Schließen"
            className={`${button("ghost", "icon")} absolute top-4 right-4`}>
            <XMarkIcon className="size-5" />
          </button>
        </div>
      )}
    </dialog>
  );
}
