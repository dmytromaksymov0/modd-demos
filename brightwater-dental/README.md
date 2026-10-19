# Brightwater Family Dental — concept site

Live: **https://brightwater-dental-ba5.pages.dev** · Portfolio demo by **modd.**
A booking-first site for a fictional three-dentist family practice in Mueller, Austin, Texas.
Astro 7 + Tailwind CSS 4, static build with one Cloudflare Pages Function for booking requests.

**Pages:** Home · New Patients · Services + Cleanings & Exams · Same-Day Crowns · Clear Aligners · Emergency Dentistry · Insurance & Financing · Our Team · Book Online · Thanks · Privacy · 404 · `/styleguide` (noindex)

**Signature features**
- **Family booking** — book up to five people in one go: side by side in up to three chairs, or back-to-back; live chair-lanes preview; one set of contact details.
- **Comfort plan** — “What makes the dentist hard for you?” → agreed comforts (headphones, stop signal, numbing gel first, sedation consult) travel with the booking.
- **Insurance in dollars** — pick your carrier and plan type and get an answer in dollars (“$0 for your cleaning”), marked “Estimate only”, which then pre-fills the booking.
- Also: a 60-minute dial for the first visit (New Patients), symptom triage (Emergency), a family calculator for the $29/$19 membership plan, opening hours drawn as pool lanes with a live “now” marker.

**Lighthouse (mobile), every indexable page:** Performance 99–100 · Accessibility 100 · Best Practices 100 · SEO 100 · LCP ≤ 1.96 s · CLS ≤ 0.016.
Full numbers and the comparison with five real Texas competitors: `docs/phase-6-final-report.md`.

---

## Requirements

- Node.js ≥ 22.22 (Astro 7). `.node-version` pins 22 for Cloudflare. Tested locally on Node 25.
- A Cloudflare account and a Telegram bot for live booking delivery.

## Run locally

```bash
npm install
npm run dev            # http://localhost:4321
```

The booking form posts to the Pages Function, which `astro dev` doesn’t run. To test the full site with the function:

```bash
cp .dev.vars.example .dev.vars    # put your bot token and chat id in .dev.vars (git-ignored)
npm run build
npx wrangler pages dev dist
```

## Project map

| What | Where |
|---|---|
| Design tokens (colours, type scale, spacing, radii, shadow) — the only place they are defined | `src/styles/tokens.css` |
| Practice facts: name, phone, address, **hours**, **prices**, nav, analytics switch | `src/config/site.ts` |
| Dentists | `src/data/team.ts` · Service pages content: `src/data/services.ts` |
| Booking logic: visit types, open days, side-by-side slots (demo availability) | `src/lib/booking.ts` (UI: `src/lib/book-ui.ts`) |
| Insurance networks and answers in dollars | `src/lib/insurance.ts` |
| Membership plan calculator (cash prices) | `src/lib/plan.ts` |
| Booking validation + Telegram message | `src/lib/lead.ts` |
| Booking endpoint `POST /api/lead` | `functions/api/lead.ts` |
| schema.org (Dentist, FAQPage, BreadcrumbList) | `src/lib/schema.ts` |
| Components | `src/components/{ui,layout,patterns,home,page,brand}/` |
| Photos (+ credits) | `src/assets/photos/`, `CREDITS.md` |
| Logo, favicons, OG images | `public/brand/`, `public/*.png`, `public/og/` — regenerate with `npm run og` and `python3 design/phase-2/make_logo.py` |
| Phase docs (research, direction, reports) | `docs/` (screenshots and Lighthouse HTML stay local in `screenshots/`, `reports/`) |

---

## Deploy to Cloudflare Pages — Git integration only

This site lives in the shared repository `dmytromaksymov0/modd-demos` (branch `main`), folder `brightwater-dental/`.
Deploy **only** through the Pages Git integration. Do not use Direct Upload / `wrangler pages deploy` for a new project — such a project can’t be connected to Git later.

1. Cloudflare dashboard → **Workers & Pages → Create → Pages → Import an existing Git repository** (not the Workers wizard) → pick `dmytromaksymov0/modd-demos`.
2. Build settings:

   | Setting | Value |
   |---|---|
   | Project name | **`brightwater-dental`** (fixed; matches `name` in `wrangler.toml`). The subdomain `brightwater-dental.pages.dev` is owned by another Cloudflare account, so Pages assigned **`brightwater-dental-ba5.pages.dev`** — that address is `site` in `astro.config.mjs` and the `Sitemap:` line in `public/robots.txt` |
   | Production branch | `main` |
   | Framework preset | Astro |
   | Root directory | **`brightwater-dental`** |
   | Build command | `npm run build` |
   | Build output directory | `dist` |
   | Environment variable | `NODE_VERSION` = `22` |
   | Build watch paths (Settings → Builds) | include **`brightwater-dental/*`** so commits to other demos don’t rebuild this site |

3. **Settings → Variables and Secrets** → add as *Secret* (Production; Preview too if you want test bookings there):

   | Variable | Value |
   |---|---|
   | `TELEGRAM_BOT_TOKEN` | token from @BotFather |
   | `TELEGRAM_CHAT_ID` | chat id the bookings go to |

   Or from the terminal: `npx wrangler pages secret put TELEGRAM_BOT_TOKEN --project-name brightwater-dental` (same for `TELEGRAM_CHAT_ID`).
