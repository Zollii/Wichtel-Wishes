"use client";

import { useRef, useState, type ReactNode } from "react";
import { requestPinReset, setUpProfile, signIn } from "@/lib/actions";
import { PIN_LENGTH } from "@/lib/forms";
import { FormActions, FormError } from "./fields";
import { Modal } from "./Modal";
import { PinField } from "./PinField";
import { NewPinField } from "./PinForms";
import { button } from "./ui";
import { useFormAction } from "./useFormAction";

type Person = {
  id: number;
  name: string;
  signIn: "free" | "pin" | "pending";
  resetRequested: boolean;
};

const textLink =
  "cursor-pointer rounded-full text-sm font-medium text-muted underline-offset-4 transition hover:text-ink hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine";

/** A profile tile on the start page: set the profile up, or sign in with its PIN. */
export function SignInTile({ person, children }: { person: Person; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [forgot, setForgot] = useState(false);
  const close = () => {
    setOpen(false);
    setForgot(false);
  };

  const view = forgot ? "forgot" : person.signIn;
  const dialog = {
    free: {
      title: `Bist du ${person.name}?`,
      description: `Dann leg eine ${PIN_LENGTH}-stellige PIN fest. Mit ihr meldest du dich auf jedem deiner Geräte an – verrate sie niemandem.`,
    },
    pin: {
      title: `Hallo ${person.name}!`,
      description: "Gib deine PIN ein, um dich auf diesem Gerät anzumelden.",
    },
    forgot: {
      title: "PIN vergessen?",
      description:
        "Der Admin bekommt Bescheid und gibt dir eine vorläufige PIN. Gleich nach der Anmeldung damit wählst du wieder deine eigene.",
    },
    pending: {
      title: `${person.name} hat noch keine PIN`,
      description:
        "Öffne die App auf dem Gerät, auf dem du schon angemeldet bist – dort legst du deine PIN fest. Kommst du an das Gerät nicht mehr heran, gibt dir der Admin eine.",
    },
  }[view];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="card group flex h-full min-h-56 w-full cursor-pointer flex-col items-center p-5 text-center transition hover:-translate-y-1 hover:border-pine/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine sm:p-6">
        {children}
      </button>
      <Modal open={open} onClose={close} {...dialog}>
        {view === "free" && <SetUpForm person={person} onCancel={close} />}
        {view === "pin" && (
          <SignInForm person={person} onCancel={close} onForgot={() => setForgot(true)} />
        )}
        {(view === "forgot" || view === "pending") && (
          <RequestPinForm
            person={person}
            onCancel={close}
            onBack={view === "forgot" ? () => setForgot(false) : undefined}
          />
        )}
      </Modal>
    </>
  );
}

function SetUpForm({ person, onCancel }: { person: Person; onCancel: () => void }) {
  const { error, pending, onSubmit } = useFormAction(setUpProfile);
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <input type="hidden" name="personId" value={person.id} />
      <NewPinField label="Deine PIN" />
      <FormError message={error} />
      <FormActions onCancel={onCancel} pending={pending} pendingLabel="Wird eingerichtet…">
        Ja, ich bin {person.name}
      </FormActions>
    </form>
  );
}

function SignInForm({
  person,
  onCancel,
  onForgot,
}: {
  person: Person;
  onCancel: () => void;
  onForgot: () => void;
}) {
  const { error, pending, onSubmit } = useFormAction(signIn);
  const form = useRef<HTMLFormElement>(null);
  // The first try goes off with the last digit; after a wrong PIN, people
  // confirm with the button so a typo doesn't cost another try.
  const autoSubmit = !error && !pending ? () => form.current?.requestSubmit() : undefined;

  return (
    <form ref={form} onSubmit={onSubmit} className="space-y-5">
      <input type="hidden" name="personId" value={person.id} />
      {/* Every error remounts the field: empty and focused for the next try. */}
      <PinField key={error} id="pin" name="pin" label="PIN" autoFocus onComplete={autoSubmit} />
      <FormError message={error} />
      <FormActions onCancel={onCancel} pending={pending} pendingLabel="Wird geprüft…">
        Anmelden
      </FormActions>
      <p className="text-center">
        <button type="button" onClick={onForgot} className={textLink}>
          PIN vergessen?
        </button>
      </p>
    </form>
  );
}

function RequestPinForm({
  person,
  onCancel,
  onBack,
}: {
  person: Person;
  onCancel: () => void;
  onBack?: () => void;
}) {
  const { error, pending, onSubmit } = useFormAction(requestPinReset);

  if (person.resetRequested) {
    return (
      <div className="space-y-5">
        <p className="rounded-2xl bg-pine-soft px-4 py-3 text-sm text-pine">
          Der Admin weiß Bescheid. Sobald du die neue PIN hast, meldest du dich hier damit an.
        </p>
        <div className="flex flex-col-reverse items-center gap-3 sm:flex-row sm:justify-between">
          {onBack ? (
            <button type="button" onClick={onBack} className={textLink}>
              Doch wieder eingefallen?
            </button>
          ) : (
            <span />
          )}
          <button type="button" onClick={onCancel} className={button("primary")}>
            Schließen
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <input type="hidden" name="personId" value={person.id} />
      <FormError message={error} />
      <FormActions onCancel={onBack ?? onCancel} pending={pending} pendingLabel="Wird gesendet…">
        Admin Bescheid geben
      </FormActions>
    </form>
  );
}
