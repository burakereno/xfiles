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
- `@prisma/adapter-pg` (pg v8) Supabase **pooler**'a bağlanırken SNI/TLS uyumsuzluğu var.
- **Vercel direct DB'ye ulaşamıyor** (Supabase sadece IPv6, Vercel IPv6 desteklemiyor).
- **Local'de `DIRECT_URL` kullan** (`db.*.supabase.co:5432`).
- **Vercel'de `DATABASE_URL` (pooler) kullan** + `NODE_TLS_REJECT_UNAUTHORIZED=0` env var.
- `prisma.ts` otomatik algılıyor: pooler ise explicit Pool params + `ssl: true`, direct ise connection string.

### Vercel'de DIRECT_URL Kullanma!

> 🔴 **ASLA Vercel env var'larına `DIRECT_URL` ekleme!**
> Vercel serverless fonksiyonları IPv6 desteklemiyor. Direct DB sadece local dev için kullanılabilir.

### Bağlantı String'leri

```
# DIRECT_URL — LOCAL dev için (pg adapter runtime bağlantı)
postgresql://postgres:PASSWORD@db.dbvzpashkaoubgzhmvyz.supabase.co:5432/postgres

# DATABASE_URL — VERCEL (pooler, NODE_TLS_REJECT_UNAUTHORIZED=0 gerektirir)
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
