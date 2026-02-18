---
name: x-phoenix-algorithm
description: X (Twitter) Phoenix Algorithm kuralları. Tweet oluşturma, zamanlama ve içerik optimizasyonu sırasında bu kurallar ZORUNLU olarak uygulanır.
---

# X Phoenix Algorithm — Hard Constraints

Bu skill, XFiles projesinde tweet oluşturma, zamanlama ve paylaşma işlemlerinde **zorunlu olarak uygulanması gereken** Phoenix Algorithm kurallarını tanımlar.

> ⚠️ Bu kurallar ihlal edilemez. Tüm tweet/thread oluşturma ve paylaşma kodunda bu kurallar kontrol edilmelidir.

## 1. Zamanlama Kuralları

### 1.1 Günlük Limit
- **Maksimum 2 post/gün** (küçük/orta hesaplar için)
- 2. postten sonra bir sonraki güne kadar paylaşım yapılmaz

### 1.2 Minimum Aralık
- İki post arasında **minimum 8 saat** beklenir
- Bu süre dolmadan yeni paylaşım engellenir

### 1.3 Golden Hour (İlk 60 Dakika)
- Post sonrası ilk 60 dakika kritiktir
- Engagement velocity bu zaman diliminde ölçülür
- İlk saatte etkileşim düşükse viral olma şansı çok azalır

## 2. İçerik Kuralları

### 2.1 Hook Kalitesi (3-Saniye Testi)
- Kullanıcı bir tweeti **3 saniyeden az** görüntüleyip geçerse → **Scroll Pass Penalty**
- Hesabın Quality Multiplier'ı **%15-20** düşebilir
- **Zorunlu:** Her tweet'in ilk cümlesi dikkat çekici olmalı (hook)
- AI hook skoru < 7/10 → yeniden üretilmeli

### 2.2 Dwell Time Optimizasyonu
- Uzun içerik = Daha fazla dwell time = Daha iyi skor
- Thread formatı tercih edilmeli (5-7 tweet optimal)
- Medya (görsel/video) dwell time'ı artırır

### 2.3 Niche Tutarlılığı
- Ani konu değişimleri Phoenix'in similarity search'ünü bozar
- Seçilen kategorilerde tutarlı içerik üretilmeli
- Konu geçişleri kademeli olmalı

### 2.4 Negatif Sinyal Koruması
- Block/Mute/Report → **-5.0** ağırlık (hesap geneli kalite düşüşü)
- Provokatif, troll veya polarize edici tondan kaçınılmalı
- AI prompt'larında bu kısıtlama zorunlu olarak belirtilmeli

## 3. Scoring Ağırlıkları (Referans)

| Aksiyon | Ağırlık | Not |
|---------|---------|-----|
| Follow Author | +5.0 | En güçlü uzun vadeli sinyal |
| Retweet | +4.0 | Like'tan 7x daha değerli |
| Quote Tweet | +3.8 | Yüksek değerli konuşma sinyali |
| Share (DM/Link) | +3.6 | Çoklu kanal etkileşimi |
| Like | +3.5 | Temel onay sinyali |
| Reply | +3.2 | Konuşma tetikleyici |
| Video View | +3.0 | Görsel etkileşim |
| Block/Mute/Report | -5.0 | Hesap geneli kalite düşüşü |

## 4. Pre-Post Checklist

Tweet/thread paylaşmadan önce bu kontroller yapılmalıdır:

```
[ ] 8 saat aralık kontrolü geçti mi?
[ ] Günlük 2 post limiti aşılmadı mı?
[ ] İlk cümle hook kalitesi yeterli mi? (skor >= 7/10)
[ ] İçerik seçilen niche/kategori ile tutarlı mı?
[ ] Provokatif veya polarize edici ifade yok mu?
[ ] Thread ise 5-7 tweet arasında mı?
[ ] Her tweet 280 karakter limitinde mi?
```

## 5. Kod Uygulama Referansı

Zamanlama guard check örneği:
```typescript
// Guard checks before posting
const MINIMUM_INTERVAL_HOURS = 8;
const MAX_POSTS_PER_DAY = 2;

function canPost(config: AutopilotConfig): { allowed: boolean; reason?: string } {
  // Daily limit check
  if (config.todayPostCount >= MAX_POSTS_PER_DAY) {
    return { allowed: false, reason: "daily_limit" };
  }
  
  // 8-hour interval check
  if (config.lastPostAt) {
    const hoursSinceLastPost = (Date.now() - config.lastPostAt.getTime()) / (1000 * 60 * 60);
    if (hoursSinceLastPost < MINIMUM_INTERVAL_HOURS) {
      return { allowed: false, reason: "interval_wait" };
    }
  }
  
  return { allowed: true };
}
```
