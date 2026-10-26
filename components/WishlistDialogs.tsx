"use client";

import { useState } from "react";
import {
  LockClosedIcon,
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { createWishlist, deleteWishlist, updateWishlist } from "@/lib/actions";
import { LIMITS, type FormAction } from "@/lib/forms";
import { ConfirmDialog } from "./ConfirmDialog";
import { FormActions, FormError, TextAreaField, TextField } from "./fields";
import { Modal } from "./Modal";
import { button } from "./ui";
import { useFormAction } from "./useFormAction";

type WishlistFields = {
  id: number;
  title: string;
  description: string | null;
  wichtelOnly: boolean;
};

const visibilityOptions = [
  {
    value: "wichtel",
    icon: LockClosedIcon,
    label: "Nur mein Wichtel",
    hint: "Nur du und die Person, die dich gezogen hat",
  },
  {
    value: "family",
    icon: UserGroupIcon,
    label: "Ganze Familie",
    hint: "Alle Familienmitglieder",
  },
];

function VisibilityField({ wichtelOnly }: { wichtelOnly: boolean }) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium">Wer darf die Liste sehen?</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {visibilityOptions.map(({ value, icon: Icon, label, hint }) => (
          <label key={value} className="cursor-pointer">
            <input
              type="radio"
              name="visibility"
              value={value}
              defaultChecked={(value === "wichtel") === wichtelOnly}
              className="peer sr-only"
            />
            <span className="flex h-full gap-3 rounded-2xl border border-line bg-paper p-3.5 transition peer-checked:border-pine peer-checked:bg-pine-soft peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-pine hover:border-ink/25">
              <Icon className="mt-0.5 size-5 shrink-0 text-pine" />
              <span>
                <span className="block text-sm font-medium">{label}</span>
                <span className="block text-xs text-muted">{hint}</span>
              </span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function CreateWishlistButton({ label = "Neue Wunschliste" }: { label?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={button("primary")}>
        <PlusIcon className="size-5" />
        {label}
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Neue Wunschliste"
        description="Zum Beispiel für Weihnachten, deinen Geburtstag oder einfach so.">
        <WishlistForm action={createWishlist} submitLabel="Liste erstellen" onDone={() => setOpen(false)} />
      </Modal>
    </>
  );
}

export function EditWishlistButton({ wishlist }: { wishlist: WishlistFields }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={button("ghost", "icon")}
        aria-label={`„${wishlist.title}“ bearbeiten`}
        title="Liste bearbeiten">
        <PencilSquareIcon className="size-5" />
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Wunschliste bearbeiten">
        <WishlistForm
          action={updateWishlist}
          wishlist={wishlist}
          submitLabel="Speichern"
          onDone={() => setOpen(false)}
        />
      </Modal>
    </>
  );
}

export function DeleteWishlistButton({
  wishlist,
  returnToProfile = false,
}: {
  wishlist: WishlistFields;
  returnToProfile?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`${button("ghost", "icon")} hover:bg-berry-soft hover:text-berry`}
        aria-label={`„${wishlist.title}“ löschen`}
        title="Liste löschen">
        <TrashIcon className="size-5" />
      </button>
      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        title="Wunschliste löschen?"
        description={
          <>
            „{wishlist.title}“ wird mit allen Wünschen darauf endgültig gelöscht.
          </>
        }
        action={deleteWishlist}
        hidden={{ wishlistId: String(wishlist.id), returnToProfile: returnToProfile ? "1" : "" }}
        confirmLabel="Endgültig löschen"
      />
    </>
  );
}

function WishlistForm({
  action,
  wishlist,
  submitLabel,
  onDone,
}: {
  action: FormAction;
  wishlist?: WishlistFields;
  submitLabel: string;
  onDone: () => void;
}) {
  const { error, pending, onSubmit } = useFormAction(action, onDone);
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {wishlist && <input type="hidden" name="wishlistId" value={wishlist.id} />}
      <TextField
        id="wishlist-title"
        name="title"
        label="Titel"
        placeholder="z. B. Weihnachten 2026"
        defaultValue={wishlist?.title}
        maxLength={LIMITS.wishlistTitle}
        autoComplete="off"
        required
      />
      <TextAreaField
        id="wishlist-description"
        name="description"
        label="Beschreibung"
        optional
        placeholder="Worüber würdest du dich freuen? Größen, Lieblingsfarben, …"
        defaultValue={wishlist?.description ?? ""}
        maxLength={LIMITS.description}
      />
      <VisibilityField wichtelOnly={wishlist?.wichtelOnly ?? true} />
      <FormError message={error} />
      <FormActions onCancel={onDone} pending={pending} pendingLabel="Wird gespeichert…">
        {submitLabel}
      </FormActions>
    </form>
  );
}
