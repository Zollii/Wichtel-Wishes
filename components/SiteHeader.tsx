import Link from "next/link";
import { GiftIcon } from "@heroicons/react/24/outline";
import { getCurrentPerson } from "@/lib/session";
import { UserMenu } from "./UserMenu";

export async function SiteHeader() {
  const person = await getCurrentPerson();

  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-paper/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-pine">
          <span className="grid size-9 place-items-center rounded-xl bg-pine text-on-pine shadow-sm">
            <GiftIcon className="size-5" />
          </span>
          <span className="font-display text-xl font-semibold tracking-tight">
            Zollhaus <span className="text-berry">Wichtel</span>
          </span>
        </Link>

        {person && <UserMenu person={person} />}
      </div>
    </header>
  );
}
