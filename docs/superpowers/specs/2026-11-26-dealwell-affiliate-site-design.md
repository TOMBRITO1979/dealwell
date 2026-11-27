# DealWell — Affiliate Storefront — Design Spec

**Date:** 2026-11-26
**Domain:** dealwell.pro (Hostinger)
**Audience / language:** English (US)
**Owner:** Wellington (GitHub: TOMBRITO1979, Hostinger user u115504887)

---

## 1. Overview

DealWell is an affiliate storefront: a responsive web page showing a grid of
product cards. Each card links out to an affiliate channel (Amazon, TikTok,
Shopee, or any other) where the owner earns commission.

The owner manages all content from a **Google Drive folder** — no code, no admin
panel. A spreadsheet holds product data; a media folder holds the images/videos.
An automated sync job reads both and publishes the site to `dealwell.pro` on a
schedule, so the owner only ever touches Google Drive.

### Goals
- Owner adds/edits products purely in Google Sheets + a Drive media folder.
- Site updates automatically on a schedule (default: hourly).
- Product photos/videos are served fast and reliably from the owner's own domain.
- Design: "Warm & Editorial" — magazine-like, curated "our picks" feel.

### Non-goals (v1 — YAGNI)
- No prices (explicitly excluded by owner).
- No user accounts, cart, or checkout (pure affiliate outbound links).
- No multi-language (English only).
- No self-serve admin panel / build button (automatic schedule only).
- No analytics dashboard (can add later; see Future Ideas).

---

## 2. Content model — the owner's "control panel" (Google Drive)

One Drive folder named **`DealWell`** containing:

1. **A Google Sheet** named `Products` with two tabs:
   - **`Products`** tab — one row per product (see format below).
   - **`Instructions`** tab — a short, plain-English reminder of the whole
     process: how to add a product, how to name a media file, where things go.
     (Added per owner request, so they can remember the workflow later.)
2. **A sub-folder named `Media`** — holds all images and videos.

### 2.1 Spreadsheet format (`Products` tab)

| Column        | Header        | Required | Notes |
|---------------|---------------|----------|-------|
| A | `#`           | yes | Product ID the owner controls: 1, 2, 3… Must be unique. Links media files to this product. |
| B | `Name`        | yes | Product name shown on the card. |
| C | `Category`    | yes | One category per product (e.g., Beauty, Home, Kitchen, Tech). Drives the filter tabs. |
| D | `Description` | no  | Short description shown on the card. |
| E | `Channel`     | yes | Amazon, TikTok, Shopee, etc. Drives the badge and button text ("View on Amazon →"). |
| F | `Link`        | yes | The affiliate URL. Opens in a new tab. |
| G | `Show`        | no  | `yes`/`no`. `no` (or blank interpreted per rule) hides the product without deleting the row. Default when blank: **shown**. |

Validation rules applied by the sync job:
- Rows missing `Name`, `Channel`, or `Link` are **skipped** (logged, not published).
- `Show` is case-insensitive; `no`/`false`/`0`/`hide` → hidden; anything else → shown.
- Duplicate `#` values: the first wins; later duplicates are skipped and logged.
- `Category` values are collected across all shown products to build the filter
  tabs automatically (plus an always-present "All Picks" tab).

### 2.2 Media naming convention (`Media` sub-folder)

Each media file's name **starts with the product's `#`**, followed by a separator
(`.`, `-`, or `_`) and an ordering key:

- `1.1.jpg`, `1.2.jpg`, `1.3.mp4` → media for product **1**
- `2.1.jpg`, `2.2.png` → media for product **2**

Rules:
- Supported images: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`.
- Supported videos: `.mp4`, `.mov`, `.webm`.
- Ordering: files are sorted naturally by name; the **first** file is the card
  cover. All files (in order) appear in the gallery lightbox.
- A product with **no** matching media gets a neutral placeholder cover.

---

## 3. The website (design & features)

**Visual direction:** Option C — Warm & Editorial.
- Palette: warm off-white background (`#fbf7f1`), near-black text (`#1f1b17`),
  gold accent (`#c08a4a`). Serif for the logo and product names (Georgia-style),
  clean sans-serif for body text.
- Dark/light: v1 ships the warm light theme only.

**Layout & components:**
- **Header:** `DealWell.` logo (gold dot), optional short tagline.
- **Category filter tabs:** "All Picks" + one tab per category found in the
  sheet. Clicking filters the grid instantly (client-side, no reload).
- **Search box:** filters cards by product name (client-side, instant).
- **Product grid:** responsive cards (3-up desktop, 2-up tablet, 1–2 up mobile).
  Each card: cover image, category · channel label, product name (serif),
  short description, and a `View on <Channel> →` button.
- **Gallery lightbox:** clicking a card's image opens an overlay showing all of
  that product's images/videos with left/right arrows and keyboard nav; videos
  play inline. The affiliate button is also present inside the lightbox.
- **Button behavior:** affiliate link opens in a new tab
  (`target="_blank" rel="nofollow sponsored noopener"`).
