import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function DELETE() {
    try {
        // Delete all digests first (foreign key dependency)
        await prisma.newsDigest.deleteMany({});
        // Delete all news items
        await prisma.newsItem.deleteMany({});
        // Delete all sources so fresh defaults are created on next load
        const deleted = await prisma.newsSource.deleteMany({});

        return NextResponse.json({
            success: true,
            deletedCount: deleted.count,
        });
    } catch (error) {
        console.error("Failed to reset news:", error);
        return NextResponse.json({ error: "Failed to reset news" }, { status: 500 });
    }
}
