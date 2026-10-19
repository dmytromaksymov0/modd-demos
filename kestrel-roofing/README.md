# Kestrel Roofing Co. — concept site

Live: **https://kestrel-roofing.pages.dev** · Portfolio demo by **modd.** — a lead-generation site for a fictional roofing company in Columbus, Ohio.
Astro 7 + Tailwind CSS 4, static build with one Cloudflare Pages Function for the lead form.

**Pages:** Home · Roof Replacement · Storm & Hail Damage · Roof Cost Calculator · Projects · About + Service Area · Free Inspection · Privacy · 404 · `/styleguide` (noindex)

**Signature features:** annotated “field report” photos · pitch picked from photos of real houses in the calculator ·
one-day replacement timeline · insurance claim in three lanes (You / Kestrel / Insurer) · two-step lead form with instant ZIP check.

**Lighthouse (mobile), every page:** Performance 98–100 · Accessibility 100 · Best Practices 100 · SEO 100 · CLS 0.
Full numbers and the competitor comparison: `docs/phase-6-final-report.md`.

---

## Requirements

- Node.js ≥ 22.22 (Astro 7). Tested on Node 25.
- A Cloudflare account for deployment. A Telegram bot for live lead delivery.

## Run locally

```bash
npm install
npm run dev            # http://localhost:4321
```

The form needs the Pages Function, which `astro dev` doesn’t run. To test the full site with the function:

```bash
cp .dev.vars.example .dev.vars    # then put your bot token and chat id in .dev.vars
npm run build
npx wrangler pages dev
```

## Project map

| What | Where |
|---|---|
| Design tokens (colours, type scale, spacing, radii) — the only place they are defined | `src/styles/tokens.css` |
| Company data, storm banner switch, service area & ZIPs, analytics switch | `src/config/site.ts` |
| Prices, extras, roof math (shared by home and calculator) | `src/lib/pricing.ts` |
| Lead validation + Telegram message | `src/lib/lead.ts` |
| Lead endpoint `POST /api/lead` | `functions/api/lead.ts` |
| Case studies | `src/data/projects.ts` |
| Components | `src/components/{ui,layout,patterns,home,brand}/` |
| Photos (+ credits) | `src/assets/photos/`, `CREDITS.md` |
| Logo SVGs, favicons, OG images | `public/brand/`, `public/*.png`, `public/og/` (regenerate: `node scripts/make-og.cjs`) |
| Phase docs, research, reports | `docs/`, `reports/`, `screenshots/` |

---

## Deploy to Cloudflare Pages

### Option A — Git integration (recommended)

1. Push the project to a GitHub/GitLab repository (`node_modules`, `dist`, `.dev.vars` are git-ignored).
2. Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git** → pick the repo.
3. Build settings:

   | Setting | Value |
   |---|---|
   | Framework preset | Astro |
   | Build command | `npm run build` |
   | Build output directory | `dist` |
   | Root directory | `/` (or `kestrel-roofing` if the repo holds all modd demos) |
   | Node version | from `.node-version` (22); or set `NODE_VERSION` = `22` |

4. **Settings → Variables and Secrets** → add, as *Secret*, for Production (and Preview if you want test leads there):

   | Variable | Value |
   |---|---|
   | `TELEGRAM_BOT_TOKEN` | Token from @BotFather |
   | `TELEGRAM_CHAT_ID` | Chat id the leads go to |

5. Save and **Retry deployment** (variables apply to new deployments only).
6. The `functions/` folder is picked up automatically — no extra config.

### Option B — Direct upload from your machine

```bash
npx wrangler login
npm run build
npx wrangler pages project create kestrel-roofing --production-branch main
npx wrangler pages secret put TELEGRAM_BOT_TOKEN --project-name kestrel-roofing
npx wrangler pages secret put TELEGRAM_CHAT_ID --project-name kestrel-roofing
npx wrangler pages deploy
```

`wrangler.toml` already sets the project name and `pages_build_output_dir = "./dist"`.

### Setting up the Telegram bot

1. In Telegram, message **@BotFather** → `/newbot` → copy the token.
2. Create a group for leads (or use a private chat), add the bot, send any message.
3. Open `https://api.telegram.org/bot<TOKEN>/getUpdates` and copy `chat.id` (group ids start with `-100…`).
4. Put both values in the Pages secrets above. Without them the endpoint answers `503` and the form asks the visitor to call.

### After the first deploy

- [ ] Submit a test lead on the live site → message arrives in Telegram.
- [ ] Custom domain: **Pages → Custom domains**, then update `site` in `astro.config.mjs` and the `Sitemap:` line in `public/robots.txt` (canonical URLs, sitemap and OG images use it) and redeploy.
- [ ] Submit `https://<domain>/sitemap-index.xml` in Google Search Console.
- [ ] Optional: turn on analytics in `src/config/site.ts` (`provider: 'plausible' | 'ga4'`).

---

## Tests and QA

