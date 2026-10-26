"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { ChevronDownIcon, KeyIcon, UserIcon } from "@heroicons/react/24/outline";
import { Avatar } from "./Avatar";
import { ChangePinDialog, SignOutButton } from "./PinForms";

const item =
  "flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition hover:bg-ink/6 focus-visible:outline-2 focus-visible:outline-pine";

/** The signed-in person in the header, with "PIN ändern" and "Abmelden". */
export function UserMenu({ person }: { person: { id: number; name: string } }) {
  const [open, setOpen] = useState(false);
  const [changingPin, setChangingPin] = useState(false);
  const menuId = useId();
  const ref = useRef<HTMLDivElement>(null);

  // A click anywhere else or Escape closes the menu.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls={menuId}
        className="flex cursor-pointer items-center gap-2 rounded-full py-1 pr-2.5 pl-1 text-sm font-medium transition hover:bg-ink/6 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine aria-expanded:bg-ink/6">
        <Avatar name={person.name} size="sm" ring={false} />
        <span className="max-w-40 truncate">{person.name}</span>
        <ChevronDownIcon className={clsx("size-4 text-muted transition", open && "rotate-180")} />
      </button>

      {open && (
        <div
          id={menuId}
          className="absolute top-full right-0 z-40 mt-2 w-56 rounded-2xl border border-line bg-surface p-1.5 shadow-xl">
          <Link href={`/user/${person.id}`} onClick={() => setOpen(false)} className={item}>
            <UserIcon className="size-4" />
            Mein Bereich
          </Link>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              setChangingPin(true);
            }}
            className={item}>
            <KeyIcon className="size-4" />
            PIN ändern
          </button>
          <div className="my-1 border-t border-line" />
          <SignOutButton className={item} />
        </div>
      )}

      <ChangePinDialog open={changingPin} onClose={() => setChangingPin(false)} />
    </div>
  );
}
