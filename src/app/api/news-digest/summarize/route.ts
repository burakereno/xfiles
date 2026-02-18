import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { generateText } from "@/lib/ai";

interface SummarizeSettings {
    format?: "thread" | "single";
    tweetCount?: number;
    tone?: string;
    charLimit?: number;
    hashtagCount?: number;
    exampleTweets?: string;
    ctaEnabled?: boolean;
    ctaText?: string;
}

const toneDescriptions: Record<string, string> = {
    professional: "Profesyonel ve ciddi bir dil kullan. Resmi ama erişilebilir ol.",
    friendly: "Samimi ve sıcak bir dil kullan. Arkadaşça ol ama bilgilendirici kal.",
    news: "Klasik haber dili kullan. Kısa, öz ve tarafsız ol.",
    humorous: "Mizahi ve eğlenceli bir dil kullan. Esprili ol ama haberin ciddiyetini koru.",
    formal: "Çok resmi bir dil kullan. Kurumsal ve profesyonel ol.",
};

export async function POST(request: NextRequest) {
    try {
        // Parse settings from request body
        let settings: SummarizeSettings = {};
        try {
            settings = await request.json();
        } catch {
            // Use defaults if no body
        }

        const format = settings.format || "thread";
        const tweetCount = settings.tweetCount || 5;
        const tone = settings.tone || "professional";
        const charLimit = settings.charLimit || 260;
        const hashtagCount = settings.hashtagCount ?? 2;
        const exampleTweets = settings.exampleTweets;
        const ctaEnabled = settings.ctaEnabled ?? false;
        const ctaText = settings.ctaText || "🔔 Takip et, günlük özet kaçırma!";

        // Build CTA instruction
        const ctaInstruction = ctaEnabled
            ? `\n\nCTA TALİMATI: Thread'in/tweet'in EN SONUNA şu CTA metnini AYNEN ekle: "${ctaText}"`
            : "";

        // Get selected news items
        const selectedNews = await prisma.newsItem.findMany({
            where: { isSelected: true },
            include: {
                source: {
                    select: { name: true },
                },
            },
            orderBy: { publishedAt: "desc" },
        });

        // Collect image URLs for the frontend to use when posting
        const imageUrls = selectedNews.map((n) => n.imageUrl);

        if (selectedNews.length === 0) {
            return NextResponse.json({ error: "No news selected" }, { status: 400 });
        }

        const today = new Date().toLocaleDateString("tr-TR", {
            day: "numeric",
            month: "long",
            year: "numeric",
        });

        // Prepare news for AI
        const newsContext = selectedNews
            .map(
                (news, i) =>
                    `${i + 1}. ${news.title} (Kaynak: ${news.source.name})${news.description ? `\nÖzet: ${news.description}` : ""}`
            )
            .join("\n\n");

        let content: string;

        // Build example tweets section
        let exampleSection = "";
        if (exampleTweets && exampleTweets.trim()) {
            exampleSection = `\n\nÖRNEK TWEETLER (Bu tarzda yaz):
${exampleTweets}

Yukarıdaki örneklerin tarzını, tonunu ve yapısını taklit et.`;
        }

        let prompt: string;

        if (format === "single") {
            prompt = `Sen bir Türk sosyal medya içerik uzmanısın. Aşağıdaki haberleri TEK BİR TWEET olarak özetle.

TON VE STİL:
${toneDescriptions[tone] || toneDescriptions.professional}
${exampleSection}

KURALLAR:
1. Haberlerin en önemli noktalarını tek bir tweette birleştir
2. Tweet ${charLimit} karakteri ASLA geçmemeli!
3. Etkili emojiler kullan
4. ${hashtagCount > 0 ? `Tam olarak ${hashtagCount} adet ilgili hashtag ekle (konuyla ilgili, trend olabilecek hashtagler seç)` : "Hashtag KULLANMA"}
5. Kısa, öz ve etkileyici ol${ctaInstruction}

HABERLER:
${newsContext}

Sadece tek tweet metnini döndür, başka açıklama ekleme.`;
        } else {
            prompt = `Sen bir Türk sosyal medya içerik uzmanısın. Aşağıdaki haberleri Twitter/X için etkileyici bir thread haline getir.

TON VE STİL:
${toneDescriptions[tone] || toneDescriptions.professional}
${exampleSection}

THREAD YAPISI:
- İLK TWEET: "🇹🇷 Günün Özeti - ${today}" başlığı ile başla. Seçilen tüm haberlerin KISA başlıklarını madde işaretleriyle listele. Bu tweet gündemin genel bir fotoğrafını çeksin.
- SONRAKI TWEETLER: Her tweet TAM OLARAK BİR haberi özetlesin. Haberin en önemli detaylarını ver, bağlam ekle, kompakt ve bilgilendirici yaz.
- SON TWEET: ${hashtagCount > 0 ? `Tam olarak ${hashtagCount} adet ilgili hashtag ekle (konuyla ilgili, trend olabilecek hashtagler seç)` : "Hashtag KULLANMA"}

KRİTİK KURALLAR:
1. Tweet numarası KULLANMA! Tweetlerin başına 1/, 2/ gibi numaralar KOYMA!
2. Her tweeti --- (üç tire) ile ayır. Her tweet arasında ayrı bir satırda sadece --- olsun.
3. Her tweet ${charLimit} karakteri ASLA geçmemeli! Bu çok önemli.
4. Her tweetin sonunda ilgili emoji kullan
5. Toplam ${tweetCount} tweet oluştur (1 giriş + ${tweetCount - 1} haber özeti)
6. Her haberi sırasıyla işle, haber atlama${ctaInstruction}

HABERLER:
${newsContext}

Sadece thread metnini döndür, başka açıklama ekleme. Tweetleri --- ile ayır.`;
        }

        content = await generateText(prompt);

        // Save digest to database
        const digest = await prisma.newsDigest.create({
            data: {
                content,
                status: "draft",
            },
        });

        return NextResponse.json({
            success: true,
            digest: {
                id: digest.id,
                content: digest.content,
                status: digest.status,
                createdAt: digest.createdAt.toISOString(),
            },
            imageUrls,
        });
    } catch (error) {
        console.error("Failed to generate digest:", error);
        return NextResponse.json({ error: "Failed to generate digest" }, { status: 500 });
    }
}
