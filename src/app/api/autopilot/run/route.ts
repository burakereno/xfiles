import { NextResponse, NextRequest } from "next/server";
import { TwitterApi } from "twitter-api-v2";
import Parser from "rss-parser";
import prisma from "@/lib/prisma";
import { generateText } from "@/lib/ai";

const parser = new Parser({
    timeout: 10000,
    headers: { "User-Agent": "XFiles Autopilot Bot/1.0" },
    customFields: {
        item: [
            ["media:content", "mediaContent", { keepArray: false }],
            ["media:thumbnail", "mediaThumbnail", { keepArray: false }],
        ],
    },
});

// --- Phoenix Algorithm Constants ---
const MINIMUM_INTERVAL_HOURS = 8;
const MAX_POSTS_PER_DAY = 2;
const HOOK_QUALITY_THRESHOLD = 7;

// Default news sources by category
const SOURCE_MAP: Record<string, { name: string; url: string }[]> = {
    teknoloji: [
        { name: "NTV", url: "https://www.ntv.com.tr/teknoloji.rss" },
        { name: "Webtekno", url: "https://www.webtekno.com/rss.xml" },
        { name: "T24", url: "https://t24.com.tr/rss/haber/bilim-teknoloji" },
        { name: "Cumhuriyet", url: "https://www.cumhuriyet.com.tr/rss/teknoloji" },
    ],
    siyaset: [
        { name: "T24", url: "https://t24.com.tr/rss/haber/politika" },
        { name: "NTV", url: "https://www.ntv.com.tr/turkiye.rss" },
        { name: "Cumhuriyet", url: "https://www.cumhuriyet.com.tr/rss/siyaset" },
    ],
    ekonomi: [
        { name: "NTV", url: "https://www.ntv.com.tr/ekonomi.rss" },
        { name: "T24", url: "https://t24.com.tr/rss/haber/ekonomi" },
        { name: "Cumhuriyet", url: "https://www.cumhuriyet.com.tr/rss/ekonomi" },
    ],
    dünya: [
        { name: "NTV", url: "https://www.ntv.com.tr/dunya.rss" },
        { name: "T24", url: "https://t24.com.tr/rss/haber/dunya" },
        { name: "BBC Türkçe", url: "https://feeds.bbci.co.uk/turkce/rss.xml" },
        { name: "Euronews Türkçe", url: "https://tr.euronews.com/rss" },
        { name: "Cumhuriyet", url: "https://www.cumhuriyet.com.tr/rss/dunya" },
    ],
    spor: [
        { name: "NTV", url: "https://www.ntv.com.tr/spor.rss" },
        { name: "T24", url: "https://t24.com.tr/rss/haber/spor" },
        { name: "Cumhuriyet", url: "https://www.cumhuriyet.com.tr/rss/spor" },
    ],
    yaşam: [
        { name: "NTV", url: "https://www.ntv.com.tr/yasam.rss" },
        { name: "T24", url: "https://t24.com.tr/rss/haber/yasam" },
        { name: "Cumhuriyet", url: "https://www.cumhuriyet.com.tr/rss/yasam" },
    ],
};

const toneDescriptions: Record<string, string> = {
    professional: "Profesyonel ve ciddi bir dil kullan. Resmi ama erişilebilir ol.",
    friendly: "Samimi ve sıcak bir dil kullan. Arkadaşça ol ama bilgilendirici kal.",
    humorous: "Mizahi ve eğlenceli bir dil kullan. Esprili ol ama haberin ciddiyetini koru.",
};