- **Footer:** affiliate disclosure line (e.g., "As an affiliate, DealWell earns
  from qualifying purchases."), required for Amazon Associates compliance.
- **Responsive & fast:** static HTML/CSS/JS, lazy-loaded images, no heavy
  framework.

**Data contract (frontend):** the site is static and reads a generated
`products.json` plus locally-hosted media under `/media/`. The frontend never
talks to Google directly.

`products.json` shape (produced by the sync job):
```json
{
  "generated_at": "2026-11-26T12:00:00Z",
  "products": [
    {
      "id": 1,
      "name": "Silk Hair Towel",
      "category": "Beauty",
      "description": "A gentle everyday upgrade we love.",
      "channel": "Amazon",
      "link": "https://amzn.to/xxxx",
      "media": [
        {"type": "image", "src": "media/1.1.jpg"},
        {"type": "image", "src": "media/1.2.jpg"},
        {"type": "video", "src": "media/1.3.mp4"}
      ]
    }
  ],
  "categories": ["Beauty", "Home", "Kitchen"]
}
```

---

## 4. Automated sync job

**Purpose:** on a schedule, read the Google Sheet + Drive `Media` folder, rebuild
`products.json`, download any new/changed media into the site's local `/media/`
folder, and publish to `dealwell.pro`.

**Cadence:** default **every 1 hour** (configurable).

**Steps each run:**
1. Read the `Products` tab → parse rows → apply validation rules → build the
   product list and category list.
2. List the `Media` folder → group files by leading `#` → attach ordered media
   to each product → pick cover.
3. Download media that is new or changed since last run into local `/media/`
   (cache by file id + modified time; skip unchanged files to save time/bandwidth).
4. Remove local media that no longer exists in Drive (optional cleanup).
5. Write `products.json`.
6. Deploy `products.json` + changed media to Hostinger (`dealwell.pro` web root).
7. Log a short summary (products published, skipped rows with reasons, media
   added/removed).

**Mechanism — primary vs fallback (to be confirmed during implementation):**
- **Primary:** a scheduled Claude Code cloud routine using the already-connected
  Google Drive / Google Sheets / Hostinger MCP connectors. Zero extra
  infrastructure; owner sets up nothing beyond sharing the folder.
- **Fallback (if connectors are unavailable in a headless/scheduled run):** a
  server-side build script running on Hostinger cron. It reads the Sheet via its
  "Publish to web" CSV link and lists the Drive `Media` folder via a free Google
  API key, caching media locally. Requires ~2 one-time setup steps from the owner
  (publish sheet, share folder, provide/create an API key).

The implementation plan MUST verify the primary mechanism actually runs
unattended **before** depending on it, and switch to the fallback if it does not.
Either way the owner's day-to-day workflow (edit Drive, done) is identical.

---

## 5. Hosting (Hostinger)

- Target: **dealwell.pro**, currently a Hostinger **Builder** site
  (no `public_html` web root).
- Action: convert/point `dealwell.pro` to standard web hosting on the existing
  plan (user `u115504887`, which already serves addon domains with `public_html`)
  so the custom static site + media can be deployed. Done by the implementer via
  the Hostinger connector.
- Web root will contain: `index.html`, `assets/` (css/js), `products.json`,
  `media/`.
- If converting the live Builder domain is risky, stage first on a Hostinger
  test subdomain, verify, then cut over `dealwell.pro`.

---

## 6. One-time setup required from the owner

- Share the `DealWell` Google Drive folder (sheet + `Media`) so the sync can read
  it (exact sharing settings provided during implementation).
- Approve the `dealwell.pro` hosting conversion.
- (Fallback path only) Publish the sheet to web and/or provide a Google API key —
  guided step-by-step if needed.

---

## 7. Instructions tab (content to seed into the sheet)

Short, plain-English reminder to place on the `Instructions` tab:

> **How DealWell works**
> 1. Each row on the **Products** tab is one product. Fill in: a unique number
>    (#), Name, Category, Description, Channel (Amazon/TikTok/…), and the
>    affiliate Link. Set **Show** to `no` to hide a product.
> 2. Put photos/videos in the **Media** folder. **Name each file starting with
>    the product's number**, then a dot and an order number:
>    `1.1.jpg`, `1.2.jpg`, `1.3.mp4` = media for product 1. The first one is the
>    cover; the rest show in the gallery.
> 3. That's it. The website **dealwell.pro** updates by itself every hour.

---

## 8. Open questions / risks

- **Connectors in scheduled runs** — primary risk; resolved by the verify-first
  rule in §4.
- **Drive media download limits** — mitigated by caching unchanged files.
- **Builder → standard hosting conversion** of `dealwell.pro` — mitigated by
  optional staging subdomain.

---

## 9. Future ideas (not in v1)

- Click analytics per product/channel.
- Prices with "was/now" discount display.
- Multiple affiliate links per product (e.g., same item on Amazon + TikTok).
- Dark theme toggle.
- Featured / "Deal of the week" section.
