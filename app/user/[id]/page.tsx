import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GiftIcon } from "@heroicons/react/24/outline";
import { Avatar } from "@/components/Avatar";
import { EmptyState } from "@/components/EmptyState";
import { SectionHeading } from "@/components/SectionHeading";
import { DrawPicker, DrawReveal } from "@/components/Wichtel";
import { OwnWishlistCard, WishlistTeaser } from "@/components/WishlistCards";
import { CreateWishlistButton } from "@/components/WishlistDialogs";
import { getDraw, getOtherPeople, getPerson, getVisibleWishlists } from "@/lib/data";
import { formatDate, parseId, plural, possessive } from "@/lib/format";
import { getCurrentPerson, getViewer } from "@/lib/session";

type Props = { params: Promise<{ id: string }> };
type Person = NonNullable<Awaited<ReturnType<typeof getPerson>>>;
type Wishlists = Awaited<ReturnType<typeof getVisibleWishlists>>;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const id = parseId((await params).id);
  const [person, current] = await Promise.all([id ? getPerson(id) : null, getCurrentPerson()]);
  if (!person) return { title: "Nicht gefunden" };
  return { title: current?.id === person.id ? "Mein Bereich" : `${possessive(person.name)} Wunschlisten` };
}

export default async function PersonPage({ params }: Props) {
  const id = parseId((await params).id);
  if (!id) notFound();

  const [person, viewer] = await Promise.all([getPerson(id), getViewer()]);
  if (!person) notFound();

  const wishlists = await getVisibleWishlists(person.id, viewer);
  return viewer?.id === person.id ? (
    <Dashboard person={person} wishlists={wishlists} />
  ) : (
    <Profile person={person} wishlists={wishlists} />
  );
}

/** The current person's own page: the draw and their own lists. */
function Dashboard({ person, wishlists }: { person: Person; wishlists: Wishlists }) {
  const hasLists = wishlists.length > 0;

  return (
    <div className="space-y-16">
      <header className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-5">
          <Avatar name={person.name} size="xl" />
          <div className="min-w-0">
            <p className="eyebrow">Dein Bereich</p>
            <h1 className="mt-1 font-display text-4xl font-semibold tracking-tight wrap-break-word sm:text-5xl">
              Hallo, {person.name}!
            </h1>
          </div>
        </div>
        {hasLists && <CreateWishlistButton />}
      </header>

      <WichtelCard personId={person.id} />

      <section aria-labelledby="own-lists">
        <SectionHeading
          id="own-lists"
          title="Meine Wunschlisten"
          meta={hasLists ? plural(wishlists.length, "Liste", "Listen") : undefined}
        />
        {hasLists ? (
          <div className="grid gap-5 md:grid-cols-2">
            {wishlists.map((wishlist) => (
              <OwnWishlistCard key={wishlist.id} wishlist={wishlist} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={GiftIcon}
            title="Noch keine Wunschliste"
            action={<CreateWishlistButton label="Erste Liste erstellen" />}>
            Erstelle deine erste Liste und schreib auf, worüber du dich freuen würdest.
          </EmptyState>
        )}
      </section>
    </div>
  );
}

/** Secret Santa: enter whom you drew, or reveal it. Only ever rendered for yourself. */
async function WichtelCard({ personId }: { personId: number }) {
  const [draw, others] = await Promise.all([getDraw(personId), getOtherPeople(personId)]);

  return (
    <section
      aria-labelledby="wichtel"
      className="relative overflow-hidden rounded-3xl bg-pine p-6 text-on-pine shadow-lg sm:p-8">
      <GiftIcon
        aria-hidden
        className="pointer-events-none absolute -right-8 -bottom-10 size-56 opacity-10"
      />
      <div className="relative">
        <p className="text-xs font-semibold tracking-[0.18em] uppercase opacity-75">
          Wichteln · nur für dich sichtbar
        </p>
        {draw ? (
          <>
            <h2 id="wichtel" className="mt-2 font-display text-3xl font-semibold">
              Du bist Wichtel für …
            </h2>
            <div className="mt-6">
              <DrawReveal
                person={{
                  id: draw.id,
                  name: draw.name,
                  wishlistCount: draw.wishlists.length,
                  // A single list opens directly, several via the person's page.
                  wishlistHref:
                    draw.wishlists.length === 1
                      ? `/wishlist/${draw.wishlists[0].id}`
                      : `/user/${draw.id}`,
                }}
              />
            </div>
            <p className="mt-6 text-sm opacity-75">
              {draw.drawnAt && <>Eingetragen am {formatDate(draw.drawnAt)}. </>}
              Ändern kann das nur der Admin.
            </p>
          </>
        ) : (
          <>
            <h2 id="wichtel" className="mt-2 font-display text-3xl font-semibold">
              Wen hast du gezogen?
            </h2>
            {others.length === 0 ? (
              <p className="mt-2 opacity-80">Es gibt noch keine anderen Familienmitglieder.</p>
            ) : (
              <>
                <p className="mt-2 mb-6 max-w-xl opacity-80">
                  Wähle die Person, deren Namen du gezogen hast. Niemand außer dir sieht das –
                  und festlegen kannst du es nur einmal.
                </p>
                <DrawPicker people={others} />
              </>
            )}
          </>
        )}
      </div>
    </section>
  );
}

/** Somebody else's page: the wishlists the viewer may see, read-only. */
function Profile({ person, wishlists }: { person: Person; wishlists: Wishlists }) {
  return (
    <div className="space-y-12">
      <header className="flex items-center gap-5">
        <Avatar name={person.name} size="xl" />
        <div className="min-w-0">
          <p className="eyebrow">Familienmitglied</p>
          <h1 className="mt-1 font-display text-4xl font-semibold tracking-tight wrap-break-word sm:text-5xl">
            {possessive(person.name)} Wunschlisten
          </h1>
        </div>
      </header>

      {wishlists.length === 0 ? (
        <EmptyState icon={GiftIcon} title="Keine Wunschlisten zu sehen">
          Listen, die nur für den Wichtel gedacht sind, sieht auch nur der Wichtel.
        </EmptyState>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {wishlists.map((wishlist) => (
            <WishlistTeaser
              key={wishlist.id}
              wishlist={{ ...wishlist, _count: { items: wishlist.items.length } }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
