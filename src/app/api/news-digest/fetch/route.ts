import { NextResponse } from "next/server";
import Parser from "rss-parser";
import prisma from "@/lib/prisma";

const parser = new Parser({
    timeout: 10000,
    headers: {
        "User-Agent": "XFiles News Digest Bot/1.0",
    },
    customFields: {
        item: [
            ["media:content", "mediaContent", { keepArray: false }],
            ["media:thumbnail", "mediaThumbnail", { keepArray: false }],
        ],
    },
});

// Extract image URL from various RSS feed formats
function extractImageUrl(item: Record<string, unknown>): string | null {
    // 1. enclosure with image type
    const enclosure = item.enclosure as { url?: string; type?: string } | undefined;
    if (enclosure?.url && enclosure.type?.startsWith("image")) {
        return enclosure.url;
    }

    // 2. media:content
    const mediaContent = item.mediaContent as { $?: { url?: string } } | undefined;
    if (mediaContent?.$?.url) {
        return mediaContent.$.url;
    }

    // 3. media:thumbnail
    const mediaThumbnail = item.mediaThumbnail as { $?: { url?: string } } | undefined;
    if (mediaThumbnail?.$?.url) {
        return mediaThumbnail.$.url;
    }

    // 4. itunes:image
    const itunesImage = item["itunes:image"] as { $?: { href?: string } } | string | undefined;
    if (typeof itunesImage === "object" && itunesImage?.$?.href) {
        return itunesImage.$.href;
    }

    // 5. Try to extract from content HTML (img tag)
    const content = (item.content || item["content:encoded"]) as string | undefined;
    if (content) {
        const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["']/);
        if (imgMatch?.[1]) {
            return imgMatch[1];
        }
    }

    return null;
}

export async function POST() {
    try {
        // Get active sources
        const sources = await prisma.newsSource.findMany({
            where: { isActive: true },
        });

        if (sources.length === 0) {
            return NextResponse.json({ error: "No active sources" }, { status: 400 });
        }

        const results: { source: string; fetched: number; errors?: string }[] = [];

        for (const source of sources) {
            try {
                const feed = await parser.parseURL(source.url);
                const now = new Date();
                const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

                const newsToCreate = [];

                for (const item of feed.items.slice(0, 15)) {
                    // Limit to 15 per source
                    const pubDate = item.pubDate ? new Date(item.pubDate) : now;

                    // Skip if older than 24 hours
                    if (pubDate < yesterday) continue;

                    // Check if already exists
                    const exists = await prisma.newsItem.findFirst({
                        where: { link: item.link || "" },
                    });

                    if (!exists && item.title && item.link) {
                        newsToCreate.push({
                            title: item.title,
                            link: item.link,
                            description: item.contentSnippet || item.content || null,
                            imageUrl: extractImageUrl(item as unknown as Record<string, unknown>),
                            category: source.category,
                            publishedAt: pubDate,
                            sourceId: source.id,
                            isSelected: false,
                        });
                    }
                }

                if (newsToCreate.length > 0) {
                    await prisma.newsItem.createMany({
                        data: newsToCreate,
                    });
                }

                results.push({ source: source.name, fetched: newsToCreate.length });
            } catch (error) {
                console.error(`Failed to fetch from ${source.name}:`, error);
                results.push({
                    source: source.name,
                    fetched: 0,
                    errors: error instanceof Error ? error.message : "Unknown error",
                });
            }
        }

        return NextResponse.json({
            success: true,
            results,
            totalFetched: results.reduce((sum, r) => sum + r.fetched, 0),
        });
    } catch (error) {
        console.error("Failed to fetch news:", error);
        return NextResponse.json({ error: "Failed to fetch news" }, { status: 500 });
    }
}
