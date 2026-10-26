"use client";

import { useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { ArrowRightIcon, EyeIcon, EyeSlashIcon, GiftIcon } from "@heroicons/react/24/outline";
import { recordDraw } from "@/lib/actions";
import { plural } from "@/lib/format";
import { Avatar } from "./Avatar";
import { ConfirmDialog } from "./ConfirmDialog";

type Person = { id: number; name: string };

// Buttons on the pine-coloured Wichtel card
const onPine = clsx(
  "inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-full px-5 text-sm font-medium transition",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-pine",
  "disabled:pointer-events-none disabled:opacity-40",
);

/** Lets the current person enter whom they have drawn – exactly once. */
export function DrawPicker({ people }: { people: Person[] }) {
  const [selected, setSelected] = useState<Person | null>(null);
  const [confirming, setConfirming] = useState(false);

  return (
    <div>
      <fieldset>
        <legend className="sr-only">Gezogene Person</legend>
        <div className="flex flex-wrap gap-2">
          {people.map((person) => (
            <label key={person.id} className="cursor-pointer">
              <input
                type="radio"
                name="drawn"
                value={person.id}
                className="peer sr-only"
                onChange={() => setSelected(person)}
              />
              <span className="flex items-center gap-2 rounded-full border border-on-pine/25 py-1 pr-4 pl-1 font-medium transition peer-checked:border-on-pine peer-checked:bg-on-pine peer-checked:text-pine peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-on-pine hover:bg-on-pine/10 peer-checked:hover:bg-on-pine">
                <Avatar name={person.name} size="sm" ring={false} />
                {person.name}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <button
        type="button"
        disabled={!selected}
        onClick={() => setConfirming(true)}
        className={clsx(onPine, "mt-6 bg-on-pine text-pine hover:opacity-90")}>
        Ziehung festlegen
      </button>

      {selected && (
        <ConfirmDialog
          open={confirming}
          onClose={() => setConfirming(false)}
          title={`Du hast ${selected.name} gezogen?`}
          description="Das lässt sich danach nicht mehr ändern – nur der Admin kann eine Ziehung zurücksetzen."
          action={recordDraw}
          hidden={{ drawnId: String(selected.id) }}
          confirmLabel="Ja, festlegen"
          pendingLabel="Wird gespeichert…"
          variant="primary"
        />
      )}
    </div>
  );
}

/**
 * Shows the drawn person only on request, so nobody reads it over your
 * shoulder. Their wishlists can be opened without uncovering the name here.
 */
export function DrawReveal({
  person,
}: {
  person: Person & { wishlistCount: number; wishlistHref: string };
}) {
  const [shown, setShown] = useState(false);

  if (!shown) {
    return (
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setShown(true)}
          className={clsx(onPine, "bg-on-pine text-pine hover:opacity-90")}>
          <EyeIcon className="size-5" />
          Aufdecken
        </button>
        {person.wishlistCount > 0 ? (
          <Link
            href={person.wishlistHref}
            className={clsx(onPine, "border border-on-pine/30 hover:bg-on-pine/10")}>
            <GiftIcon className="size-5" />
            {person.wishlistCount === 1 ? "Wunschliste ansehen" : "Wunschlisten ansehen"}
          </Link>
        ) : (
          <span className={clsx(onPine, "cursor-default border border-on-pine/20 opacity-60")}>
            <GiftIcon className="size-5" />
            Noch keine Wunschliste
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
      <div className="flex items-center gap-4">
        <Avatar name={person.name} size="lg" ring={false} className="ring-4 ring-on-pine/30" />
        <div>
          <p className="font-display text-4xl leading-tight font-semibold">{person.name}</p>
          <Link
            href={person.wishlistHref}
            className="group inline-flex items-center gap-1.5 text-sm font-medium underline-offset-4 hover:underline">
            {plural(person.wishlistCount, "Wunschliste", "Wunschlisten")} ansehen
            <ArrowRightIcon className="size-4 transition group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setShown(false)}
        className={clsx(onPine, "border border-on-pine/30 hover:bg-on-pine/10")}>
        <EyeSlashIcon className="size-5" />
        Verbergen
      </button>
    </div>
  );
}
