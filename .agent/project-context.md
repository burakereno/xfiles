---
description: XFiles projesinin genel bağlamı ve kuralları
---

# XFiles - AI Tweet Automation Platform

## Proje Özeti
XFiles, X (Twitter) platformu için AI destekli otomasyon ve viral içerik üretim aracıdır.

## Teknoloji Stack
- **Framework**: Next.js 14 (App Router)
- **UI**: shadcn/ui + Tailwind CSS
- **Icons**: Lucide React
- **Database**: SQLite (Prisma ORM)
- **AI**: Claude API (Anthropic)
- **State**: Zustand

## Proje Yapısı
```
xfiles/
├── docs/                    # Dokümantasyon
│   └── x_algorithm_rules.md # X algoritma kuralları
├── src/
│   ├── app/                 # Next.js App Router
│   ├── components/          # React bileşenleri
│   │   ├── compose/         # Tweet composer
│   │   ├── layout/          # Sidebar, Header
│   │   └── ui/              # shadcn bileşenler
│   └── lib/                 # Yardımcı fonksiyonlar
├── prisma/                  # Database schema
└── .agent/                  # Antigravity skills
```

## Kodlama Standartları
- TypeScript kullan
- shadcn/ui bileşenlerini tercih et
- Lucide React ikonları kullan
- Türkçe UI metinleri
- Dark mode varsayılan

## UI / Design Kuralları
- **Card padding**: Card component'ine default `py-*` ekleme. Padding her zaman `CardContent`, `CardHeader` veya kullanım noktasında `className` ile kontrol edilmeli.
- **Spacing**: İç boşluklar için `p-3`, `p-4` veya `p-5` tercih et. `p-6` ve üzeri kaçın.
- **Header hizalama**: Çok kolonlu layout'larda tüm kolon header'ları aynı fixed height kullanmalı (ör. `h-[52px]`).
- **Compact UI**: Bu proje high-density dashboard'dur. Gereksiz boşluk bırakma, kompakt tasarım tercih et.
- **Dropdown standart**: Tüm custom dropdown'lar shadcn standardına uymalı: container `p-1` padding + `rounded-lg` border, her item `rounded-md` + hover/selected state. Selected item `bg-primary/10 text-primary` veya `bg-muted`. `first:rounded-t / last:rounded-b` kullanma, her item kendi `rounded-md`'sine sahip olmalı.