```bash
npm test                     # 23 unit tests: pricing math, lead validation, Pages Function (mocked Telegram)
node scripts/e2e-lead.cjs    # 9 e2e checks: built site + wrangler pages dev + mock Telegram, with and without JS
npm run preview &            # then, against http://localhost:4321:
npm run qa                   # screenshots 375/768/1280/1920 + UI tests (54) + link check
node scripts/audit.cjs       # one h1, unique meta, alt text, visible keyboard focus, 44px touch targets
```

Lighthouse: `npx lighthouse http://localhost:4321/ --form-factor=mobile` (reports in `reports/`).

---

## What changes for a real client

Everything below is demo content. Confirm each item with the client in writing before launch.

### Must change

| Item | Where | Notes |
|---|---|---|
| Company name, phone, email, address, hours | `site` in `src/config/site.ts` | Demo phone `(614) 555-0142`, email `@kestrelroofing.example` |
| Contractor license number | `site.license` | Demo `#HIC-0000 (demo)`. Columbus licenses home-improvement contractors; Ohio has no state roofing license |
| Insurance amount | `site.insurance` | Demo “$2M general liability + workers’ comp” — use the client’s certificate |
| **Photos** | `src/assets/photos/` | Demo uses Unsplash/Pexels photos of real US homes and crews (mostly Texas/North Carolina, not Ohio) and one retouched image. Replace with the client’s own job photos; keep the annotated-photo format. Update `CREDITS.md` |
| **Reviews** | `src/data/projects.ts`, `src/components/home/Proof.astro` | Labelled *Sample review*. Replace with real Google reviews or an embedded widget, then remove the labels and the “Sample reviews — replaced…” line |
| **Case studies** | `src/data/projects.ts` | Six fictional jobs (towns, squares, days, who paid). Replace with real jobs |
| Company stats | `src/pages/about/index.astro` | “4 crews”, “≈ 380 roofs a year” are invented |
| Footer credit “Concept site · fictional company · designed & built by modd.” | `src/components/layout/Footer.astro` | Remove (or keep a small “site by modd.”) |
| Privacy policy | `src/pages/privacy/index.astro` | Remove the concept-site notice, add the client’s legal name and contact |
| Domain | `astro.config.mjs` (`site`), `public/robots.txt` | See “After the first deploy” |
| Lead delivery | Pages secrets | Client’s own Telegram bot/chat — or replace the `fetch` in `functions/api/lead.ts` with email (e.g. Resend), a CRM webhook or Google Sheets |

### Must confirm (promises the site makes)

| Promise | Where | Why it matters |
|---|---|---|
| **Nail bounty — “$25 for any nail we miss”** | `site.nailBounty` | Strong hook, but only if the client really pays it. Remove the badge and the timeline line if not |
| 25-year workmanship warranty, not prorated, transferable once | `site.warrantyYears`, `About → #warranty`, home warranty table | Must match the client’s written warranty |
| Financing 0% for 12 months | `site.financing` | Must match the lender’s terms and disclosures |
| Prices: shingle $475–650/square, metal $1,050–1,450/square, steep-roof surcharge | `RATES` in `src/lib/pricing.ts` | Drives the home mini-calculator, the calculator page and the replacement page |
| Extras: extra layer $45/sq, decking $85/sheet, skylight $250, cricket $450 | `EXTRAS` in `src/lib/pricing.ts` | Shown as fixed prices — must be the client’s real numbers |
| Repairs from $350 | Home scenarios, Roof Replacement | |
| Same-day tarping, callback within 2 business hours, inspection 30–45 min, photo report in 24 h, 48-h storm inspections | Copy across pages | Operational promises — the client’s team must keep them |
| Manufacturer certification | `site.certification` | Demo uses the generic “Manufacturer-Certified Master Installer”. Use a real program name (e.g. a manufacturer’s tier) only with proof |
| Insurance example ($16,000 / $4,000 / $1,000) and claim timings | `src/pages/storm-damage/index.astro`, `InsuranceLanes.astro` | Illustrative; keep the “example only” note |

### Switches and optional features

| Feature | Where | Default |
|---|---|---|
| Storm alert banner | `storm` in `src/config/site.ts` | **On** in the demo (Oct 14 hail, Dublin/Hilliard/Upper Arlington). Set `enabled: false` when there is no recent storm; edit date and areas after each event |
| Service area & ZIP codes | `serviceArea` in `src/config/site.ts` | 18 towns around Columbus; `storm: true` marks priority areas |
| **Before / after slider** | `src/components/patterns/BeforeAfter.astro` | Built, tested, shown only in `/styleguide`. Switch on in Projects **only with real pairs of the same house**. Never pair two different houses |
| Analytics (Plausible / GA4) | `analytics` in `src/config/site.ts` | Off — no third-party scripts. Successful leads fire `Lead` / `generate_lead` |
| Styleguide page | `src/pages/styleguide.astro` | Noindex; delete before handing over if the client doesn’t want it public |
