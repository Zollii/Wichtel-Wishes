-- CreateTable
CREATE TABLE "Session" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tokenHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Keep devices that already picked their profile signed in. Their owners are
-- asked to set a PIN on the next visit.
INSERT INTO "Session" ("tokenHash", "createdAt", "userId")
SELECT "sessionTokenHash", COALESCE("claimedAt", CURRENT_TIMESTAMP), "id" FROM "User"
WHERE "sessionTokenHash" IS NOT NULL;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "pinHash" TEXT,
    "pinSetAt" DATETIME,
    "pinMustChange" BOOLEAN NOT NULL DEFAULT false,
    "pinFailedAttempts" INTEGER NOT NULL DEFAULT 0,
    "pinLockedUntil" DATETIME,
    "pinResetRequestedAt" DATETIME,
    "drawnUserId" INTEGER,
    "drawnAt" DATETIME,
    CONSTRAINT "User_drawnUserId_fkey" FOREIGN KEY ("drawnUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_User" ("createdAt", "drawnAt", "drawnUserId", "id", "name", "updatedAt") SELECT "createdAt", "drawnAt", "drawnUserId", "id", "name", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_name_key" ON "User"("name");
CREATE UNIQUE INDEX "User_drawnUserId_key" ON "User"("drawnUserId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");
