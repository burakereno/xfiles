import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        // Get today's news, ordered by publish date
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const news = await prisma.newsItem.findMany({
            where: {
                createdAt: {
                    gte: today,
                },
            },
            include: {
                source: {
                    select: { name: true, category: true },
                },
            },
            orderBy: {
                publishedAt: "desc",
            },
        });

        return NextResponse.json({
            news: news.map((n) => ({
                id: n.id,
                title: n.title,
                link: n.link,
                description: n.description,
                imageUrl: n.imageUrl,
                category: n.category,
                publishedAt: n.publishedAt.toISOString(),
                sourceId: n.sourceId,
                sourceName: n.source.name,
                isSelected: n.isSelected,
            })),
        });
    } catch (error) {
        console.error("Failed to get news:", error);
        return NextResponse.json({ error: "Failed to get news" }, { status: 500 });
    }
}
