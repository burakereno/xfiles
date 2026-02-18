# X Algoritması Kuralları - Tool Geliştirme Rehberi

Bu doküman, X platformunun "Phoenix" algoritmasını anlamak ve içerik stratejisi geliştirmek için kullanılabilecek kuralları içerir.

---

## 1. Sistem Mimarisi

### 1.1 Phoenix Sistemi
- X artık klasik algoritma kullanmıyor
- **Grok tabanlı transformer model** tüm öneri sisteminin beynini oluşturuyor
- El yapımı özellik (hand engineered feature) yok
- Makine öğreniyor ve karar veriyor
- **30-40 modül** tarafından çalıştırılıyor, Grok bunların **kontrolcüsü pozisyonunda**
- Tam kontrol Grok'ta değil, ama giderek daha fazla karar agent'ı gibi davranacak

### 1.2 İçerik Kaynakları
| Kaynak | Sistem | Açıklama |
|--------|--------|----------|
| Takip Edilenler | Thunder | In-memory store, anlık erişim |
| Takip Edilmeyenler | Phoenix Retrieval | ML tabanlı similarity search |

**Kritik:** Takip etmediğiniz birinin postu, takip ettiğinizin önüne geçebilir. Dış içerik iç içerik ile yarışıyor.

### 1.3 Two-Tower Model (Resmi Mimari)
```json
{
  "two_tower_model": {
    "user_tower": {
      "input": "Kullanıcı özellikleri ve etkileşim geçmişi",
      "output": "User embedding (vektör temsili)"
    },
    "candidate_tower": {
      "input": "Tüm postlar",
      "output": "Post embeddings (vektör temsilleri)"
    },
    "similarity_search": {
      "method": "Dot product similarity",
      "result": "Top-K en alakalı postları bul"
    }
  }
}
```

---

## 2. Skorlama Metrikleri

### 2.1 Pozitif Sinyaller (15 farklı aksiyon)
```json
{
  "positive_signals": [
    {"action": "like", "weight": "düşük", "difficulty": "kolay"},
    {"action": "reply", "weight": "yüksek", "difficulty": "zor"},
    {"action": "repost", "weight": "orta", "difficulty": "orta"},
    {"action": "quote", "weight": "yüksek", "difficulty": "zor"},
    {"action": "click", "weight": "orta", "difficulty": "otomatik"},
    {"action": "profile_click", "weight": "orta", "difficulty": "otomatik"},
    {"action": "video_view", "weight": "orta", "difficulty": "otomatik"},
    {"action": "photo_expand", "weight": "düşük", "difficulty": "otomatik"},
    {"action": "share", "weight": "yüksek", "difficulty": "zor"},
    {"action": "dwell", "weight": "yüksek", "difficulty": "organik"},
    {"action": "follow_author", "weight": "çok yüksek", "difficulty": "zor"}
  ]
}
```

### 2.2 Negatif Sinyaller (Kritik!)
```json
{
  "negative_signals": [
    {"action": "not_interested", "impact": "skor düşer"},
    {"action": "block_author", "impact": "ciddi skor düşüşü"},
    {"action": "mute_author", "impact": "skor düşer"},
    {"action": "report", "impact": "ciddi skor düşüşü"}
  ]
}
```

### 2.3 Skor Formülü
```
final_score = Σ(ağırlık × olasılık)
```

**Aksiyon Öncelik Sıralaması:**
```
reply > repost > like
```

---

## 3. Gizli Skorlama Sistemleri

### 3.1 TweetCred (Hesap Otoritesi)
```json
{
  "tweetcred": {
    "start_score": -128,
    "minimum_effective_score": 17,
    "verified_boost": 100,
    "verified_start_score": -28,
    "description": "Her hesabın gizli otorite skoru var. +17'ye ulaşana kadar erişim gücü neredeyse sıfır."
  }
}
```

