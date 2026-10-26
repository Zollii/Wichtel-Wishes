"use client";

import { useState } from "react";
import { PencilSquareIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { addItem, deleteItem, updateItem } from "@/lib/actions";
import { LIMITS, type FormAction } from "@/lib/forms";
import { ConfirmDialog } from "./ConfirmDialog";
import { FormActions, FormError, TextAreaField, TextField } from "./fields";
import { Modal } from "./Modal";
import { button } from "./ui";
import { useFormAction } from "./useFormAction";

type ItemFields = {
  id: number;
  name: string;
  description: string | null;
  url: string | null;
};

export function AddItemButton({
  wishlist,
  variant = "secondary",
}: {
  wishlist: { id: number; title: string };
  variant?: "primary" | "secondary";
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={button(variant, variant === "primary" ? "md" : "sm")}>
        <PlusIcon className="size-4" />
        Wunsch hinzufügen
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Neuer Wunsch"
        description={<>Für deine Liste „{wishlist.title}“.</>}>
        <ItemForm
          action={addItem}
          hidden={{ wishlistId: String(wishlist.id) }}
          submitLabel="Hinzufügen"
          onDone={() => setOpen(false)}
        />
      </Modal>
    </>
  );
}

/** Edit and delete buttons for one wish. */
export function ItemActions({ item }: { item: ItemFields }) {
  const [dialog, setDialog] = useState<"edit" | "delete" | null>(null);
  const close = () => setDialog(null);

  return (
    <div className="flex shrink-0 items-center">
      <button
        type="button"
        onClick={() => setDialog("edit")}
        className={`${button("ghost", "icon")} size-8`}
        aria-label={`„${item.name}“ bearbeiten`}
        title="Bearbeiten">
        <PencilSquareIcon className="size-4.5" />
      </button>
      <button
        type="button"
        onClick={() => setDialog("delete")}
        className={`${button("ghost", "icon")} size-8 hover:bg-berry-soft hover:text-berry`}
        aria-label={`„${item.name}“ löschen`}
        title="Löschen">
        <TrashIcon className="size-4.5" />
      </button>

      <Modal open={dialog === "edit"} onClose={close} title="Wunsch bearbeiten">
        <ItemForm
          action={updateItem}
          item={item}
          hidden={{ itemId: String(item.id) }}
          submitLabel="Speichern"
          onDone={close}
        />
      </Modal>
      <ConfirmDialog
        open={dialog === "delete"}
        onClose={close}
        title="Wunsch löschen?"
        description={<>„{item.name}“ wird von deiner Liste entfernt.</>}
        action={deleteItem}
        hidden={{ itemId: String(item.id) }}
        confirmLabel="Löschen"
      />
    </div>
  );
}

function ItemForm({
  action,
  item,
  hidden,
  submitLabel,
  onDone,
}: {
  action: FormAction;
  item?: ItemFields;
  hidden: Record<string, string>;
  submitLabel: string;
  onDone: () => void;
}) {
  const { error, pending, onSubmit } = useFormAction(action, onDone);
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {Object.entries(hidden).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <TextField
        id="item-name"
        name="name"
        label="Was wünschst du dir?"
        placeholder="z. B. Kuschelige Wollsocken"
        defaultValue={item?.name}
        maxLength={LIMITS.itemName}
        autoComplete="off"
        required
      />
      <TextAreaField
        id="item-description"
        name="description"
        label="Details"
        optional
        placeholder="Größe, Farbe, Modell …"
        defaultValue={item?.description ?? ""}
        maxLength={LIMITS.description}
      />
      <TextField
        id="item-url"
        name="url"
        label="Link zum Produkt"
        optional
        inputMode="url"
        placeholder="https://…"
        defaultValue={item?.url ?? ""}
        maxLength={LIMITS.url}
        autoComplete="off"
      />
      <FormError message={error} />
      <FormActions onCancel={onDone} pending={pending} pendingLabel="Wird gespeichert…">
        {submitLabel}
      </FormActions>
    </form>
  );
}
