import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();

        const updated = await prisma.newsItem.update({
            where: { id },
            data: {
                isSelected: body.isSelected,
            },
        });

        return NextResponse.json({ success: true, item: updated });
    } catch (error) {
        console.error("Failed to update news item:", error);
        return NextResponse.json({ error: "Failed to update news item" }, { status: 500 });
    }
}