### 3.2 Engagement Debt (Etkileşim Borcu)
```json
{
  "engagement_debt": {
    "evaluation_period": "ilk 100 post",
    "metric": "like/görüntülenme oranı",
    "penalty": "cold_start_suppression",
    "suppressed_distribution": "10%",
    "recommendation": "İlk postların yüksek kaliteli olmalı"
  }
}
```

### 3.3 Author Diversity Scorer
```json
{
  "author_diversity": {
    "rule": "Aynı yazardan çok post görünce sonrakiler düşük skor alıyor",
    "recommendation": {
      "max_daily_posts": 2,
      "min_hours_between": 8,
      "note": "Büyük account değilsen geçerli"
    },
    "reason": "Spam atanlar reach alamıyor çünkü her sonraki post bir öncekinden düşük skor alıyor"
  }
}
```

---

## 4. Zaman Bazlı Kurallar

### 4.1 Golden Hour (Altın Saat)
```json
{
  "golden_hour": {
    "critical_period": "ilk 1 saat",
    "storage": "Thunder sistemi recent posts tutuyor",
    "success_outcome": "geniş dağıtıma açılma",
    "failure_outcome": "post ölü doğuyor",
    "recommendations": [
      "İlk 1 saat aktif kal",
      "Yorumlara hızlı cevap ver",
      "Etkileşimi teşvik et"
    ]
  }
}
```

### 4.2 Dwell Time (Kalma Süresi)
```json
{
  "dwell_time": {
    "importance": "15 metrikten biri",
    "manipulation": "Sahte dwell time alamazsın",
    "optimization": [
      "Uzun okutan içerik yap",
      "Durduran, dikkat çeken içerik üret",
      "Video/görsel kullanarak kalma süresini artır"
    ]
  }
}
```

### 4.3 Dwell Time Decay (Scroll Pass Cezası) ⚠️
```json
{
  "dwell_time_decay": {
    "trigger": "Kullanıcı postu 3 saniyeden az incelerse (scroll pass)",
    "effect": "Negatif sinyal olarak kaydediliyor",
    "penalty": {
      "quality_multiplier_drop": "15-20%",
      "description": "Hesabın genel quality multiplier'ı düşüyor"
    },
    "consequence": "Postlar algoritmada daha sağlam duvarlara çarpıyor, daha zor yayılıyor",
    "warning": "Bu nedenle ilgi çekmeyen, hızlı geçilen içerik üretmekten kaçın"
  }
}
```

---

## 5. Teknik Özellikler

### 5.1 Candidate Isolation
```json
{
  "candidate_isolation": {
    "description": "Postun skorlanırken aynı batch'teki diğer postları görmüyor",
    "benefit": "Kaliteli içerik her zaman yüksek skor alır",
    "implication": "Viral post formülü bulursan tekrar tekrar işe yarar",
    "cacheability": "Skor tutarlı ve önbelleğe alınabilir"
  }
}
```

### 5.2 OON Scorer (Out-of-Network)
```json
{
  "oon_scorer": {
    "description": "Takip etmediğin hesaplardan gelen içerik için skor ayarlaması",
    "function": "Out-of-network içeriğin in-network ile rekabet edebilmesi için ek skorlama",
    "note": "Phoenix Retrieval ile bulunan postlara uygulanır"
  }
}
```

### 5.3 Hash-Based Embeddings
```json
{
  "hash_based_embeddings": {
    "description": "Retrieval ve ranking için birden fazla hash fonksiyonu kullanılıyor",
    "benefit": "Hızlı ve verimli embedding lookup",
    "usage": ["User Tower", "Candidate Tower", "Similarity Search"]
  }
}
```

### 5.4 Accuracy İyileştirmesi
```json
{
  "accuracy_improvement": {
    "old_ratio": "1k like için 300k görüntülenme gerekiyordu",
    "new_ratio": "50k görüntülenmede 1k like alabiliyor",
    "reason": "Phoenix nokta atışı şekilde buluyor doğru kitleyi"
  }
}
```

