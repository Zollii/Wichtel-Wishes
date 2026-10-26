"use client";

import { useState } from "react";
import clsx from "clsx";
import {
  ArrowPathIcon,
  ArrowRightStartOnRectangleIcon,
  ArrowUturnLeftIcon,
  BellAlertIcon,
  KeyIcon,
  PencilSquareIcon,
  TrashIcon,
  UserPlusIcon,
} from "@heroicons/react/24/outline";
import {
  addPerson,
  adminLogin,
  assignPin,
  deletePerson,
  dismissPinRequest,
  renamePerson,
  resetAllDraws,
  resetDraw,
  setWishlistVisibility,
  signOutDevices,
} from "@/lib/admin-actions";
import { LIMITS, PIN_LENGTH, type FormAction } from "@/lib/forms";
import { Avatar } from "./Avatar";
import { ConfirmDialog } from "./ConfirmDialog";
import { FormActions, FormError, Spinner, TextField } from "./fields";
import { Modal } from "./Modal";
import { PinField } from "./PinField";
import { button } from "./ui";
import { useFormAction } from "./useFormAction";

export function AdminLoginForm() {
  const { error, pending, onSubmit } = useFormAction(adminLogin);
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <TextField
        id="admin-password"
        name="password"
        type="password"
        label="Passwort"
        autoComplete="current-password"
        required
        autoFocus
      />
      <FormError message={error} />
      <button type="submit" disabled={pending} className={clsx(button("primary"), "w-full")}>
        {pending && <Spinner />}
        Anmelden
      </button>
    </form>
  );
}

export function AddPersonButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={button("primary")}>
        <UserPlusIcon className="size-5" />
        Person hinzufügen
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Wer ist neu dabei?"
        description="Neue Familienmitglieder können ihr Profil danach auf der Startseite auswählen.">
        <PersonForm action={addPerson} submitLabel="Hinzufügen" onDone={() => setOpen(false)} />
      </Modal>
    </>
  );
}

type PinRequest = { id: number; name: string; requestedAt: string };

/**
 * "PIN vergessen?" requests, shown on top of the admin page. Stays mounted
 * when the last request is answered, so the new PIN can still be shown.
 */
