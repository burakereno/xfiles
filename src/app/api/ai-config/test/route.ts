import { NextResponse } from "next/server";
import { generateText } from "@/lib/ai";

/**
 * POST /api/ai-config/test — Test the active AI config with a simple prompt
 */
export async function POST() {
    try {
        const response = await generateText("Merhaba! Lütfen 'AI bağlantısı başarılı' cümlesini içeren kısa bir test yanıtı ver.");

        return NextResponse.json({
            success: true,
            response: response.trim(),
        });
    } catch (error) {
        console.error("AI config test failed:", error);
        return NextResponse.json(
            {
                error: error instanceof Error
                    ? `Test başarısız: ${error.message}`
                    : "AI bağlantı testi başarısız oldu.",
            },
            { status: 500 }
        );
    }
}
