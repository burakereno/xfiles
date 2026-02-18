---
description: XFiles projesine yeni özellik ekleme adımları
---

# Yeni Özellik Ekleme

## Adımlar

### 1. Sayfa Oluşturma
```bash
# Yeni sayfa klasörü oluştur
mkdir -p src/app/[feature-name]
```

### 2. Page Component
`src/app/[feature-name]/page.tsx` dosyası oluştur:
```tsx
export default function FeaturePage() {
  return (
    <div className="flex h-screen flex-col">
      <header className="flex h-16 shrink-0 items-center border-b border-border px-6">
        <h1 className="text-lg font-semibold">Sayfa Başlığı</h1>
      </header>
      <div className="flex-1 overflow-auto p-6">
        {/* İçerik */}
      </div>
    </div>
  );
}
```

### 3. Sidebar'a Ekle
`src/components/layout/Sidebar.tsx` dosyasında `mainNavItems` dizisine ekle:
```tsx
{ icon: IconName, label: "Sayfa Adı", href: "/feature-name" },
```

### 4. Component Oluşturma
`src/components/[feature-name]/` klasörü altında bileşenler oluştur.

## Kurallar
- Türkçe UI metinleri kullan
- shadcn/ui bileşenlerini tercih et
- Lucide React ikonları kullan
- Dark mode uyumlu renkler
