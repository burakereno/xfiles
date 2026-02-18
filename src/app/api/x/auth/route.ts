import { NextResponse } from "next/server";
import { TwitterApi } from "twitter-api-v2";
import { cookies } from "next/headers";

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

    // Store codeVerifier and state in cookies for callback verification
    const cookieStore = await cookies();
    cookieStore.set("x_oauth_state", state, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 600, // 10 minutes
        path: "/",
    });
    cookieStore.set("x_oauth_code_verifier", codeVerifier, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 600,
        path: "/",
    });

    return NextResponse.redirect(url);
}
