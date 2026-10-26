import Link from "next/link";
import { redirect } from "next/navigation";
import { KeyIcon, UserGroupIcon } from "@heroicons/react/24/outline";
import { Avatar } from "@/components/Avatar";
import { EmptyState } from "@/components/EmptyState";
import { ChoosePinForm, SignOutButton } from "@/components/PinForms";
import { SignInTile } from "@/components/SignInTile";
import { button } from "@/components/ui";
import { getPeople } from "@/lib/data";
import { plural } from "@/lib/format";
import { PIN_LENGTH } from "@/lib/forms";
import { getSignedInPerson } from "@/lib/session";

export default async function HomePage() {
  // A signed-in device goes straight to its profile – once it has its own PIN.
  const signedIn = await getSignedInPerson();
  if (signedIn?.pin === "own") redirect(`/user/${signedIn.id}`);
  if (signedIn) return <ChoosePin name={signedIn.name} fromAdmin={signedIn.pin === "temporary"} />;

  const people = await getPeople();

  return (
    <div className="space-y-14">
      <section className="text-center">
        <div aria-hidden className="garland mx-auto mb-8 max-w-md" />
        <p className="eyebrow">Familien-Wichteln</p>
        <h1 className="mt-3 font-display text-5xl font-semibold tracking-tight sm:text-7xl">
          Wer bist du?
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-pretty text-muted">
          Wähle dein Profil und melde dich mit deiner PIN an – auf jedem Gerät, das du nutzt.
          Beim ersten Mal legst du die PIN selbst fest.
        </p>
      </section>

      {people.length === 0 ? (
        <EmptyState
          icon={UserGroupIcon}
          title="Noch niemand da"
          action={
            <Link href="/admin" className={button("primary")}>
              Zum Admin-Bereich
            </Link>
          }>
          Die Familienmitglieder werden im Admin-Bereich angelegt.
        </EmptyState>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
          {people.map((person) => (
            <li key={person.id}>
              <SignInTile person={person}>
                <Avatar name={person.name} size="xl" className="transition group-hover:scale-105" />
                <span className="mt-4 max-w-full font-display text-xl font-semibold wrap-break-word">
                  {person.name}
                </span>
                <span className="mt-1 text-sm text-muted">
                  {person.signIn === "free"
                    ? "Noch nicht eingerichtet"
                    : plural(person.wishlistCount, "Wunschliste", "Wunschlisten")}
                </span>
                {person.wishlists[0] && (
                  <span className="mt-auto block max-w-full pt-4">
                    <span className="block truncate rounded-full bg-gold-soft px-3 py-1 text-xs font-medium text-gold">
                      Neu: {person.wishlists[0].title}
                    </span>
                  </span>
                )}
              </SignInTile>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Before anything else, people choose a PIN that only they know. */
function ChoosePin({ name, fromAdmin }: { name: string; fromAdmin: boolean }) {
  return (
    <div className="mx-auto max-w-md">
      <div className="card p-6 sm:p-8">
        <span className="grid size-12 place-items-center rounded-2xl bg-gold-soft text-gold">
          <KeyIcon className="size-6" />
        </span>
        <h1 className="mt-5 font-display text-3xl font-semibold tracking-tight wrap-break-word">
          Deine PIN, {name}
        </h1>
        <p className="mt-2 text-muted">
          {fromAdmin
            ? "Du hast dich mit der PIN vom Admin angemeldet. Wähle jetzt deine eigene – die kennst dann nur du."
            : `Ab jetzt meldest du dich mit einer ${PIN_LENGTH}-stelligen PIN an. So kannst du die App auf all deinen Geräten nutzen.`}
        </p>
        <div className="mt-6">
          <ChoosePinForm />
        </div>
        <div className="mt-5 flex justify-center">
          <SignOutButton
            label={`Nicht ${name}? Abmelden`}
            className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium text-muted transition hover:text-ink"
          />
        </div>
      </div>
    </div>
  );
}
