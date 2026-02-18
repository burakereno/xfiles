import { NextResponse, NextRequest } from "next/server";
import { TwitterApi } from "twitter-api-v2";
import prisma from "@/lib/prisma";

// Get an authenticated X client for a specific account
async function getXClientForAccount(accountId?: string) {
    // Find account: by ID or get default
    const account = accountId
        ? await prisma.xAccount.findUnique({ where: { id: accountId } })
        : await prisma.xAccount.findFirst({ where: { isDefault: true } });

    if (!account) {
        // Fallback to environment variables (legacy OAuth 1.0a)
        const apiKey = process.env.X_API_KEY;
        const apiSecret = process.env.X_API_SECRET;
        const accessToken = process.env.X_ACCESS_TOKEN;
        const accessSecret = process.env.X_ACCESS_TOKEN_SECRET;

        if (apiKey && apiSecret && accessToken && accessSecret) {
            return {
                client: new TwitterApi({
                    appKey: apiKey,
                    appSecret: apiSecret,
                    accessToken,
                    accessSecret,
                }),
                isOAuth2: false,
                accountId: null,
            };
        }
        return null;
    }

    // Check if token needs refresh
    let { accessToken, refreshToken } = account;

    if (
        account.tokenExpiresAt &&
        account.tokenExpiresAt.getTime() < Date.now() + 60000 // refresh if expires within 1 minute
    ) {
        try {
            const clientId = process.env.X_CLIENT_ID!;
            const clientSecret = process.env.X_CLIENT_SECRET!;

            const refreshClient = new TwitterApi({
                clientId,
                clientSecret,
            });

            const {
                accessToken: newAccessToken,
                refreshToken: newRefreshToken,
                expiresIn,
            } = await refreshClient.refreshOAuth2Token(refreshToken);

            accessToken = newAccessToken;
            if (newRefreshToken) {
                refreshToken = newRefreshToken;
            }

            // Update tokens in database
            await prisma.xAccount.update({
                where: { id: account.id },
                data: {
                    accessToken,
                    refreshToken,
                    tokenExpiresAt: expiresIn
                        ? new Date(Date.now() + expiresIn * 1000)
                        : null,
                },
            });
        } catch (error) {
            console.error("Failed to refresh token:", error);
            return null;
        }
    }

    return {
        client: new TwitterApi(accessToken),
        isOAuth2: true,
        accountId: account.id,
    };
}

interface PostThreadRequest {
    digestId: string;
    tweets: string[];
    imageUrls?: (string | null)[];
    accountId?: string; // Optional: which X account to post from
}

// Download image from URL and return as Buffer
async function downloadImage(url: string): Promise<Buffer | null> {
    try {
        const response = await fetch(url, {
            headers: {
                "User-Agent": "XFiles News Digest Bot/1.0",
            },
        });

        if (!response.ok) return null;

        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
    } catch (error) {
        console.error("Failed to download image:", error);
        return null;
    }
}

export async function POST(request: NextRequest) {
    try {
        const body: PostThreadRequest = await request.json();
        const { digestId, tweets, imageUrls, accountId } = body;

        if (!tweets || tweets.length === 0) {
            return NextResponse.json(
                { error: "No tweets provided" },
                { status: 400 }
            );
        }

        // Validate character limits
        const overLimitTweets = tweets.filter((t) => t.length > 280);
        if (overLimitTweets.length > 0) {
            return NextResponse.json(
                {
                    error: `${overLimitTweets.length} tweet(s) exceed 280 character limit`,
                },
                { status: 400 }
            );
        }

        const result = await getXClientForAccount(accountId);

        if (!result) {
            return NextResponse.json(
                {
                    error: "Bağlı X hesabı bulunamadı. Ayarlar sayfasından bir X hesabı bağlayın.",
                },
                { status: 503 }
            );
        }

        const { client, isOAuth2 } = result;

        // For OAuth 2.0 use v2 directly; for OAuth 1.0a use readWrite
        const postClient = isOAuth2 ? client : client.readWrite;

        // Post thread: each tweet replies to the previous one
        const postedTweets: { id: string; text: string }[] = [];
        let previousTweetId: string | undefined;

        for (let i = 0; i < tweets.length; i++) {
            const tweetText = tweets[i];
            let mediaId: string | undefined;

            // Upload image if available (only for OAuth 1.0a — v2 media upload requires elevated access)
            if (imageUrls?.[i] && !isOAuth2) {
                try {
                    const imageBuffer = await downloadImage(imageUrls[i]!);
                    if (imageBuffer) {
                        mediaId = await client.readWrite.v1.uploadMedia(
                            imageBuffer,
                            { mimeType: "image/jpeg" }
                        );
                    }
                } catch (error) {
                    console.error(
                        `Failed to upload media for tweet ${i + 1}:`,
                        error
                    );
                }
            }

            // Build tweet payload
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const tweetPayload: Record<string, any> = {
                text: tweetText,
            };

            if (previousTweetId) {
                tweetPayload.reply = {
                    in_reply_to_tweet_id: previousTweetId,
                };
            }

            if (mediaId) {
                tweetPayload.media = {
                    media_ids: [mediaId] as [string],
                };
            }

            const tweetResult = await postClient.v2.tweet(tweetPayload);
            postedTweets.push({
                id: tweetResult.data.id,
                text: tweetResult.data.text,
            });

            previousTweetId = tweetResult.data.id;

            // Small delay between tweets to avoid rate limiting
            if (i < tweets.length - 1) {
                await new Promise((resolve) => setTimeout(resolve, 500));
            }
        }

        // Update digest status in database
        const threadUrl = `https://x.com/i/status/${postedTweets[0].id}`;
        if (digestId) {
            await prisma.newsDigest.update({
                where: { id: digestId },
                data: {
                    status: "posted",
                    postedAt: new Date(),
                    tweetUrl: threadUrl,
                },
            });
        }

        return NextResponse.json({
            success: true,
            threadUrl,
            tweets: postedTweets,
        });
    } catch (error) {
        console.error("Failed to post thread:", error);

        const errorMessage =
            error instanceof Error ? error.message : "Unknown error";

        return NextResponse.json(
            {
                error: "Failed to post thread to X",
                details: errorMessage,
            },
            { status: 500 }
        );
    }
}