// Extract image URL from various RSS feed formats
function extractImageUrl(item: Record<string, unknown>): string | null {
    const enclosure = item.enclosure as { url?: string; type?: string } | undefined;
    if (enclosure?.url && enclosure.type?.startsWith("image")) return enclosure.url;

    const mediaContent = item.mediaContent as { $?: { url?: string } } | undefined;
    if (mediaContent?.$?.url) return mediaContent.$.url;

    const mediaThumbnail = item.mediaThumbnail as { $?: { url?: string } } | undefined;
    if (mediaThumbnail?.$?.url) return mediaThumbnail.$.url;

    const content = (item.content || item["content:encoded"]) as string | undefined;
    if (content) {
        const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["']/);
        if (imgMatch?.[1]) return imgMatch[1];
    }

    return null;
}

// Helper: Log an autopilot action
async function logAction(configId: string, action: string, details: Record<string, unknown>, tweetUrl?: string) {
    await prisma.autopilotLog.create({
        data: {
            configId,
            action,
            details: JSON.stringify(details),
            tweetUrl: tweetUrl || null,
        },
    });
}

// Helper: Guard check based on Phoenix Algorithm
function canPost(config: {
    todayPostCount: number;
    tweetsPerDay: number;
    lastPostAt: Date | null;
}): { allowed: boolean; reason?: string } {
    // Daily limit check
    if (config.todayPostCount >= Math.min(config.tweetsPerDay, MAX_POSTS_PER_DAY)) {
        return { allowed: false, reason: "daily_limit" };
    }

    // 8-hour interval check
    if (config.lastPostAt) {
        const hoursSinceLastPost =
            (Date.now() - config.lastPostAt.getTime()) / (1000 * 60 * 60);
        if (hoursSinceLastPost < MINIMUM_INTERVAL_HOURS) {
            return {
                allowed: false,
                reason: "interval_wait",
            };
        }
    }

    return { allowed: true };
}

// Helper: Get an authenticated X client for a specific account
async function getXClientForAccount(accountId?: string | null) {
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
            };
        }
        return null;
    }

    // Check if token needs refresh
    let { accessToken, refreshToken } = account;
    if (
        account.tokenExpiresAt &&
        account.tokenExpiresAt.getTime() < Date.now() + 60000
    ) {
        try {
            const refreshClient = new TwitterApi({
                clientId: process.env.X_CLIENT_ID!,
                clientSecret: process.env.X_CLIENT_SECRET!,
            });

            const {
                accessToken: newAccessToken,
                refreshToken: newRefreshToken,
                expiresIn,
            } = await refreshClient.refreshOAuth2Token(refreshToken);

            accessToken = newAccessToken;
            if (newRefreshToken) refreshToken = newRefreshToken;

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
    };
}

