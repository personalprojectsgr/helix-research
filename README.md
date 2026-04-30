# Helix Research — Peptide E-commerce Demo

Editorial research-peptide storefront. Express + EJS + Tailwind CDN. Real cryptocurrency checkout via [Plisio](https://plisio.net) (hosted-invoice mode). Env-gated Meta Pixel + Conversions API dual-fire with `event_id` deduplication.

## Quick start

```bash
npm install
cp .env.example .env
# (optional) edit .env to enable Plisio crypto checkout — see below
npm start
```

Server runs on `http://localhost:6767`.

## Tech stack

- **Server:** Node.js + Express 4 + EJS templating
- **Styling:** Tailwind CSS via Play CDN (v3) + a small custom CSS layer for design tokens
- **Client JS:** Vanilla ES modules over CDN (no build step)
- **Payment:** Plisio hosted-invoice (BTC, ETH, USDT, USDC, LTC, SOL, XMR, TON, TRX, DOGE, …) with HMAC-SHA1 webhook verification + polling fallback
- **Tracking:** Meta Pixel (browser) + Conversions API v20.0 (server) with shared `event_id`
- **Persistence:** JSON-file order store (`data/orders.json`) — survives restarts, no DB required

## Crypto checkout setup (Plisio)

The store ships with crypto checkout disabled. To enable:

1. Sign up at [plisio.net](https://plisio.net), then **API → Create Site** and copy the **Secret Key**.
2. Put the same value in BOTH `PLISIO_API_KEY` and `PLISIO_SECRET_KEY` in `.env` (Plisio uses one key for both API auth and webhook signing).
3. Restart the server. You should see `🪙 Plisio crypto checkout ENABLED` in the startup banner.

### Webhook delivery (production / staging)

Plisio sends `POST` payment-status callbacks to `<PLISIO_PUBLIC_BASE_URL>/api/plisio/webhook?json=true`. For local development:

- **Easy path:** ignore webhooks; the polling fallback (every 3–8s on the success page) will pick up status changes within seconds. Leave `PLISIO_PUBLIC_BASE_URL` empty.
- **Real webhooks in dev:** run a tunnel and set its public URL:
  ```
  npx ngrok http 6767
  # PLISIO_PUBLIC_BASE_URL=https://<your-id>.ngrok.io
  ```

The webhook handler verifies HMAC-SHA1 against the **raw** request body (Express `express.raw` is mounted ahead of `express.json` for this route only). Bad signatures return HTTP 422.

### Important: idempotency & states

| Plisio status        | App status         | What we do                                                |
|----------------------|--------------------|-----------------------------------------------------------|
| `new`                | `awaiting_payment` | invoice created, no action                                |
| `pending`            | `awaiting_payment` | partial bytes seen, waiting for confirmations             |
| `pending internal`   | `awaiting_payment` | Plisio sweeping funds, waiting for sweep                  |
| `completed`          | **`paid`**         | fire `Purchase` CAPI, render success page                 |
| `mismatch` (overpaid) | **`paid`**        | ship anyway; refund excess out-of-band                    |
| `expired`            | `expired`          | retry button creates a new invoice for the same order ID  |
| `cancelled`          | `expired`          | same as expired                                           |
| `cancelled duplicate` | `superseded`     | customer switched coin; we follow `child_ids` until paid  |
| `error`              | `error`            | manual intervention                                       |

## Pages

| Route | Purpose |
|-------|---------|
| `/` | Home — hero, featured peptides, categories, trust signals |
| `/shop` | Catalog with category/format/evidence filters and sort |
| `/p/:slug` | Product detail (specs, mechanism, dosing, FAQ, COA) |
| `/cart` | Cart page (also a slide-over drawer on every page) |
| `/checkout` | Contact + shipping; "Continue to payment" creates a Plisio invoice and redirects |
| `/order/success/:id` | Payment confirmation; live-polls until paid; fires Purchase Pixel |
| `/order/cancelled/:id` | Expired/cancelled invoice; "Pay again" generates a fresh invoice for the same order |
| `/about` | The Lab — EU origin story (Ljubljana facility, supply chain, team) |
| `/quality` | Manufacturing/QC pipeline (HPLC + LC-MS, cGMP, COA workflow) |
| `/shipping` | Logistics — zone delivery windows, customs, unboxing, crypto rationale |
| `/blog`, `/blog/:slug` | Journal — 10 in-depth articles loaded from `data/posts/` |
| `/faq`, `/contact` | Static editorial content |
| `/legal/*` | Terms, privacy, refund, shipping policy, disclaimer |

## API

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/checkout/plisio` | Create order + Plisio invoice; returns `{ orderId, invoiceUrl, eventIds }` |
| `POST` | `/api/plisio/webhook` | Plisio status callback (raw-body, HMAC-verified) |
| `GET`  | `/api/orders/:id/status` | Poll endpoint; refreshes from Plisio if stale (10s TTL) |
| `POST` | `/api/orders/:id/retry` | Generate a fresh invoice for an expired/errored order |
| `GET`  | `/api/tracking/config` | Pixel/CAPI config for the browser |
| `POST` | `/api/track` | Browser → server CAPI relay (deduped by `event_id`) |

## Tracking architecture

Every conversion event fires twice:

1. **Browser pixel** via `fbq('track', EventName, data, { eventID })`
2. **Server CAPI** via `POST graph.facebook.com/v20.0/{PIXEL_ID}/events` with the same `event_id`

Funnel: `PageView` → `ViewContent` → `AddToCart` → `InitiateCheckout` → `AddPaymentInfo` → `Purchase`.

Meta deduplicates on `(event_name + event_id)` within 48h. PII (email, name) is SHA-256 hashed before sending. IP and user-agent are sent unhashed (per Meta spec). `Purchase` event_id is generated at order creation and stored on the order record so the webhook (server-side CAPI) and the success-page browser fire share the exact same id.

If `TRACKING_ENABLED=false` or `FB_PIXEL_ID` is empty, all tracking is no-op.

## Folder structure

```
peptides/
├── server.js                    Express bootstrap (raw-body for webhook, json for the rest)
├── lib/
│   ├── logger.js                Structured event log
│   ├── tracking.js              Server CAPI client + PII hashing
│   ├── id.js                    Event/order/session ID generators
│   ├── catalog.js               Catalog loader
│   ├── plisio.js                Plisio API client + HMAC-SHA1 webhook verify
│   ├── orders.js                JSON-file order store + state machine
│   └── payment-helpers.js       Order construction + Plisio invoice/refresh helpers
├── data/
│   ├── categories.js            9 research categories
│   ├── peptides/                Catalog split by category
│   └── orders.json              (auto-generated) order persistence
├── routes/
│   ├── pages.js                 All editorial page routes
│   ├── api.js                   /api/track + /api/tracking/config
│   ├── payment.js               /api/checkout/plisio + /api/plisio/webhook + /api/orders/:id/*
│   └── order.js                 /order/success/:id + /order/cancelled/:id
├── public/
│   ├── css/styles.css           Design tokens
│   ├── js/                      ui, tracking, cart, catalog, product, checkout, payment-status
│   └── img/                     SVG logo
└── views/
    ├── partials/                head, header, footer, scripts, cart-drawer, product-card, legal-layout
    └── (pages)                  home, shop, product, cart, checkout, order-success, order-cancelled, about, blog, post, faq, contact, error, legal/*
```

## Demo notes

- **Order persistence:** `data/orders.json` is gitignored. Wipe it to reset state.
- **No accounts:** guest checkout only. Order ID is the only handle (16-byte random — unguessable).
- **Shipping:** zone-based pricing in `data/shipping.js` (EU standard / EU express / UK-CH-NO / international); free above `$250`.
- **No tax / VAT:** demo only.
- **Refunds:** no API path. Crypto refunds are out-of-band — contact support with the order ID.
- **Plisio fees:** 0.5% (API mode) or 1.5% (white-label). The merchant pays unless `Who pays the commission` is set to `Client` in Plisio dashboard.

## Deployment

Designed to run on any Node 18+ host. On Railway:

1. Push this repo to GitHub.
2. Create a Railway project pointed at the GitHub repo (auto-detects Node + `npm start`).
3. Set env vars in the Railway service (`STORE_NAME`, `STORE_CURRENCY`, `PLISIO_API_KEY`, `PLISIO_SECRET_KEY`, optionally `FB_PIXEL_ID` + `FB_ACCESS_TOKEN`, plus `TRACKING_ENABLED=true` to fire CAPI).
4. Once Railway issues a public domain, set `PLISIO_PUBLIC_BASE_URL=https://<domain>` so Plisio webhooks land on `<domain>/api/plisio/webhook`. The polling fallback handles updates while this is being wired up.

`PORT` is injected by the platform; the server reads `process.env.PORT` and falls back to `6767` locally.
