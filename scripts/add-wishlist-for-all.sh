#!/bin/sh
# Gives every family member a wishlist with this title, visible only to their
# Wichtel ("Nur mein Wichtel"). Whoever already has a list with that title is
# skipped, so running it twice does no harm. Run it on the server, next to
# docker-compose.yml, while the app is running:
#
#   sh scripts/add-wishlist-for-all.sh                     # "Weihnachten 2026"
#   sh scripts/add-wishlist-for-all.sh "Weihnachten 2027"
set -eu
cd "$(dirname "$0")/.."

TITLE="${1:-Weihnachten 2026}"

# Runs inside the app container, which has the database and better-sqlite3.
docker compose exec -T -e TITLE="$TITLE" app node -e '
const Database = require("better-sqlite3");
const db = new Database(process.env.DATABASE_URL.replace(/^file:/, ""));
const title = process.env.TITLE;
// The same format Prisma writes.
const now = new Date().toISOString().replace("Z", "+00:00");

const people = db.prepare(`SELECT "id", "name" FROM "User" ORDER BY "name"`).all();
const hasList = db.prepare(`SELECT 1 FROM "Wishlist" WHERE "ownerId" = ? AND "title" = ?`);
const addList = db.prepare(
  `INSERT INTO "Wishlist" ("title", "ownerId", "wichtelOnly", "createdAt", "updatedAt")
   VALUES (?, ?, 1, ?, ?)`,
);

let added = 0;
db.transaction(() => {
  for (const person of people) {
    if (hasList.get(person.id, title)) {
      console.log(`  ${person.name}: already has "${title}"`);
    } else {
      addList.run(title, person.id, now, now);
      console.log(`+ ${person.name}: "${title}" added`);
      added++;
    }
  }
})();
console.log(`${added} of ${people.length} lists added.`);
'
