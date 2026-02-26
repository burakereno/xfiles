import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";

// GET: Retrieve autopilot configs
// ?xAccountId=xxx — get config for specific account
// no params — get all configs with account info
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const xAccountId = searchParams.get("xAccountId");

        if (xAccountId) {
            // Get config for a specific X account
            const config = await prisma.autopilotConfig.findFirst({
                where: { xAccountId },
                include: {
                    xAccount: {
                        select: {
                            id: true,
                            username: true,
                            displayName: true,
                            profileImage: true,
                        },
                    },
                },
            });
            return NextResponse.json({ config });
        }

        // Get all configs with account info
        const configs = await prisma.autopilotConfig.findMany({
            include: {
                xAccount: {
                    select: {
                        id: true,
                        username: true,
                        displayName: true,
                        profileImage: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json({ configs });
    } catch (error) {
        console.error("Failed to get autopilot config:", error);
        return NextResponse.json(
            { error: "Failed to get config" },
            { status: 500 }
        );
    }
}

// POST: Create or update autopilot config (upsert by xAccountId)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            id,
            name,
            categories,
            selectedSources,
            format,
            tone,
            tweetCount,
            charLimit,
            tweetsPerDay,
            timezone,
            preferredHours,
            ctaEnabled,
            ctaText,
            xAccountId,
            isActive,
            hashtagCount,
            customPrompt,
            paused,
        } = body;

        if (!xAccountId) {
            return NextResponse.json(
                { error: "xAccountId is required" },
                { status: 400 }
            );
        }

        // Fast path: isActive/paused-only update (Stop/Resume buttons)
        if (id && (isActive !== undefined || paused !== undefined) && !categories) {
            const config = await prisma.autopilotConfig.update({
                where: { id },
                data: {
                    ...(isActive !== undefined ? { isActive } : {}),
                    ...(paused !== undefined ? { paused } : {}),
                },
                include: {
                    xAccount: {
                        select: { id: true, username: true, displayName: true, profileImage: true },
                    },
                },
            });
            return NextResponse.json({ config });
        }

        if (!categories) {
            return NextResponse.json(
                { error: "Categories are required" },
                { status: 400 }
            );
        }

        // Phoenix Algorithm: enforce max 2 tweets per day
        const safeTweetsPerDay = Math.min(Math.max(tweetsPerDay || 2, 1), 2);

        // Phoenix Algorithm: enforce thread tweet count 5-7 optimal
        const safeTweetCount = Math.min(Math.max(tweetCount || 5, 3), 10);

        const data = {
            name: name || "My Autopilot",
            categories,
            selectedSources: selectedSources || null,
            format: format || "thread",
            tone: tone || "professional",
            tweetCount: safeTweetCount,
            charLimit: charLimit || 260,
            tweetsPerDay: safeTweetsPerDay,
            timezone: timezone || "Europe/Istanbul",
            preferredHours: preferredHours || null,
            ctaEnabled: ctaEnabled !== undefined ? ctaEnabled : true,
            ctaText: ctaText || null,
            hashtagCount: Math.min(Math.max(hashtagCount ?? 2, 0), 5),
            customPrompt: customPrompt !== undefined ? (customPrompt || null) : undefined,
            xAccountId,
            ...(isActive !== undefined ? { isActive } : {}),
        };

        if (id) {
            // Update existing config
            const config = await prisma.autopilotConfig.update({
                where: { id },
                data,
                include: {
                    xAccount: {
                        select: {
                            id: true,
                            username: true,
                            displayName: true,
                            profileImage: true,
                        },
                    },
                },
            });
            return NextResponse.json({ config });
        } else {
            // Check if config already exists for this account (1 account = max 1 config)
            const existing = await prisma.autopilotConfig.findFirst({
                where: { xAccountId },
            });

            if (existing) {
                // Update existing instead of creating duplicate
                const config = await prisma.autopilotConfig.update({
                    where: { id: existing.id },
                    data,
                    include: {
                        xAccount: {
                            select: {
                                id: true,
                                username: true,
                                displayName: true,
                                profileImage: true,
                            },
                        },
                    },
                });
                return NextResponse.json({ config });
            }

            // Create new
            const config = await prisma.autopilotConfig.create({
                data,
                include: {
                    xAccount: {
                        select: {
                            id: true,
                            username: true,
                            displayName: true,
                            profileImage: true,
                        },
                    },
                },
            });
            return NextResponse.json({ config });
        }
    } catch (error) {
        console.error("Failed to save autopilot config:", error);
        return NextResponse.json(
            { error: "Failed to save config" },
            { status: 500 }
        );
    }
}
