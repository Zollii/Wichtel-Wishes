-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "sessionTokenHash" TEXT,
    "claimedAt" DATETIME,
    "drawnUserId" INTEGER,
    "drawnAt" DATETIME,
    CONSTRAINT "User_drawnUserId_fkey" FOREIGN KEY ("drawnUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_User" ("createdAt", "id", "name", "updatedAt") SELECT "createdAt", "id", "name", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_name_key" ON "User"("name");
CREATE UNIQUE INDEX "User_sessionTokenHash_key" ON "User"("sessionTokenHash");
CREATE UNIQUE INDEX "User_drawnUserId_key" ON "User"("drawnUserId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