### 5.5 Pre-Scoring Filters (Resmi Filtre Listesi)
```json
{
  "pre_scoring_filters": {
    "description": "Skorlama öncesi uygulanan filtreler",
    "filters": [
      {"name": "DropDuplicatesFilter", "function": "Tekrar eden postları çıkar"},
      {"name": "AgeFilter", "function": "Çok eski postları çıkar"},
      {"name": "SelfpostFilter", "function": "Kendi postlarını gösterme"},
      {"name": "RepostDeduplicationFilter", "function": "Repost tekrarlarını çıkar"},
      {"name": "PreviouslySeenPostsFilter", "function": "Daha önce görülen postları çıkar"},
      {"name": "PreviouslyServedPostsFilter", "function": "Yakın zamanda sunulan postları çıkar"},
      {"name": "MutedKeywordFilter", "function": "Sessize alınmış kelimeleri içeren postları çıkar"},
      {"name": "AuthorSocialgraphFilter", "function": "Block/mute edilmiş yazarları çıkar"},
      {"name": "IneligibleSubscriptionFilter", "function": "Yetkisiz abonelik içeriğini çıkar"}
    ]
  },
  "post_selection_filters": {
    "description": "Seçim sonrası uygulanan filtreler",
    "filters": [
      {"name": "VFFilter", "function": "Silinen/spam/şiddet içerikli postları çıkar"},
      {"name": "DedupConversationFilter", "function": "Conversation tekrarlarını çıkar"}
    ]
  }
}
```

---

## 6. Pratik Kurallar Listesi

### 6.1 İÇERİK KURALLARI
| Kural ID | Kural | Öncelik | Açıklama |
|----------|-------|---------|----------|
| C001 | Kaliteli içerik üret | Kritik | Reply, repost, share aldıran içerik |
| C002 | Dwell time optimize et | Yüksek | Uzun okutan, durduran içerik |
| C003 | Görsel/video kullan | Orta | Dwell time ve etkileşimi artırır |
| C004 | Hook kullan | Yüksek | İlk satırda dikkat çek |
| C005 | Scroll pass'ten kaçın | Kritik | 3 sn altı inceleme = %15-20 quality düşüşü |

### 6.2 ZAMANLAMA KURALLARI
| Kural ID | Kural | Öncelik | Açıklama |
|----------|-------|---------|----------|
| T001 | Günde max 2 post | Kritik | Author diversity penalty'den kaçın |
| T002 | 8 saat ara bırak | Kritik | Postlar arası minimum süre |
| T003 | İlk 1 saat aktif kal | Kritik | Golden hour kuralı |
| T004 | Yorumlara hızlı cevap ver | Yüksek | Etkileşimi artırır |

### 6.3 ETKİLEŞİM KURALLARI
| Kural ID | Kural | Öncelik | Açıklama |
|----------|-------|---------|----------|
| E001 | Trollük yapma | Kritik | Block/mute/report skoru düşürür |
| E002 | Kavga etme | Kritik | Negatif aksiyon aldırma |
| E003 | Negatiflik yapma | Yüksek | Grok izliyor |
| E004 | Reply odaklı içerik üret | Yüksek | En yüksek ağırlıklı aksiyon |

### 6.4 YENİ HESAP KURALLARI
| Kural ID | Kural | Öncelik | Açıklama |
|----------|-------|---------|----------|
| N001 | Sabırlı ol | Kritik | TweetCred skoru zamanla yükseliyor |
| N002 | İlk 100 post bomba olsun | Kritik | Engagement debt oluşturma |
| N003 | Düşük reach beklenti | Bilgi | TweetCred -128'den başlıyor |
| N004 | Verified ol | Önerilen | +100 boost ile -28'den başla |

---

## 7. Tool Geliştirme İçin Veri Yapıları

