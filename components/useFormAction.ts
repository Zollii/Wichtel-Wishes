"use client";

import { startTransition, useActionState, type FormEvent } from "react";
import type { FormAction, FormState } from "@/lib/forms";

/**
 * Runs a server action from a form and calls `onSuccess` when it reports ok
 * (actions that redirect on success don't need it).
 * Submitting via onSubmit (instead of the `action` prop) keeps the typed
 * values in place when the server responds with a validation error.
 */
export function useFormAction(action: FormAction, onSuccess?: () => void) {
  const [state, dispatch, pending] = useActionState<FormState, FormData>(
    async (previous, formData) => {
      const result = await action(previous, formData);
      if (result.ok) onSuccess?.();
      return result;
    },
    {},
  );

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => dispatch(formData));
  }

  return { error: state.error, pending, onSubmit };
}
