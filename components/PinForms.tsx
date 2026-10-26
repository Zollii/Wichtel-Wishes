"use client";

import { useState } from "react";
import clsx from "clsx";
import { ArrowRightStartOnRectangleIcon } from "@heroicons/react/24/outline";
import { changePin, signOut } from "@/lib/actions";
import { FormActions, FormError, Spinner } from "./fields";
import { Modal } from "./Modal";
import { PinField } from "./PinField";
import { button } from "./ui";
import { useFormAction } from "./useFormAction";

export function NewPinField({ label = "Neue PIN" }: { label?: string }) {
  return (
    <PinField
      id="new-pin"
      name="pin"
      label={label}
      hint="Bitte nichts Naheliegendes wie 1234 oder 0000."
    />
  );
}

/** For people who have no PIN yet or signed in with one from the admin. */
export function ChoosePinForm() {
  const { error, pending, onSubmit } = useFormAction(changePin);
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <NewPinField />
      <FormError message={error} />
      <button type="submit" disabled={pending} className={clsx(button("primary"), "w-full")}>
        {pending && <Spinner />}
        PIN speichern
      </button>
    </form>
  );
}

export function SignOutButton({ className, label = "Abmelden" }: { className?: string; label?: string }) {
  return (
    <form action={signOut} className="flex">
      <button type="submit" className={className}>
        <ArrowRightStartOnRectangleIcon className="size-4" />
        {label}
      </button>
    </form>
  );
}

export function ChangePinDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="PIN ändern"
      description="Deine anderen Geräte werden dabei abgemeldet – dort meldest du dich mit der neuen PIN wieder an.">
      <ChangePinForm onClose={onClose} />
    </Modal>
  );
}

function ChangePinForm({ onClose }: { onClose: () => void }) {
  const [done, setDone] = useState(false);
  const { error, pending, onSubmit } = useFormAction(changePin, () => setDone(true));

  if (done) {
    return (
      <div className="space-y-5">
        <p className="rounded-2xl bg-pine-soft px-4 py-3 text-sm text-pine">
          Erledigt – ab jetzt gilt deine neue PIN.
        </p>
        <div className="flex justify-end">
          <button type="button" onClick={onClose} className={button("primary")}>
            Schließen
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <PinField id="current-pin" name="currentPin" label="Bisherige PIN" />
      <NewPinField />
      <FormError message={error} />
      <FormActions onCancel={onClose} pending={pending} pendingLabel="Wird gespeichert…">
        PIN ändern
      </FormActions>
    </form>
  );
}
