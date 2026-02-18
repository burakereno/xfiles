import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { PROVIDER_MODELS, PROVIDER_LABELS } from "@/lib/ai-providers";

/**
 * GET /api/ai-config — Return active AI config with masked API key
 */
export async function GET() {
    try {
        const config = await prisma.aiConfig.findFirst({
            where: { isActive: true },
        });

        if (!config) {
            return NextResponse.json({
                config: null,
                providers: Object.entries(PROVIDER_LABELS).map(([id, label]) => ({
                    id,
                    label,
                    models: PROVIDER_MODELS[id] || [],
                })),
            });
        }

        // Mask API key: show first 4 and last 4 chars
        const key = config.apiKey;
        const maskedKey =
            key.length > 8
                ? `${key.substring(0, 4)}${"•".repeat(Math.min(key.length - 8, 20))}${key.substring(key.length - 4)}`
                : "••••••••";

        return NextResponse.json({
            config: {
                id: config.id,
                provider: config.provider,
                providerLabel: PROVIDER_LABELS[config.provider] || config.provider,
                model: config.model,
                apiKey: maskedKey,
                isActive: config.isActive,
                createdAt: config.createdAt.toISOString(),
                updatedAt: config.updatedAt.toISOString(),
            },
            providers: Object.entries(PROVIDER_LABELS).map(([id, label]) => ({
                id,
                label,
                models: PROVIDER_MODELS[id] || [],
            })),
        });
    } catch (error) {
        console.error("Failed to get AI config:", error);
        return NextResponse.json({ error: "Failed to get AI config" }, { status: 500 });
    }
}

/**
 * POST /api/ai-config — Create or update AI config (upsert)
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { provider, apiKey, model } = body;

        if (!provider || !apiKey || !model) {
            return NextResponse.json(
                { error: "provider, apiKey, and model are required" },
                { status: 400 }
            );
        }

        // Validate provider
        if (!PROVIDER_LABELS[provider]) {
            return NextResponse.json(
                { error: `Invalid provider: ${provider}` },
                { status: 400 }
            );
        }

        // Deactivate all existing configs
        await prisma.aiConfig.updateMany({
            data: { isActive: false },
        });

        // Check if config exists for this provider and update, or create new
        const existing = await prisma.aiConfig.findFirst({
            where: { provider },
        });

        let config;
        if (existing) {
            config = await prisma.aiConfig.update({
                where: { id: existing.id },
                data: { apiKey, model, isActive: true },
            });
        } else {
            config = await prisma.aiConfig.create({
                data: { provider, apiKey, model, isActive: true },
            });
        }

        return NextResponse.json({
            success: true,
            config: {
                id: config.id,
                provider: config.provider,
                providerLabel: PROVIDER_LABELS[config.provider] || config.provider,
                model: config.model,
                isActive: config.isActive,
            },
        });
    } catch (error) {
        console.error("Failed to save AI config:", error);
        return NextResponse.json({ error: "Failed to save AI config" }, { status: 500 });
    }
}

/**
 * DELETE /api/ai-config — Remove AI config (fall back to .env)
 */
export async function DELETE() {
    try {
        await prisma.aiConfig.deleteMany({});
        return NextResponse.json({ success: true, message: "AI config removed. Using .env fallback." });
    } catch (error) {
        console.error("Failed to delete AI config:", error);
        return NextResponse.json({ error: "Failed to delete AI config" }, { status: 500 });
    }
}
