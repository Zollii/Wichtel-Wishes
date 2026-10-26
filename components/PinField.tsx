"use client";

import { useState } from "react";
import { flushSync } from "react-dom";
import clsx from "clsx";
import { PIN_LENGTH } from "@/lib/forms";

/**
 * The PIN as a row of digit boxes. Underneath is one ordinary (invisible)
 * input, so typing, pasting, backspace, the number pad on phones and screen
 * readers all work as usual.
 */
export function PinField({
  id,
  name,
  label,
  hint,
  value,
  onValueChange,
  onComplete,
  autoFocus,
}: {
  id: string;
  name: string;
  label: string;
  hint?: string;
  /** Controlled value; leave out to let the field keep its own. */
  value?: string;
  onValueChange?: (pin: string) => void;
  /** Called once the last digit is entered. */
  onComplete?: () => void;
  autoFocus?: boolean;
}) {
  const [ownValue, setOwnValue] = useState("");
  const [focused, setFocused] = useState(false);
  const pin = value ?? ownValue;
  const active = Math.min(pin.length, PIN_LENGTH - 1);

  function change(digits: string) {
    setOwnValue(digits);
    onValueChange?.(digits);
  }

  return (
    <div className="text-center">
      <label htmlFor={id} className="mb-2 block text-sm font-medium">
        {label}
      </label>
      <div className="relative mx-auto w-fit">
        <input
          id={id}
          name={name}
          value={pin}
          onChange={(event) => {
            const digits = event.target.value.replace(/\D/g, "").slice(0, PIN_LENGTH);
            if (onComplete && digits.length === PIN_LENGTH && digits !== pin) {
              // The input has to hold the cleaned-up digits before the form reads it.
              flushSync(() => change(digits));
              onComplete();
            } else {
              change(digits);
            }
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          type="text"
          inputMode="numeric"
          // No maxLength: it would cut "12 34" short before the space is removed.
          pattern={`\\d{${PIN_LENGTH}}`}
          title={`${PIN_LENGTH} Ziffern`}
          autoComplete="off"
          autoFocus={autoFocus}
          required
          // text-base keeps iOS from zooming in on focus.
          className="absolute inset-0 z-10 w-full cursor-text text-base opacity-0"
        />
        <div aria-hidden className="flex gap-3">
          {Array.from({ length: PIN_LENGTH }, (_, index) => {
            const digit = pin[index];
            const current = focused && index === active;
            return (
              <span
                key={index}
                className={clsx(
                  "grid h-16 w-14 place-items-center rounded-2xl border bg-paper font-display text-3xl font-semibold tabular-nums transition sm:h-18 sm:w-16",
                  current ? "border-pine ring-4 ring-pine/15" : digit ? "border-ink/25" : "border-line",
                )}>
                {digit ?? (current && <span className="h-7 w-0.5 animate-pulse rounded-full bg-pine" />)}
              </span>
            );
          })}
        </div>
      </div>
      {hint && <p className="mt-2 text-xs text-muted">{hint}</p>}
    </div>
  );
}
