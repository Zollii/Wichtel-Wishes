import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LockClosedIcon } from "@heroicons/react/24/outline";
import { AdminLoginForm } from "@/components/AdminControls";
import { isAdmin, isAdminConfigured } from "@/lib/admin";

export const metadata: Metadata = { title: "Admin-Anmeldung" };

export default async function AdminLoginPage() {
  if (await isAdmin()) redirect("/admin");

  return (
    <div className="mx-auto max-w-md">
      <div className="card p-6 sm:p-8">
        <span className="grid size-12 place-items-center rounded-2xl bg-gold-soft text-gold">
          <LockClosedIcon className="size-6" />
        </span>
        <h1 className="mt-5 font-display text-3xl font-semibold tracking-tight">Admin-Bereich</h1>
        {isAdminConfigured() ? (
          <>
            <p className="mt-2 text-muted">
              Familienmitglieder verwalten und Profile oder Ziehungen zurücksetzen.
            </p>
            <div className="mt-6">
              <AdminLoginForm />
            </div>
          </>
        ) : (
          <p className="mt-2 text-muted">
            Es ist noch kein Admin-Passwort eingerichtet. Setze{" "}
            <code className="rounded bg-surface-2 px-1.5 py-0.5 text-sm text-ink">ADMIN_PASSWORD</code>{" "}
            in der <code className="rounded bg-surface-2 px-1.5 py-0.5 text-sm text-ink">.env</code>
            -Datei und starte die App neu.
          </p>
        )}
      </div>
    </div>
  );
}
