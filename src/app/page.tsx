"use client";

import { useState } from "react";
import { GeneratorPanel, GeneratorSettings } from "@/components/compose/GeneratorPanel";
import { ResultsPanel, GeneratedTweet } from "@/components/compose/ResultsPanel";

// Mock function to simulate AI generation
function generateMockTweets(settings: GeneratorSettings): GeneratedTweet[] {
  const mockTweets: GeneratedTweet[] = [
    {
      id: "1",
      content: getRandomTweet(settings, 1),
      viralScore: Math.floor(Math.random() * 30) + 60,
      hookStrength: Math.floor(Math.random() * 10) + 20,
      replyPotential: Math.floor(Math.random() * 10) + 18,
      shareability: Math.floor(Math.random() * 8) + 12,
    },
    {
      id: "2",
      content: getRandomTweet(settings, 2),
      viralScore: Math.floor(Math.random() * 30) + 50,
      hookStrength: Math.floor(Math.random() * 10) + 15,
      replyPotential: Math.floor(Math.random() * 10) + 15,
      shareability: Math.floor(Math.random() * 8) + 10,
    },
    {
      id: "3",
      content: getRandomTweet(settings, 3),
      viralScore: Math.floor(Math.random() * 30) + 40,
      hookStrength: Math.floor(Math.random() * 10) + 12,
      replyPotential: Math.floor(Math.random() * 10) + 12,
      shareability: Math.floor(Math.random() * 8) + 8,
    },
  ];

  return mockTweets.sort((a, b) => b.viralScore - a.viralScore);
}

function getRandomTweet(settings: GeneratorSettings, variant: number): string {
  const hooks: Record<string, string[]> = {
    question: [
      `${settings.topic} hakkında en çok merak edilen şey nedir biliyor musun?`,
      `Sence ${settings.topic} neden bu kadar önemli?`,
      `${settings.topic} konusunda herkesin bilmesi gereken tek şey nedir?`,
    ],
    list: [
      `${settings.topic} hakkında bilmen gereken 5 şey:\n\n1. Çoğu kişinin gözden kaçırdığı detay\n2. Uzmanların önerdiği yaklaşım\n3. En yaygın hata\n4. Başarının anahtarı\n5. Hemen uygulayabileceğin taktik`,
      `${settings.topic} için 3 altın kural:\n\n→ İlk kural\n→ İkinci kural  \n→ Üçüncü kural`,
      `${settings.topic} öğrenmek isteyenler için rehber 🧵`,
    ],
    story: [
      `3 yıl önce ${settings.topic} hakkında hiçbir şey bilmiyordum.\n\nBugün binlerce kişiye öğretiyorum.\n\nİşte o yolculukta öğrendiklerim:`,
      `${settings.topic} ile ilk karşılaştığımda tam bir felaketti.\n\nAma sonra bir şeyi fark ettim...`,
      `Geçen hafta ${settings.topic} hakkında bir şey keşfettim.\n\nBu herkesin bilmesi gereken bir şey.`,
    ],
    controversial: [
      `Popüler olmayan görüş: ${settings.topic} hakkında herkes yanılıyor.`,
      `${settings.topic} konusunda kimsenin söylemeye cesaret edemediği gerçek:`,
      `${settings.topic} overrated. İşte nedeni:`,
    ],
  };

  const hookVariants = hooks[settings.hookType] || hooks.question;
  return hookVariants[variant - 1] || hookVariants[0];
}

export default function Home() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTweets, setGeneratedTweets] = useState<GeneratedTweet[]>([]);
  const [lastSettings, setLastSettings] = useState<GeneratorSettings | null>(null);

  const handleGenerate = async (settings: GeneratorSettings) => {
    setIsGenerating(true);
    setLastSettings(settings);

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const tweets = generateMockTweets(settings);
    setGeneratedTweets(tweets);
    setIsGenerating(false);
  };

  const handleRegenerate = () => {
    if (lastSettings) {
      handleGenerate(lastSettings);
    }
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* Left Panel - Generator */}
      <GeneratorPanel onGenerate={handleGenerate} isGenerating={isGenerating} />

      {/* Right Panel - Results */}
      <ResultsPanel
        tweets={generatedTweets}
        isLoading={isGenerating}
        onRegenerate={generatedTweets.length > 0 ? handleRegenerate : undefined}
      />
    </div>
  );
}
