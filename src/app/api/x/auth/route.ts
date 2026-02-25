import { NextResponse } from "next/server";
import { TwitterApi } from "twitter-api-v2";
import prisma from "@/lib/prisma";

// GET /api/x/auth — Start OAuth 2.0 PKCE flow
export async function GET() {
    const clientId = process.env.X_CLIENT_ID;
    const clientSecret = process.env.X_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        return NextResponse.json(
            { error: "X_CLIENT_ID and X_CLIENT_SECRET must be set in .env" },
            { status: 503 }
        );
    }

    const client = new TwitterApi({
        clientId,
        clientSecret,
    });

    const callbackUrl =
        process.env.X_CALLBACK_URL || "http://localhost:3001/api/x/callback";

    const { url, codeVerifier, state } = client.generateOAuth2AuthLink(
        callbackUrl,
        {
            scope: [
                "tweet.read",
                "tweet.write",
                "users.read",
                "offline.access",
            ],
        }
    );

    // Store state and codeVerifier in database (not cookies)
    // This survives cross-domain redirects (localhost → production)
    try {
        // Clean up expired states first
        await prisma.oAuthState.deleteMany({
            where: { expiresAt: { lt: new Date() } },
        });

        await prisma.oAuthState.create({
            data: {
                state,
                codeVerifier,
                expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
            },
        });
    } catch (error) {
        console.error("[X OAuth] Failed to store state:", error);
        const detail = error instanceof Error ? error.message : String(error);
        return NextResponse.json(
            { error: "Failed to initiate OAuth flow", detail },
            { status: 500 }
        );
    }

    return NextResponse.redirect(url);
}