export function PinRequests({ requests }: { requests: PinRequest[] }) {
  const [assigning, setAssigning] = useState<PinRequest | null>(null);
  const [dismissing, setDismissing] = useState<PinRequest | null>(null);

  return (
    <>
      {requests.length > 0 && (
        <section
          aria-labelledby="pin-requests"
          className="rounded-3xl border-2 border-gold/40 bg-gold-soft p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-gold text-white">
              <BellAlertIcon className="size-5" />
            </span>
            <h2 id="pin-requests" className="font-display text-2xl font-semibold">
              {requests.length === 1 ? "PIN vergessen" : `${requests.length}× PIN vergessen`}
            </h2>
          </div>
          <p className="mt-3 max-w-2xl text-muted">
            Gib eine vorläufige PIN weiter. Gleich nach der Anmeldung damit wählt die Person eine
            eigene, die du nicht kennst.
          </p>
          <ul className="mt-5 space-y-2">
            {requests.map((request) => (
              <li
                key={request.id}
                className="flex flex-col gap-3 rounded-2xl bg-surface px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar name={request.name} size="md" ring={false} />
                  <div className="min-w-0">
                    <p className="font-display text-lg font-semibold wrap-break-word">{request.name}</p>
                    <p className="text-xs text-muted">angefragt am {request.requestedAt}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  <button
                    type="button"
                    onClick={() => setAssigning(request)}
                    className={button("primary", "sm")}>
                    <KeyIcon className="size-4" />
                    PIN vergeben
                  </button>
                  <button
                    type="button"
                    onClick={() => setDismissing(request)}
                    className={clsx(button("ghost", "sm"), "px-3")}>
                    Verwerfen
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Modal
        open={assigning !== null}
        onClose={() => setAssigning(null)}
        title={`Neue PIN für ${assigning?.name}`}
        description={`Alle Geräte von ${assigning?.name} werden dabei abgemeldet.`}>
        {assigning && <AssignPinForm person={assigning} onClose={() => setAssigning(null)} />}
      </Modal>
      <ConfirmDialog
        open={dismissing !== null}
        onClose={() => setDismissing(null)}
        title="Anfrage verwerfen?"
        description={
          <>
            {dismissing?.name} behält die bisherige PIN. Verwirf die Anfrage nur, wenn sie nicht
            (mehr) gebraucht wird.
          </>
        }
        action={dismissPinRequest}
        hidden={{ personId: String(dismissing?.id) }}
        confirmLabel="Verwerfen"
        pendingLabel="Wird verworfen…"
      />
    </>
  );
}

function randomPin() {
  const [value] = crypto.getRandomValues(new Uint32Array(1));
  return String(value % 10 ** PIN_LENGTH).padStart(PIN_LENGTH, "0");
}

function AssignPinForm({ person, onClose }: { person: PinRequest; onClose: () => void }) {
  const [pin, setPin] = useState(randomPin);
  const [done, setDone] = useState(false);
  const { error, pending, onSubmit } = useFormAction(assignPin, () => setDone(true));

  if (done) {
    return (
      <div className="space-y-5">
        <p>Erledigt! Gib {person.name} diese PIN – am besten persönlich oder am Telefon:</p>
        <p className="rounded-2xl bg-surface-2 py-4 text-center font-display text-4xl font-semibold tracking-[0.3em] tabular-nums">
          {pin}
        </p>
        <div className="flex justify-end">
          <button type="button" onClick={onClose} className={button("primary")}>
            Fertig
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <input type="hidden" name="personId" value={person.id} />
      <PinField
        id="assign-pin"
        name="pin"
        label="Vorläufige PIN"
        value={pin}
        onValueChange={setPin}
        hint={`${person.name} muss sie gleich nach der Anmeldung durch eine eigene ersetzen.`}
      />
      <div className="flex justify-center">
        <button type="button" onClick={() => setPin(randomPin())} className={button("secondary", "sm")}>
          <ArrowPathIcon className="size-4" />
          Andere PIN würfeln
        </button>
      </div>
      <FormError message={error} />
      <FormActions onCancel={onClose} pending={pending} pendingLabel="Wird gespeichert…">
        PIN vergeben
      </FormActions>
    </form>
  );
}

type PersonStatus = { id: number; name: string; hasPin: boolean; devices: number };
type Dialog = "rename" | "signOut" | "reset" | "delete";

/** Row actions for one family member on the admin page. */
export function PersonAdminActions({ person }: { person: PersonStatus }) {
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const close = () => setDialog(null);
  const hidden = { personId: String(person.id) };
  const action = clsx(button("ghost", "sm"), "px-3");

  return (
    <div className="flex flex-wrap gap-1 lg:shrink-0 lg:justify-end">
      <button type="button" onClick={() => setDialog("rename")} className={action}>
        <PencilSquareIcon className="size-4" />
        Umbenennen
      </button>
      {person.devices > 0 && (
        <button type="button" onClick={() => setDialog("signOut")} className={action}>
          <ArrowRightStartOnRectangleIcon className="size-4" />
          Geräte abmelden
        </button>
      )}
      {/* Offered for everybody, so it doesn't tell who has entered a draw. */}
      <button type="button" onClick={() => setDialog("reset")} className={action}>
        <ArrowUturnLeftIcon className="size-4" />
        Ziehung zurücksetzen
      </button>
      <button
        type="button"
        onClick={() => setDialog("delete")}
        className={clsx(action, "hover:bg-berry-soft hover:text-berry")}>
        <TrashIcon className="size-4" />
        Löschen
      </button>

      <Modal open={dialog === "rename"} onClose={close} title={`${person.name} umbenennen`}>
        <PersonForm
          action={renamePerson}
          person={person}
          submitLabel="Speichern"
          onDone={close}
        />
      </Modal>
      <ConfirmDialog
        open={dialog === "signOut"}
        onClose={close}
        title="Alle Geräte abmelden?"
        description={
          person.hasPin ? (
            <>
              {person.name} wird überall abgemeldet, zum Beispiel wegen eines verlorenen Handys,
              und meldet sich danach mit der PIN wieder an.
            </>
          ) : (
            <>
              {person.name} hat noch keine PIN. Nach dem Abmelden ist das Profil wieder frei –
              wer es zuerst auswählt, legt die PIN fest.
            </>
          )
        }
        action={signOutDevices}
        hidden={hidden}
        confirmLabel="Abmelden"
        pendingLabel="Wird abgemeldet…"
      />
      <ConfirmDialog
        open={dialog === "reset"}
        onClose={close}
        title="Ziehung zurücksetzen?"
        description={
          <>
            Falls {person.name} schon eingetragen hat, wen er oder sie gezogen hat, kann{" "}
            {person.name} das danach neu eintragen. Ob und wen, bleibt geheim.
          </>
        }
        action={resetDraw}
        hidden={hidden}
        confirmLabel="Zurücksetzen"
        pendingLabel="Wird zurückgesetzt…"
      />
      <ConfirmDialog
        open={dialog === "delete"}
        onClose={close}
        title={`${person.name} löschen?`}
        description={
          <>
            {person.name} wird mit allen Wunschlisten endgültig gelöscht. Wer {person.name}{" "}
            gezogen hatte, muss neu eintragen.
          </>
        }
        action={deletePerson}
        hidden={hidden}
        confirmLabel="Endgültig löschen"
      />
    </div>
  );
}

/** Switch for "only the Wichtel may see this list". */
export function VisibilityToggle({
  wishlist,
}: {
  wishlist: { id: number; title: string; wichtelOnly: boolean };
}) {
  const { error, pending, onSubmit } = useFormAction(setWishlistVisibility);
  return (
    <form onSubmit={onSubmit} className="flex shrink-0 items-center gap-2.5">
      <input type="hidden" name="wishlistId" value={wishlist.id} />
      <input type="hidden" name="visibility" value={wishlist.wichtelOnly ? "family" : "wichtel"} />
      {error && <span className="text-xs text-berry">{error}</span>}
      <span className="text-xs text-muted">Nur für den Wichtel</span>
      <button
        type="submit"
        role="switch"
        aria-checked={wishlist.wichtelOnly}
        aria-label={`„${wishlist.title}“ nur für den Wichtel sichtbar`}
        disabled={pending}
        className="group relative h-6 w-11 shrink-0 cursor-pointer rounded-full bg-line transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine disabled:opacity-60 aria-checked:bg-berry">
        <span className="absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition group-aria-checked:translate-x-5" />
      </button>
    </form>
  );
}

export function ResetAllDrawsButton({ disabled }: { disabled: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className={button("danger")}>
        <ArrowUturnLeftIcon className="size-5" />
        Alle Ziehungen zurücksetzen
      </button>
      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        title="Neue Runde starten?"
        description="Alle eingetragenen Ziehungen werden gelöscht. Profile, PINs und Wunschlisten bleiben erhalten."
        action={resetAllDraws}
        confirmLabel="Alle zurücksetzen"
        pendingLabel="Wird zurückgesetzt…"
      />
    </>
  );
}

function PersonForm({
  action,
  person,
  submitLabel,
  onDone,
}: {
  action: FormAction;
  person?: { id: number; name: string };
  submitLabel: string;
  onDone: () => void;
}) {
  const { error, pending, onSubmit } = useFormAction(action, onDone);
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {person && <input type="hidden" name="personId" value={person.id} />}
      <TextField
        id="person-name"
        name="name"
        label="Name"
        placeholder="z. B. Oma Gerti"
        defaultValue={person?.name}
        maxLength={LIMITS.personName}
        autoComplete="off"
        required
      />
      <FormError message={error} />
      <FormActions onCancel={onDone} pending={pending} pendingLabel="Wird gespeichert…">
        {submitLabel}
      </FormActions>
    </form>
  );
}
