"use client";

import { useEffect } from "react";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { EmptyState } from "@/components/EmptyState";
import { button } from "@/components/ui";

export default function ErrorPage({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <EmptyState
      icon={ExclamationTriangleIcon}
      title="Da ist etwas schiefgelaufen"
      action={
        <button type="button" onClick={() => retry()} className={button("primary")}>
          Nochmal versuchen
        </button>
      }>
      Bitte versuche es gleich noch einmal.
    </EmptyState>
  );
}