// ------- MAIN AUTOPILOT RUN ENDPOINT -------
export async function POST(request: NextRequest) {
    try {
        // Verify cron secret for Vercel Cron (optional for manual triggers)
        const authHeader = request.headers.get("authorization");
        const isManualTrigger = request.headers.get("x-manual-trigger") === "true";

        if (!isManualTrigger && process.env.CRON_SECRET) {
            if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }
        }

        // 1. Get active autopilot configs (multi-account)
        const body = await request.json().catch(() => ({}));
        const targetConfigId = body?.configId;

        const configs = targetConfigId
            ? await prisma.autopilotConfig.findMany({
                where: { id: targetConfigId, isActive: true },
            })
            : await prisma.autopilotConfig.findMany({
                where: { isActive: true },
            });

        if (configs.length === 0) {
            return NextResponse.json({
                skipped: true,
                reason: "no_active_config",
                message: "No active autopilot configuration found",
            });
        }

        // Process first matching config (cron will call for each)
        const config = configs[0];

        // Reset daily counter if new day
        const today = new Date().toISOString().split("T")[0];
        if (config.lastResetDate !== today) {
            await prisma.autopilotConfig.update({
                where: { id: config.id },
                data: { todayPostCount: 0, lastResetDate: today },
            });
            config.todayPostCount = 0;
            config.lastResetDate = today;
        }

        // 2. Phoenix Algorithm Guard Check
        const guardCheck = canPost(config);
        if (!guardCheck.allowed) {
            await logAction(config.id, "skipped", {
                reason: guardCheck.reason,
                todayPostCount: config.todayPostCount,
                lastPostAt: config.lastPostAt?.toISOString(),
            });
            return NextResponse.json({
                skipped: true,
                reason: guardCheck.reason,
                message:
                    guardCheck.reason === "daily_limit"
                        ? `Daily limit reached (${config.todayPostCount}/${config.tweetsPerDay})`
                        : "8-hour interval not met yet",
            });
        }

        // 2.5. Timezone-based hour check (skip if not within preferred posting hours)
        const preferredHoursStr = config.preferredHours;
        if (!isManualTrigger && preferredHoursStr && preferredHoursStr.trim().length > 0) {
            const preferredHoursArr = preferredHoursStr.split(",").map((h: string) => h.trim());
            const tz = config.timezone || "Europe/Istanbul";
            const nowInTz = new Date(new Date().toLocaleString("en-US", { timeZone: tz }));
            const currentHour = nowInTz.getHours();
            const currentMinute = nowInTz.getMinutes();

            // Check if current time is within ±30 min of any preferred hour
            const preferredHourNums = preferredHoursArr.map((h: string) => parseInt(h.split(":")[0]));
            const isWithinWindow = preferredHourNums.some((ph: number) => {
                const diffMinutes = Math.abs((currentHour * 60 + currentMinute) - (ph * 60));
                return diffMinutes <= 30 || diffMinutes >= (24 * 60 - 30); // Handle midnight wrap
            });

            if (!isWithinWindow) {
                await logAction(config.id, "skipped", {
                    reason: "outside_preferred_hours",
                    currentHour: `${currentHour}:${String(currentMinute).padStart(2, "0")}`,
                    preferredHours: preferredHoursArr,
                    timezone: tz,
                });
                return NextResponse.json({
                    skipped: true,
                    reason: "outside_preferred_hours",
                    message: `Current time (${currentHour}:${String(currentMinute).padStart(2, "0")} ${tz}) is outside preferred posting hours`,
                });
            }
        }

        // 3. Fetch news from RSS for selected categories
        const categories = config.categories.split(",").map((c: string) => c.trim());
        const allNews: { title: string; description: string; source: string; imageUrl: string | null }[] = [];

        for (const category of categories) {
            const allSourcesForCat = SOURCE_MAP[category] || [];
            // Filter by selectedSources if configured
            const selectedSourcesStr = config.selectedSources;
            const selectedSourceNames = selectedSourcesStr && selectedSourcesStr.trim().length > 0
                ? selectedSourcesStr.split(",").map((s: string) => s.trim())
                : allSourcesForCat.map(s => s.name); // default: all
            const sources = allSourcesForCat.filter(s => selectedSourceNames.includes(s.name));
            for (const source of sources) {
                try {
                    const feed = await parser.parseURL(source.url);
                    const now = new Date();
                    const fourHoursAgo = new Date(now.getTime() - 4 * 60 * 60 * 1000);

                    for (const item of feed.items.slice(0, 10)) {
                        const pubDate = item.pubDate ? new Date(item.pubDate) : now;
                        if (pubDate < fourHoursAgo) continue;
                        if (!item.title) continue;

                        allNews.push({
                            title: item.title,
                            description: item.contentSnippet || item.content || "",
                            source: source.name,
                            imageUrl: extractImageUrl(item as unknown as Record<string, unknown>),
                        });
                    }
                } catch (error) {
                    console.error(`Autopilot: Failed to fetch ${source.name}:`, error);
                }
            }
        }

        if (allNews.length === 0) {
            await logAction(config.id, "skipped", {
                reason: "no_news",
                categories,
            });
            return NextResponse.json({
                skipped: true,
                reason: "no_news",
                message: "No recent news found for selected categories",
            });
        }

        await logAction(config.id, "fetch", {
            newsCount: allNews.length,
            categories,
        });

        // 4. Deduplicate — check against recent autopilot logs to avoid repeating same news
        const recentLogs = await prisma.autopilotLog.findMany({
            where: {
                configId: config.id,
                action: "post",
                createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
            },
            orderBy: { createdAt: "desc" },
            take: 10,
        });

        const recentTitles = new Set<string>();
        for (const log of recentLogs) {
            try {
                const logDetails = JSON.parse(log.details);
                if (logDetails.titles) {
                    logDetails.titles.forEach((t: string) => recentTitles.add(t.toLowerCase()));
                }
            } catch {
                // skip
            }
        }

        const freshNews = allNews.filter(
            (n) => !recentTitles.has(n.title.toLowerCase())
        );

        if (freshNews.length < 3) {
            await logAction(config.id, "skipped", {
                reason: "insufficient_fresh_news",
                total: allNews.length,
                fresh: freshNews.length,
            });
            return NextResponse.json({
                skipped: true,
                reason: "insufficient_fresh_news",
                message: `Only ${freshNews.length} fresh news items (need at least 3)`,
            });
        }

        // 5. AI: Select top news and generate tweet thread
        const newsForAI = freshNews.slice(0, 15);

        const newsContext = newsForAI
            .map(
                (news, i) =>
                    `${i + 1}. ${news.title} (Kaynak: ${news.source})${news.description ? `\nÖzet: ${news.description.substring(0, 200)}` : ""}`
            )
            .join("\n\n");

        const today_tr = new Date().toLocaleDateString("tr-TR", {
            day: "numeric",
            month: "long",
            year: "numeric",
        });

        const toneDesc = toneDescriptions[config.tone] || toneDescriptions.professional;

        let prompt: string;
        if (config.format === "single") {
            prompt = `Sen bir Türk sosyal medya içerik uzmanısın. Aşağıdaki haberlerden en önemli 3-4 tanesini seç ve TEK BİR TWEET olarak özetle.

TON VE STİL:
${toneDesc}

KURALLAR:
1. Haberlerin en önemli noktalarını tek bir tweette birleştir
2. Tweet ${config.charLimit} karakteri ASLA geçmemeli!
3. Etkili emojiler kullan
4. ${2 > 0 ? `Tam olarak 2 adet ilgili hashtag ekle (konuyla ilgili, trend olabilecek hashtagler seç)` : "Hashtag KULLANMA"}
5. İLK CÜMLE ÇOK ÖNEMLİ: Kullanıcının 3 saniye durmasını sağlayacak dikkat çekici bir hook ile başla
6. Provokatif, troll veya kutuplaştırıcı ifadeler KULLANMA${config.ctaEnabled && config.ctaText ? `\n\nCTA TALİMATI: Tweet'in EN SONUNA şu CTA metnini AYNEN ekle: "${config.ctaText}"` : ""}

HABERLER:
${newsContext}

Sadece tweet metnini döndür, başka açıklama ekleme.`;
        } else {
            prompt = `Sen bir Türk sosyal medya içerik uzmanısın. Aşağıdaki haberlerden en önemli ${config.tweetCount - 1} tanesini seç ve Twitter/X için etkileyici bir thread haline getir.

TON VE STİL:
${toneDesc}

THREAD YAPISI:
- İLK TWEET: "🇹🇷 Günün Özeti - ${today_tr}" başlığı ile başla. Seçilen haberlerin KISA başlıklarını madde işaretleriyle listele.
- SONRAKI TWEETLER: Her tweet TAM OLARAK BİR haberi özetlesin. Haberin en önemli detaylarını ver.
- SON TWEET: Tam olarak 2 adet ilgili hashtag ekle (konuyla ilgili, trend olabilecek hashtagler seç)

KRİTİK KURALLAR:
1. Tweet numarası KULLANMA! Tweetlerin başına 1/, 2/ gibi numaralar KOYMA!
2. Her tweeti --- (üç tire) ile ayır.
3. Her tweet ${config.charLimit} karakteri ASLA geçmemeli!
4. Her tweetin sonunda ilgili emoji kullan
5. Toplam ${config.tweetCount} tweet oluştur
6. İLK CÜMLE ÇOK ÖNEMLİ: Kullanıcının 3 saniye durmasını sağlayacak dikkat çekici bir hook ile başla
7. Provokatif, troll veya kutuplaştırıcı ifadeler ASLA KULLANMA
8. Niche tutarlılığını koru — sadece seçilen kategorilerle ilgili içerik üret${config.ctaEnabled && config.ctaText ? `\n\nCTA TALİMATI: Thread'in SON tweetinin sonuna şu CTA metnini AYNEN ekle: "${config.ctaText}"` : ""}

HABERLER:
${newsContext}

Sadece thread metnini döndür, başka açıklama ekleme. Tweetleri --- ile ayır.`;
        }

        const result = await generateText(prompt);
        const tweetContent = result;

        await logAction(config.id, "summarize", {
            format: config.format,
            tweetCount: config.tweetCount,
            contentLength: tweetContent.length,
        });

        // 6. Hook Quality Check (Phoenix Algorithm Rule #3)
        const hookCheckPrompt = `Aşağıdaki tweet/thread'in İLK CÜMLESİNİ değerlendir.

Soru: Bu ilk cümle, bir Twitter kullanıcısının feed'de kaydırırken 3 saniye durmasını sağlar mı?

Kriterler:
- Dikkat çekici mi?
- Merak uyandırıyor mu?
- Duygusal bir tepki tetikler mi?
- Scroll-pass riski düşük mü?

Tweet içeriği:
${tweetContent.substring(0, 500)}

SADECE bir rakam döndür (1-10 arası skor). Başka bir şey yazma.`;

        const hookResult = await generateText(hookCheckPrompt);
        const hookScoreText = hookResult.trim();
        const hookScore = parseInt(hookScoreText) || 5;

        await logAction(config.id, "hook_check", {
            score: hookScore,
            threshold: HOOK_QUALITY_THRESHOLD,
            passed: hookScore >= HOOK_QUALITY_THRESHOLD,
        });

        let finalContent = tweetContent;

        // If hook quality is below threshold, regenerate once
        if (hookScore < HOOK_QUALITY_THRESHOLD) {
            const improvePrompt = `${prompt}

EK TALİMAT: İlk cümlen YETERİNCE DİKKAT ÇEKİCİ DEĞİL. 
Daha güçlü, daha çarpıcı, merak uyandıran bir hook ile başla.
Kullanıcının kesinlikle durmasını sağlayacak bir giriş yaz.`;

            const improvedResult = await generateText(improvePrompt);
            finalContent = improvedResult;

            await logAction(config.id, "hook_check", {
                score: hookScore,
                action: "regenerated",
                message: "Content regenerated due to low hook score",
            });
        }

        // 7. Post to X
        const tweets = finalContent
            .split(/---/)
            .filter((t) => t.trim())
            .map((t) => t.trim());

        // Validate character limits
        const overLimitTweets = tweets.filter((t) => t.length > 280);
        if (overLimitTweets.length > 0) {
            // Truncate if over limit
            for (let i = 0; i < tweets.length; i++) {
                if (tweets[i].length > 280) {
                    tweets[i] = tweets[i].substring(0, 277) + "...";
                }
            }
        }

        const xClient = await getXClientForAccount(config.xAccountId);
        if (!xClient) {
            await logAction(config.id, "error", {
                reason: "no_x_account",
                message: "No X account configured or available",
            });
            return NextResponse.json(
                { error: "No X account available" },
                { status: 503 }
            );
        }

        const { client, isOAuth2 } = xClient;
        const postClient = isOAuth2 ? client : client.readWrite;

        const postedTweets: { id: string; text: string }[] = [];
        let previousTweetId: string | undefined;

        for (let i = 0; i < tweets.length; i++) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const tweetPayload: Record<string, any> = { text: tweets[i] };

            if (previousTweetId) {
                tweetPayload.reply = { in_reply_to_tweet_id: previousTweetId };
            }

            const tweetResult = await postClient.v2.tweet(tweetPayload);
            postedTweets.push({
                id: tweetResult.data.id,
                text: tweetResult.data.text,
            });

            previousTweetId = tweetResult.data.id;

            // Rate limiting delay between tweets
            if (i < tweets.length - 1) {
                await new Promise((resolve) => setTimeout(resolve, 500));
            }
        }

        const threadUrl = `https://x.com/i/status/${postedTweets[0].id}`;

        // 8. Update config state
        await prisma.autopilotConfig.update({
            where: { id: config.id },
            data: {
                lastPostAt: new Date(),
                todayPostCount: config.todayPostCount + 1,
            },
        });

        // 9. Log successful post
        const selectedTitles = newsForAI
            .slice(0, config.tweetCount)
            .map((n) => n.title);

        await logAction(
            config.id,
            "post",
            {
                tweetCount: postedTweets.length,
                hookScore,
                titles: selectedTitles,
                categories,
                todayPostCount: config.todayPostCount + 1,
            },
            threadUrl
        );

        return NextResponse.json({
            success: true,
            threadUrl,
            tweets: postedTweets,
            hookScore,
            todayPostCount: config.todayPostCount + 1,
        });
    } catch (error) {
        console.error("Autopilot run failed:", error);

        // Try to log the error
        try {
            const config = await prisma.autopilotConfig.findFirst({
                where: { isActive: true },
            });
            if (config) {
                await logAction(config.id, "error", {
                    message: error instanceof Error ? error.message : "Unknown error",
                });
            }
        } catch {
            // ignore logging failure
        }

        return NextResponse.json(
            {
                error: "Autopilot run failed",
                details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}

// GET handler for cron triggers (Vercel Cron & Supabase pg_cron)
export async function GET(request: NextRequest) {
    // Verify authorization
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Delegate to POST handler with cron context
    const syntheticRequest = new NextRequest(request.url, {
        method: "POST",
        headers: new Headers({
            "content-type": "application/json",
            "authorization": authHeader || "",
        }),
        body: JSON.stringify({}),
    });

    return POST(syntheticRequest);
}
