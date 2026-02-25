import { NextResponse, NextRequest } from "next/server";
import { TwitterApi } from "twitter-api-v2";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

// GET /api/x/callback — Handle OAuth 2.0 callback
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    // Handle user denial or errors
    if (error) {
        return NextResponse.redirect(
            new URL("/settings?error=oauth_denied", request.url)
        );
    }

    if (!code || !state) {
        return NextResponse.redirect(
            new URL("/settings?error=missing_params", request.url)
        );
    }

    // Retrieve stored state and code verifier from cookies
    const cookieStore = await cookies();
    const storedState = cookieStore.get("x_oauth_state")?.value;
    const codeVerifier = cookieStore.get("x_oauth_code_verifier")?.value;

    console.log("[X OAuth Callback] Incoming state:", state);
    console.log("[X OAuth Callback] Stored state from cookie:", storedState || "MISSING");
    console.log("[X OAuth Callback] Code verifier from cookie:", codeVerifier ? "PRESENT" : "MISSING");
    console.log("[X OAuth Callback] All cookies:", cookieStore.getAll().map(c => c.name));

    // Clear OAuth cookies
    cookieStore.delete("x_oauth_state");
    cookieStore.delete("x_oauth_code_verifier");

    if (!storedState || !codeVerifier || state !== storedState) {
        console.error("[X OAuth Callback] State mismatch!", {
            hasStoredState: !!storedState,
            hasCodeVerifier: !!codeVerifier,
            stateMatch: state === storedState,
        });
        return NextResponse.redirect(
            new URL("/settings?error=state_mismatch", request.url)
        );
    }

    const clientId = process.env.X_CLIENT_ID!;
    const clientSecret = process.env.X_CLIENT_SECRET!;
    const callbackUrl =
        process.env.X_CALLBACK_URL || "http://localhost:3001/api/x/callback";

    try {
        const client = new TwitterApi({
            clientId,
            clientSecret,
        });

        console.log("[X OAuth] Exchanging code for tokens...");
        console.log("[X OAuth] callbackUrl:", callbackUrl);

        // Exchange authorization code for tokens
        const {
            accessToken,
            refreshToken,
            expiresIn,
        } = await client.loginWithOAuth2({
            code,
            codeVerifier,
            redirectUri: callbackUrl,
        });

        console.log("[X OAuth] Token exchange successful");
        console.log("[X OAuth] Has refreshToken:", !!refreshToken);
        console.log("[X OAuth] expiresIn:", expiresIn);

        // Use the access token to get user info
        const loggedClient = new TwitterApi(accessToken);
        const { data: me } = await loggedClient.v2.me({
            "user.fields": ["profile_image_url", "name", "username"],
        });

        console.log("[X OAuth] User info:", me.username, me.name, me.id);

        // Calculate token expiry
        const tokenExpiresAt = expiresIn
            ? new Date(Date.now() + expiresIn * 1000)
            : null;

        // Check if this is the first account (make it default)
        const existingCount = await prisma.xAccount.count();

        // Upsert the account
        await prisma.xAccount.upsert({
            where: { xUserId: me.id },
            create: {
                xUserId: me.id,
                username: me.username,
                displayName: me.name,
                profileImage: me.profile_image_url || null,
                accessToken,
                refreshToken: refreshToken || "",
                tokenExpiresAt,
                scopes: "tweet.read tweet.write users.read offline.access",
                isDefault: existingCount === 0,
            },
            update: {
                username: me.username,
                displayName: me.name,
                profileImage: me.profile_image_url || null,
                accessToken,
                refreshToken: refreshToken || undefined,
                tokenExpiresAt,
                scopes: "tweet.read tweet.write users.read offline.access",
            },
        });

        console.log("[X OAuth] Account saved successfully for @" + me.username);

        return NextResponse.redirect(
            new URL("/settings?success=connected", request.url)
        );
    } catch (err) {
        console.error("[X OAuth] Callback error:", err);
        const errorMessage = err instanceof Error ? err.message : "unknown";
        return NextResponse.redirect(
            new URL(`/settings?error=token_exchange_failed&detail=${encodeURIComponent(errorMessage)}`, request.url)
        );
    }
}
