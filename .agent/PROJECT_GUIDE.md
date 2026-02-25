# XFiles — Proje Referans Kılavuzu

> ⚠️ **Bu dosyayı her konuşma başında oku. Env var'lar veya DB ile çalışırken bu bilgileri doğrula.**

## Proje Bilgileri

| Alan | Değer |
|---|---|
| **Proje Adı** | XFiles — AI Tweet Automation |
| **Repo** | `burakereno/xfiles` |
| **Framework** | Next.js 16 (App Router, Turbopack) |
| **ORM** | Prisma 7 (driver adapter: `@prisma/adapter-pg`) |
| **Veritabanı** | Supabase PostgreSQL |
| **Deploy** | Vercel |
| **Local Port** | `3001` |
| **Production URL** | `https://xfiles-flax.vercel.app` |

## Supabase Projesi

| Alan | Değer |
|---|---|
| **Proje Adı** | `Xfiles` |
| **Proje ID / Ref** | `dbvzpashkaoubgzhmvyz` |
| **Organizasyon** | `zhjpntwutofmgjhgjpcr` |
| **Bölge** | `eu-central-1` |
| **DB Host (Direct)** | `db.dbvzpashkaoubgzhmvyz.supabase.co:5432` |
| **Pooler Host** | `aws-0-eu-central-1.pooler.supabase.com` |

> 🔴 **DİKKAT**: Kullanıcının başka bir Supabase projesi daha var:
> - **Meetcase** → `pbixawshumeoippzycrc` (organizasyon: `tfolgjxdvssiouyrsguz`)
> - **ASLA XFiles env var'larında Meetcase credential'ları kullanma!**
> - XFiles project ref her zaman `dbvzpashkaoubgzhmvyz` olmalıdır.

## Veritabanı Bağlantı Kuralları

### Prisma 7 + pg v8 + Supabase

- Prisma 7'de `url`/`directUrl` schema'da **desteklenmiyor** — `prisma.config.ts` kullanılıyor.
- `@prisma/adapter-pg` (pg v8) Supabase **pooler**'a bağlanamıyor (`Tenant or user not found` hatası — SNI/TLS uyumsuzluğu).
- **Her zaman `DIRECT_URL` kullan** (`db.*.supabase.co:5432`).
- `DATABASE_URL` (pooler, port 6543) sadece `prisma.config.ts`'de migration'lar için kullanılır.

### Bağlantı String'leri

```
# DIRECT_URL — pg adapter için (runtime bağlantı)
postgresql://postgres:PASSWORD@db.dbvzpashkaoubgzhmvyz.supabase.co:5432/postgres

# DATABASE_URL — pooler (migration'lar için, runtime'da KULLANMA)
postgresql://postgres.dbvzpashkaoubgzhmvyz:PASSWORD@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

## Env Var Senkronizasyonu

Local (`.env`), Production (`.env.production`) ve **Vercel Dashboard** env var'ları **aynı değerlere** sahip olmalıdır:

| Değişken | Kaynak |
|---|---|
| `DATABASE_URL` | Xfiles pooler URL (port 6543) |
| `DIRECT_URL` | Xfiles direct URL (port 5432) |
| `X_CLIENT_ID` | X Developer Portal |
| `X_CLIENT_SECRET` | X Developer Portal |
| `CRON_SECRET` | Rastgele oluşturulmuş hash |

## X OAuth Akışı

- OAuth 2.0 PKCE flow kullanılıyor.
- State ve codeVerifier **veritabanında** saklanıyor (`OAuthState` tablosu) — cookie değil.
- Bu sayede cross-domain (localhost → production) akış çalışıyor.
- Callback URL: X Developer Portal'da ayarlı.

## Bilinen Sorunlar

1. **pg v8 + Supabase Pooler**: `rejectUnauthorized: false` SNI'yi bozuyor, `ssl: true` cert chain hatası veriyor. Çözüm: pooler yerine direct URL kullan.
2. **Prisma 7 schema**: `url` ve `directUrl` datasource'ta desteklenmiyor, `prisma.config.ts` gerekiyor.