### 7.1 Post Analiz Objesi
```typescript
interface PostAnalysis {
  content: {
    text: string;
    hasMedia: boolean;
    mediaType: 'image' | 'video' | 'gif' | null;
    textLength: number;
    hasHook: boolean;
    estimatedDwellTime: number; // saniye
  };
  timing: {
    postedAt: Date;
    hoursSinceLastPost: number;
    dailyPostCount: number;
    isWithinGoldenHour: boolean;
  };
  engagement: {
    likes: number;
    replies: number;
    reposts: number;
    quotes: number;
    views: number;
    engagementRate: number;
  };
  signals: {
    positiveScore: number;
    negativeScore: number;
    finalScore: number;
  };
}
```

### 7.2 Hesap Sağlık Objesi
```typescript
interface AccountHealth {
  tweetcred: {
    estimatedScore: number;
    isVerified: boolean;
    accountAge: number; // gün
  };
  engagementDebt: {
    first100PostsAvgEngagement: number;
    isInColdStart: boolean;
    distributionPercentage: number;
  };
  authorDiversity: {
    last24hPostCount: number;
    averageHoursBetweenPosts: number;
    diversityPenaltyRisk: 'low' | 'medium' | 'high';
  };
  negativeSignals: {
    recentBlocks: number;
    recentMutes: number;
    recentReports: number;
    riskLevel: 'low' | 'medium' | 'high';
  };
}
```

### 7.3 Öneri Objesi
```typescript
interface ContentRecommendation {
  timing: {
    optimalPostTime: Date;
    shouldWait: boolean;
    waitHours: number;
  };
  content: {
    suggestedLength: 'short' | 'medium' | 'long';
    useMedia: boolean;
    suggestedMediaType: 'image' | 'video' | null;
    hookSuggestions: string[];
  };
  warnings: {
    diversityPenaltyWarning: boolean;
    goldenHourReminder: boolean;
    engagementDebtWarning: boolean;
  };
  score: {
    predictedEngagement: 'low' | 'medium' | 'high';
    confidence: number;
  };
}
```

---

## 8. Kural Öncelik Matrisi

```
KRITIK (Kırılırsa ciddi zarar):
├── Günde max 2 post (author diversity) - büyük account değilsen
├── 8 saat ara bırak
├── İlk 1 saat aktif kal (golden hour)
├── Negatif aksiyon aldırma (block/mute/report)
├── İlk 100 post kaliteli olsun (engagement debt)
└── Scroll pass'ten kaçın (3 sn altı = %15-20 quality düşüşü)

YÜKSEK (Performansı ciddi etkiler):
├── Reply odaklı içerik üret
├── Dwell time optimize et
├── Yorumlara hızlı cevap ver
└── Hook kullan

ORTA (İyileştirme sağlar):
├── Görsel/video kullan
├── Verified ol
└── Tutarlı içerik stratejisi

DÜŞÜK (Nice to have):
├── Optimal saat paylaşımı
└── Hashtag optimizasyonu
```

---

## 9. Özet Kontrol Listesi

### Post Öncesi Kontrol
- [ ] Son posttan en az 8 saat geçti mi?
- [ ] Bugün 2'den az post attım mı?
- [ ] İçerik reply almaya uygun mu?
- [ ] Hook/dikkat çekici giriş var mı?
- [ ] Dwell time için yeterli uzunluk var mı?
- [ ] Scroll pass riski var mı? (3 sn'de geçilecek içerik mi?)

### Post Sonrası Kontrol
- [ ] İlk 1 saat aktif kalabilecek miyim?
- [ ] Yorumlara hızlı cevap verebilecek miyim?
- [ ] Negatif etkileşimlerden kaçınabilecek miyim?

### Haftalık Kontrol
- [ ] Engagement oranı sağlıklı mı?
- [ ] Block/mute/report aldım mı?
- [ ] Author diversity penalty riski var mı?

---

*Kaynak: @hrrcnes X thread analizi (20 Ocak 2026)*
