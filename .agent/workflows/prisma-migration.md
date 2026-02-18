---
description: Prisma ile veritabanı migration oluşturma
---

# Prisma Migration

## Adımlar

// turbo-all

### 1. Schema Güncelle
`prisma/schema.prisma` dosyasını düzenle.

### 2. Migration Oluştur
```bash
npx prisma migrate dev --name [migration-name]
```

### 3. Client Güncelle
```bash
npx prisma generate
```

### 4. Veritabanını Görüntüle
```bash
npx prisma studio
```

## Notlar
- Migration adları snake_case olmalı (örn: `add_user_table`)
- Her model değişikliğinde migration oluştur
- Production'da `prisma migrate deploy` kullan
