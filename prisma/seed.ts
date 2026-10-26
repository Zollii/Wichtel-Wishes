// Sample data for local development: `npm run db:seed`
import "dotenv/config";
import { prisma } from "../lib/db";

const family = [
  {
    name: "Anna",
    wishlists: [
      {
        title: "Weihnachten 2026",
        description: "Am liebsten Dinge für gemütliche Winterabende.",
        items: [
          {
            name: "Kuschelige Wollsocken",
            description: "Größe 38–40, gerne in Grün oder Dunkelrot",
          },
          {
            name: "Puzzle mit 1000 Teilen",
            description: "Landschaft oder Kunstmotiv",
            url: "https://example.com/puzzle",
          },
          { name: "Gutschein für die Buchhandlung" },
          {
            name: "Große Teetasse",
            url: "https://example.com/teetasse",
          },
        ],
      },
    ],
  },
  {
    name: "Ben",
    wishlists: [
      {
        title: "Geburtstag",
        description: "Alles rund ums Radfahren und Musik.",
        // Visible to the whole family; all other lists are Wichtel-only (default).
        wichtelOnly: false,
        items: [
          {
            name: "Fahrradlicht-Set",
            description: "USB-aufladbar, mit StVZO-Zulassung",
            url: "https://example.com/fahrradlicht",
          },
          { name: "Gitarrensaiten", description: "Westerngitarre, Stärke .012" },
        ],
      },
      { title: "Weihnachten 2026", items: [] },
    ],
  },
  { name: "Oma Gerti", wishlists: [] },
];

async function main() {
  if ((await prisma.user.count()) > 0) {
    console.log("Die Datenbank enthält bereits Daten – Seed übersprungen.");
    return;
  }

  for (const person of family) {
    await prisma.user.create({
      data: {
        name: person.name,
        wishlists: {
          create: person.wishlists.map(({ items, ...wishlist }) => ({
            ...wishlist,
            items: { create: items },
          })),
        },
      },
    });
  }
  console.log(`${family.length} Familienmitglieder angelegt.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
