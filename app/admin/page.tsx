import type { Metadata } from "next";
import clsx from "clsx";
import {
  ArrowRightStartOnRectangleIcon,
  DevicePhoneMobileIcon,
  KeyIcon,
  LockClosedIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import {
  AddPersonButton,
  PersonAdminActions,
  PinRequests,
  ResetAllDrawsButton,
  VisibilityToggle,
} from "@/components/AdminControls";
import { Avatar } from "@/components/Avatar";
import { EmptyState } from "@/components/EmptyState";
import { SectionHeading } from "@/components/SectionHeading";
import { Stat } from "@/components/Stat";
import { button } from "@/components/ui";
import { requireAdmin } from "@/lib/admin";
import { adminLogout } from "@/lib/admin-actions";
import { getAdminOverview } from "@/lib/data";
import { formatDate, plural } from "@/lib/format";

export const metadata: Metadata = { title: "Admin" };

export default async function AdminPage() {
  await requireAdmin();
  const { people, drawnCount, pinRequests } = await getAdminOverview();
  const pinCount = people.filter((person) => person.pinSetAt).length;

  return (
    <div className="space-y-12">
      <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Verwaltung</p>
          <h1 className="mt-1 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            Admin-Bereich
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <AddPersonButton />
          <form action={adminLogout}>
            <button type="submit" className={button("secondary")}>
              <ArrowRightStartOnRectangleIcon className="size-5" />
              Abmelden
            </button>
          </form>
        </div>
      </header>

      <PinRequests
        requests={pinRequests.map((request) => ({
          id: request.id,
          name: request.name,
          requestedAt: formatDate(request.requestedAt, "short"),
        }))}
      />

      <dl className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-3">
        <Stat label="Familienmitglieder" value={people.length} />
        <Stat label="PIN eingerichtet" value={`${pinCount} / ${people.length}`} />
        <Stat label="Ziehung eingetragen" value={`${drawnCount} / ${people.length}`} />
      </dl>

      <section aria-labelledby="people">
        <SectionHeading id="people" title="Familienmitglieder" />
        {people.length === 0 ? (
          <EmptyState icon={UserGroupIcon} title="Noch niemand da" action={<AddPersonButton />}>
            Lege alle an, die beim Wichteln mitmachen. Jede Person richtet ihr Profil danach
            selbst auf der Startseite ein.
          </EmptyState>
        ) : (
          <ul className="card divide-y divide-line">
            {people.map((person) => (
              <li key={person.id} className="p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex min-w-0 items-center gap-4">
                    <Avatar name={person.name} size="md" ring={false} />
                    <div className="min-w-0">
                      <p className="font-display text-xl font-semibold wrap-break-word">{person.name}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                        <Badge active={Boolean(person.pinSetAt)} icon={KeyIcon}>
                          {person.pinSetAt
                            ? `PIN seit ${formatDate(person.pinSetAt, "short")}`
                            : "Noch keine PIN"}
                        </Badge>
                        <Badge active={person._count.sessions > 0} icon={DevicePhoneMobileIcon}>
                          {person._count.sessions > 0
                            ? `Auf ${plural(person._count.sessions, "Gerät", "Geräten")} angemeldet`
                            : "Nirgends angemeldet"}
                        </Badge>
                        <span className="text-muted">
                          {plural(person.wishlists.length, "Wunschliste", "Wunschlisten")}
                        </span>
                      </div>
                    </div>
                  </div>
                  <PersonAdminActions
                    person={{
                      id: person.id,
                      name: person.name,
                      hasPin: Boolean(person.pinSetAt),
                      devices: person._count.sessions,
                    }}
                  />
                </div>

                {person.wishlists.length > 0 && (
                  <ul className="mt-4 space-y-2 sm:ml-15">
                    {person.wishlists.map((wishlist) => (
                      <li
                        key={wishlist.id}
                        className="flex flex-col gap-2 rounded-2xl bg-surface-2/70 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between">
                        <span className="min-w-0 truncate text-sm font-medium">{wishlist.title}</span>
                        <VisibilityToggle wishlist={wishlist} />
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="new-round" className="card p-6 sm:p-8">
        <h2 id="new-round" className="font-display text-2xl font-semibold">
          Neue Runde
        </h2>
        <p className="mt-2 max-w-2xl text-muted">
          Für das nächste Wichteln: setzt alle eingetragenen Ziehungen zurück. Profile, PINs und
          Wunschlisten bleiben erhalten.
        </p>
        <div className="mt-5">
          <ResetAllDrawsButton disabled={drawnCount === 0} />
        </div>
      </section>

      <p className="flex items-start gap-2 text-sm text-muted">
        <LockClosedIcon className="mt-0.5 size-4 shrink-0" />
        Wer wen gezogen hat, wird nirgends angezeigt – auch nicht hier. Du siehst nur, wie viele
        schon eingetragen haben, nicht wer.
      </p>
    </div>
  );
}

function Badge({
  active,
  icon: Icon,
  children,
}: {
  active: boolean;
  icon: typeof KeyIcon;
  children: React.ReactNode;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium",
        active ? "bg-pine-soft text-pine" : "bg-surface-2 text-muted",
      )}>
      <Icon className="size-3.5" />
      {children}
    </span>
  );
}
