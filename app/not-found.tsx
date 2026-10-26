import Link from "next/link";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { EmptyState } from "@/components/EmptyState";
import { button } from "@/components/ui";

export default function NotFound() {
  return (
    <EmptyState
      icon={MagnifyingGlassIcon}
      title="Hier ist nichts eingepackt"
      action={
        <Link href="/" className={button("primary")}>
          Zur Startseite
        </Link>
      }>
      Diese Seite gibt es nicht – vielleicht wurde die Liste inzwischen gelöscht.
    </EmptyState>
  );
}
