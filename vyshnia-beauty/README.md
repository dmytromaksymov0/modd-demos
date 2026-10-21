# Вишня, студія краси — концепт-сайт

Демо-сайт для портфоліо веб-студії **modd.**: вигадана студія манікюру, педикюру, брів і вій у центрі Харкова. Українською.

- **Головне:** онлайн-запис за 4 кроки на першому екрані (послуга → майстриня → день/час → контакти) з підсумком, ціною (топ-майстриня +20 %), кольором покриття й датою гарантії (візит + 21 день).
- **Фірмові моменти:** запис за 4 кроки · «Хочу так само» (стрічка робіт з фільтром → запис з тією ж майстринею й кольором) · «Пакет відкривають при вас» (стерильність як ритуал).
- **Стек:** Astro 7 + Tailwind CSS 4, статична збірка, Cloudflare Pages + Pages Function `functions/api/lead.ts` → Telegram.
- **Сторінки:** `/`, `/poslugy/`, `/maistry/`, `/roboty/`, `/sterylnist/`, `/sertyfikaty/`, `/kontakty/`, `/zapys/`, `/pryvatnist/`, `/zapysano/` (дякуємо, noindex), `/404`, `/styleguide/` (noindex).
- Адреса проєкту: **https://vyshnia-beauty.pages.dev** (імʼя однакове в Cloudflare, `wrangler.toml`, `astro.config.mjs`, `public/robots.txt`).

## Локально

```bash
npm ci
npm run build
npx wrangler pages dev dist      # сайт + /api/lead на http://localhost:8788
```

Без `.dev.vars` форма показує чесне «не вдалося надіслати» з телефоном і Telegram (503) — так і має бути до підключення бота. Щоб перевірити відправку, скопіюйте `.dev.vars.example` у `.dev.vars` і заповніть.

| Скрипт | Що робить |
|---|---|
| `npm test` | юніт-тести: запис (ціни, слоти, гарантія), заявка, сертифікат, сама Function (25) |
| `npm run e2e` | форма → Function → mock Telegram (піднімає свій wrangler на :8793), запис з JS і без, сертифікат |
| `npm run test:home` | сценарії запису на головній (потрібен `wrangler pages dev dist --port 8791`) |
| `npm run qa` | скриншоти 375 / 768 / 1280 / 1920 (+320), горизонтальний скрол, текст < 13 px, цілі < 44 px, перший екран запису |
| `npm run links` | краулер: усі внутрішні посилання й якорі |
| `npm run og` | OG-картинки `public/og/*.jpg` і PNG-фавіконки |
| `npm run fonts` / `logo` / `photos` | сабсети шрифтів, вордмарк зі шрифтових контурів, кропи й ретуш фото (з `design/`) |

## Деплой на Cloudflare Pages — тільки через Git-інтеграцію

Сайт живе в теці `vyshnia-beauty/` репозиторію `dmytromaksymov0/modd-demos` (гілка `main`). **Не використовувати Direct Upload** (`wrangler pages deploy` у новий проєкт) — такий проєкт потім не підключити до GitHub.

1. Код закомічено й запушено в `main`.
2. Pages-проєкт `vyshnia-beauty` створюється з Git-джерелом (API або дашборд → Workers & Pages → Create → Pages → **Import an existing Git repository**):
   - Production branch: `main`
   - Root directory: `vyshnia-beauty`
   - Build command: `npm run build`
   - Build output: `dist`
   - Environment variable: `NODE_VERSION` = `22` (також є `.node-version`)
   - Build watch paths: `vyshnia-beauty/*`
3. Після цього кожен пуш у `main`, що змінює `vyshnia-beauty/`, публікує сайт.
4. Якщо адреса отримала суфікс (`vyshnia-beauty-xxx.pages.dev`), замінити `site` в `astro.config.mjs`, `public/robots.txt`, `public/llms.txt`.

### Telegram — потім

Секрети вводить власник (не в код):

```bash
npx wrangler pages secret put TELEGRAM_BOT_TOKEN --project-name vyshnia-beauty
```

```bash
npx wrangler pages secret put TELEGRAM_CHAT_ID --project-name vyshnia-beauty
```

Або в дашборді: Pages → vyshnia-beauty → Settings → Variables and secrets. Після додавання — **Retry deployment** останнього деплою. До цього форма працює чесно: JSON 503 з повідомленням і телефоном, без JS — 303 на блок «Не вдалося надіслати».

## Що змінюється для реального клієнта

| Що | Зараз (демо) | Для клієнта |
|---|---|---|
| **Фото майстринь** | «руки за роботою» зі стоків (Pexels / Unsplash), без облич | портретна зйомка команди в одному світлі + реальні кадри за роботою |
| **Роботи й Instagram** | 12 стокових робіт, статичний блок Instagram | роботи майстринь; стрічка через Instagram Graph API (або ручне оновлення `src/data/works.ts`) |
| **Відгуки** | «Приклади відгуків» з плашкою | реальні відгуки Google (вручну або через Places API), плашку прибрати |
| **Ціни й послуги** | рівень центру Харкова, жовтень 2026 | прайс студії в `src/data/services.ts` (топ = ×1.2 рахується сам) |
| **Майстрині** | 6 вигаданих, вихідні в `DAY_OFF` | реальні імена, стаж, графік у `src/data/masters.ts` і `src/lib/booking.ts` |
| **Слоти запису** | детерміновані демо-слоти | інтеграція з CRM студії (Altegio / EasyWeek / Google Calendar) або підтвердження адміністратором, як зараз |
| **Адреса, телефон, месенджери** | вул. Фарфорова, 7 (вигадана), 057 000 21 21, `@vyshnia_demo` | `src/config/site.ts`, схема маршруту `src/components/page/RouteScheme.astro`, `public/llms.txt` |
| **Сертифікати** | заявка адміністраторці, оплата посиланням | платіжний сервіс (LiqPay / monobank acquiring) і генерація PDF |
| **Стерильність** | стокові фото сухожару й крафт-пакета | фото власного процесу студії (сухожар, пакети з датою, індикатор) |
| **Аналітика** | заготовка вимкнена | GA4 або Plausible + події запису |
| **Футер** | «Concept site · fictional company · designed & built by modd.» | прибрати |

Фото й автори — `CREDITS.md`. Звіти по фазах — `docs/`.
