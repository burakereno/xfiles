-- CreateTable
CREATE TABLE "NewsSource" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'genel',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NewsSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsItem" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "link" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "category" TEXT,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "sourceId" TEXT NOT NULL,
    "isSelected" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NewsItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsDigest" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3),
    "postedAt" TIMESTAMP(3),
    "tweetUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NewsDigest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "XAccount" (
    "id" TEXT NOT NULL,
    "xUserId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "profileImage" TEXT,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "tokenExpiresAt" TIMESTAMP(3),
    "scopes" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "XAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutopilotConfig" (
    "id" TEXT NOT NULL,
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
    "lastPostAt" TIMESTAMP(3),
    "todayPostCount" INTEGER NOT NULL DEFAULT 0,
    "lastResetDate" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutopilotConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutopilotLog" (
    "id" TEXT NOT NULL,
    "configId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "tweetUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AutopilotLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiConfig" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "XAccount_xUserId_key" ON "XAccount"("xUserId");

-- AddForeignKey
ALTER TABLE "NewsItem" ADD CONSTRAINT "NewsItem_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "NewsSource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutopilotConfig" ADD CONSTRAINT "AutopilotConfig_xAccountId_fkey" FOREIGN KEY ("xAccountId") REFERENCES "XAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
