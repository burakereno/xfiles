-- AlterTable
ALTER TABLE "NewsItem" ADD COLUMN "category" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_NewsSource" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'genel',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_NewsSource" ("createdAt", "id", "isActive", "name", "url") SELECT "createdAt", "id", "isActive", "name", "url" FROM "NewsSource";
DROP TABLE "NewsSource";
ALTER TABLE "new_NewsSource" RENAME TO "NewsSource";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
