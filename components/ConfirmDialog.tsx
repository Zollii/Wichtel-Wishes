"use client";

import type { ReactNode } from "react";
import type { FormAction } from "@/lib/forms";
import { FormActions, FormError } from "./fields";
import { Modal } from "./Modal";
import { useFormAction } from "./useFormAction";

type ConfirmProps = {
  action: FormAction;
  hidden?: Record<string, string>;
  confirmLabel: string;
  pendingLabel?: string;
  variant?: "primary" | "danger";
};

/** Asks before running a server action that is hard or impossible to undo. */
export function ConfirmDialog({
  open,
  onClose,
  title,
  description,
  ...form
}: ConfirmProps & {
  open: boolean;
  onClose: () => void;
  title: string;
  description: ReactNode;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} description={description}>
      <ConfirmForm {...form} onClose={onClose} />
    </Modal>
  );
}

function ConfirmForm({
  action,
  hidden = {},
  confirmLabel,
  pendingLabel = "Wird gelöscht…",
  variant = "danger",
  onClose,
}: ConfirmProps & { onClose: () => void }) {
  const { error, pending, onSubmit } = useFormAction(action, onClose);
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {Object.entries(hidden).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <FormError message={error} />
      <FormActions onCancel={onClose} pending={pending} pendingLabel={pendingLabel} variant={variant}>
        {confirmLabel}
      </FormActions>
    </form>
  );
}
