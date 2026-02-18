import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Default Turkish news sources with categories
const DEFAULT_SOURCES = [
    // Teknoloji
    { name: "NTV", url: "https://www.ntv.com.tr/teknoloji.rss", category: "teknoloji", isActive: true },
    { name: "Webtekno", url: "https://www.webtekno.com/rss.xml", category: "teknoloji", isActive: true },
    { name: "T24", url: "https://t24.com.tr/rss/haber/bilim-teknoloji", category: "teknoloji", isActive: true },
    { name: "Cumhuriyet", url: "https://www.cumhuriyet.com.tr/rss/teknoloji", category: "teknoloji", isActive: true },
    // Siyaset
    { name: "T24", url: "https://t24.com.tr/rss/haber/politika", category: "siyaset", isActive: true },
    { name: "NTV", url: "https://www.ntv.com.tr/turkiye.rss", category: "siyaset", isActive: true },
    { name: "Cumhuriyet", url: "https://www.cumhuriyet.com.tr/rss/siyaset", category: "siyaset", isActive: true },
    // Ekonomi
    { name: "NTV", url: "https://www.ntv.com.tr/ekonomi.rss", category: "ekonomi", isActive: true },
    { name: "T24", url: "https://t24.com.tr/rss/haber/ekonomi", category: "ekonomi", isActive: true },
    { name: "Cumhuriyet", url: "https://www.cumhuriyet.com.tr/rss/ekonomi", category: "ekonomi", isActive: true },
    // Dünya
    { name: "NTV", url: "https://www.ntv.com.tr/dunya.rss", category: "dünya", isActive: true },
    { name: "T24", url: "https://t24.com.tr/rss/haber/dunya", category: "dünya", isActive: true },
    { name: "BBC Türkçe", url: "https://feeds.bbci.co.uk/turkce/rss.xml", category: "dünya", isActive: true },
    { name: "Euronews Türkçe", url: "https://tr.euronews.com/rss", category: "dünya", isActive: true },
    { name: "Cumhuriyet", url: "https://www.cumhuriyet.com.tr/rss/dunya", category: "dünya", isActive: true },
    // Spor
    { name: "NTV", url: "https://www.ntv.com.tr/spor.rss", category: "spor", isActive: true },
    { name: "T24", url: "https://t24.com.tr/rss/haber/spor", category: "spor", isActive: true },
    { name: "Cumhuriyet", url: "https://www.cumhuriyet.com.tr/rss/spor", category: "spor", isActive: true },
    // Yaşam
    { name: "NTV", url: "https://www.ntv.com.tr/yasam.rss", category: "yaşam", isActive: true },
    { name: "T24", url: "https://t24.com.tr/rss/haber/yasam", category: "yaşam", isActive: true },
    { name: "Cumhuriyet", url: "https://www.cumhuriyet.com.tr/rss/yasam", category: "yaşam", isActive: true },
];

export async function GET() {
    try {
        // Get sources with news count
        let sources = await prisma.newsSource.findMany({
            include: {
                _count: {
                    select: { news: true },
                },
            },
        });

        // If no sources exist, create defaults
        if (sources.length === 0) {
            await prisma.newsSource.createMany({
                data: DEFAULT_SOURCES,
            });
            sources = await prisma.newsSource.findMany({
                include: {
                    _count: {
                        select: { news: true },
                    },
                },
            });
        }

        return NextResponse.json({
            sources: sources.map((s) => ({
                id: s.id,
                name: s.name,
                url: s.url,
                category: s.category,
                isActive: s.isActive,
                newsCount: s._count.news,
            })),
        });
    } catch (error) {
        console.error("Failed to get sources:", error);
        return NextResponse.json({ error: "Failed to get sources" }, { status: 500 });
    }
}
