/*
  Warnings:

  - Made the column `xAccountId` on table `AutopilotConfig` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AutopilotConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL DEFAULT 'My Autopilot',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "categories" TEXT NOT NULL,
    "selectedSources" TEXT,
    "format" TEXT NOT NULL DEFAULT 'thread',
    "tone" TEXT NOT NULL DEFAULT 'professional',
    "tweetCount" INTEGER NOT NULL DEFAULT 5,
    "charLimit" INTEGER NOT NULL DEFAULT 260,
    "ctaEnabled" BOOLEAN NOT NULL DEFAULT true,
    "ctaText" TEXT,
    "tweetsPerDay" INTEGER NOT NULL DEFAULT 2,
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Istanbul',
    "preferredHours" TEXT,
    "xAccountId" TEXT NOT NULL,
    "lastPostAt" DATETIME,
    "todayPostCount" INTEGER NOT NULL DEFAULT 0,
    "lastResetDate" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AutopilotConfig_xAccountId_fkey" FOREIGN KEY ("xAccountId") REFERENCES "XAccount" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_AutopilotConfig" ("categories", "charLimit", "createdAt", "ctaEnabled", "ctaText", "format", "id", "isActive", "lastPostAt", "lastResetDate", "name", "preferredHours", "selectedSources", "timezone", "todayPostCount", "tone", "tweetCount", "tweetsPerDay", "updatedAt", "xAccountId") SELECT "categories", "charLimit", "createdAt", "ctaEnabled", "ctaText", "format", "id", "isActive", "lastPostAt", "lastResetDate", "name", "preferredHours", "selectedSources", "timezone", "todayPostCount", "tone", "tweetCount", "tweetsPerDay", "updatedAt", "xAccountId" FROM "AutopilotConfig";
DROP TABLE "AutopilotConfig";
ALTER TABLE "new_AutopilotConfig" RENAME TO "AutopilotConfig";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
