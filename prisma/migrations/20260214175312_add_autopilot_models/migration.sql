-- CreateTable
CREATE TABLE "AutopilotConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL DEFAULT 'My Autopilot',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "categories" TEXT NOT NULL,
    "format" TEXT NOT NULL DEFAULT 'thread',
    "tone" TEXT NOT NULL DEFAULT 'professional',
    "tweetCount" INTEGER NOT NULL DEFAULT 5,
    "charLimit" INTEGER NOT NULL DEFAULT 260,
    "tweetsPerDay" INTEGER NOT NULL DEFAULT 2,
    "xAccountId" TEXT,
    "lastPostAt" DATETIME,
    "todayPostCount" INTEGER NOT NULL DEFAULT 0,
    "lastResetDate" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AutopilotLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "configId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "tweetUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