4. **Deployments → Retry deployment** — secrets apply to new deployments only.
5. `functions/` is picked up automatically. `public/_headers` sets security headers and long caching for `/_astro/*`.

### Telegram bot

1. In Telegram, message **@BotFather** → `/newbot` → copy the token.
2. Create a group for bookings (or use a private chat), add the bot, send any message.
3. Open `https://api.telegram.org/bot<TOKEN>/getUpdates` and copy `chat.id` (group ids start with `-100…`).
4. Put both values in the Pages secrets. Without them `/api/lead` answers `503` and the form asks the visitor to call.

A booking message lists: number of people, day and time (side by side / back-to-back) or the preferred time window, each person with their visit type, the contact with a tap-to-call link, insurance with the expected cost, the chosen dentist and the comfort plan.

### After the first deploy

- [ ] Send one test booking on the live site → the message arrives in Telegram.
- [ ] Custom domain: **Pages → Custom domains**; then update `site` in `astro.config.mjs` and the `Sitemap:` line in `public/robots.txt`, and push.
- [ ] Submit `https://<domain>/sitemap-index.xml` in Google Search Console; claim the Google Business Profile with the same name, address, phone and hours.
- [ ] Optional analytics: `src/config/site.ts` → `analytics.provider = 'plausible' | 'ga4'`.

---

## Tests and QA

```bash
npm test                     # 34 unit tests: hours, booking slots, plan, insurance, booking validation, .ics, Pages Function (mocked Telegram)
npm run build && npm run e2e # 10 e2e checks: built site + wrangler pages dev + mock Telegram, with and without JS
npm run preview &            # then, against http://localhost:4321:
npm run qa                   # screenshots 375/768/1280/1920 (+320 overflow) on every page, UI tests (12 + 26), link check
node scripts/audit.cjs       # one h1, title/description length & uniqueness, alt, JSON-LD, visible keyboard focus, 44px targets
```

---

## What changes when this becomes a real client’s site

Everything below is demo content. Most of it lives in one or two files.

| Area | Now (demo) | For the real practice | Where |
|---|---|---|---|
| Name, address, phone, email, hours | Fictional; `555` phone; fictional street in Mueller | Real NAP — must match the Google Business Profile exactly | `src/config/site.ts` |
| Dentists | Three fictional dentists, stock models | Real names, schools, licences, photos (shoot in the office: head-and-shoulders on one background + one “at work” shot each) | `src/data/team.ts`, `src/assets/photos/team-*` |
| Photos | Pexels / Unsplash stock (credited) | A half-day shoot in the real office: rooms, front desk, real patients with releases, the family hero | `src/assets/photos/`, `CREDITS.md` |
| Reviews | Two sample reviews labelled “Sample review — replaced with real Google reviews at launch” | Real Google reviews (embed or curated quotes with permission) | `src/pages/index.astro`, `SampleReview.astro` |
| Online booking availability | Deterministic demo slots (`isTaken` hash) | Practice-management integration (e.g. NexHealth, Open Dental, Dentrix API) for real chair availability; otherwise keep “request a time” wording | `src/lib/booking.ts`, `functions/api/lead.ts` |
| Where bookings go | Telegram | Telegram and/or the PMS, email, SMS confirmation (Twilio) | `functions/api/lead.ts` |
| Insurance networks | Demo list incl. UT SELECT and State of Texas Dental Choice | The practice’s actual in-network PPOs; confirm DHMO/Medicaid policy | `src/lib/insurance.ts` |
| Prices | $99 first visit, $59 emergency exam, crowns from $1,150, aligners from $3,900 / $129 mo | The practice’s fee schedule | `src/config/site.ts`, `src/lib/plan.ts` (cash prices), `src/data/services.ts` |
| Membership plan | $29 adult / $19 kid per month, terms written as demo (“cancel anytime after three months”) | Real plan terms, legal review, enrollment link | `src/config/site.ts`, Insurance & Financing page |
| Financing | “0% for 12 months, on approved credit” example | Real lender (CareCredit / Cherry / Sunbit), representative example required by the lender | Insurance & Financing, service pages |
| Sedation | Nitrous + oral (TSBDE Level 2) | The dentists’ actual permit levels | `src/data/team.ts`, comfort copy |
| Comfort amenities | Headphones, weighted blankets, shades, stop signal | Only what the office really offers | `ComfortPanel.astro`, `src/pages/book/index.astro` |
| Language | “Hablamos español” (one dentist) | Keep only if true; consider a Spanish version | Header, footer, team |
| Analytics & consent | Off | Plausible or GA4; cookie notice if GA4 | `src/config/site.ts` |
| Privacy page | Concept-site wording | Lawyer-reviewed policy incl. HIPAA notice of privacy practices | `src/pages/privacy/index.astro` |
| Footer disclaimer | “Concept site · fictional company · designed & built by modd.” | Remove | `src/components/layout/Footer.astro` |
| Domain | `brightwater-dental-ba5.pages.dev` | Custom domain | `astro.config.mjs`, `public/robots.txt` |
