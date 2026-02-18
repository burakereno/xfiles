import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";

// GET: Retrieve autopilot activity logs
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get("limit") || "20");
        const configId = searchParams.get("configId");

        const where = configId ? { configId } : {};

        const logs = await prisma.autopilotLog.findMany({
            where,
            orderBy: { createdAt: "desc" },
            take: Math.min(limit, 50),
        });

        return NextResponse.json({ logs });
    } catch (error) {
        console.error("Failed to get autopilot logs:", error);
        return NextResponse.json(
            { error: "Failed to get logs" },
            { status: 500 }
        );
    }
}
