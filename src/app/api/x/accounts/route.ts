import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/x/accounts — List all connected X accounts (without tokens)
export async function GET() {
    try {
        const accounts = await prisma.xAccount.findMany({
            select: {
                id: true,
                xUserId: true,
                username: true,
                displayName: true,
                profileImage: true,
                isDefault: true,
                createdAt: true,
            },
            orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
        });

        return NextResponse.json({ accounts });
    } catch (error) {
        console.error("Failed to list accounts:", error);
        return NextResponse.json(
            { error: "Failed to list accounts" },
            { status: 500 }
        );
    }
}

// DELETE /api/x/accounts?id=xxx — Remove a connected account
export async function DELETE(request: NextRequest) {
    const id = request.nextUrl.searchParams.get("id");

    if (!id) {
        return NextResponse.json(
            { error: "Account ID required" },
            { status: 400 }
        );
    }

    try {
        const account = await prisma.xAccount.findUnique({ where: { id } });
        if (!account) {
            return NextResponse.json(
                { error: "Account not found" },
                { status: 404 }
            );
        }

        await prisma.xAccount.delete({ where: { id } });

        // If deleted account was default, make the next one default
        if (account.isDefault) {
            const nextAccount = await prisma.xAccount.findFirst({
                orderBy: { createdAt: "asc" },
            });
            if (nextAccount) {
                await prisma.xAccount.update({
                    where: { id: nextAccount.id },
                    data: { isDefault: true },
                });
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to delete account:", error);
        return NextResponse.json(
            { error: "Failed to delete account" },
            { status: 500 }
        );
    }
}

// PATCH /api/x/accounts — Set an account as default
export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, isDefault } = body;

        if (!id || !isDefault) {
            return NextResponse.json(
                { error: "Account ID and isDefault required" },
                { status: 400 }
            );
        }

        // Remove default from all accounts, then set the new one
        await prisma.xAccount.updateMany({
            data: { isDefault: false },
        });

        await prisma.xAccount.update({
            where: { id },
            data: { isDefault: true },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to update default:", error);
        return NextResponse.json(
            { error: "Failed to update default account" },
            { status: 500 }
        );
    }
}
