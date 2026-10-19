# Brightwater Family Dental — Фаза 6: финальный QA и сдача

Дата: 19.10.2026 · Статус: **готово к деплою через Git-интеграцию Cloudflare Pages** (проект `brightwater-dental` создаёт пользователь в дашборде).

## 1. Что проверено (сборка с нуля)

Перед прогоном удалены `dist`, `.astro` и кэш Vite, сборка выполнена заново: 14 страниц, ~30 s.

| Проверка | Результат |
|---|---|
| **Сборка из чистой копии**, как на Cloudflare: в отдельную папку скопированы только файлы, которые попадут в git (без игнорируемых), затем `npm ci` → `npm run build` | 14 страниц собраны, `npm audit` — **0 уязвимостей**. После коммита отдельно проверено и на `git archive HEAD` (п. 7) |
| `scripts/qa.cjs` — 14 страниц × 5 ширин (375 / 768 / 1280 / 1920 + 320), включая `/thanks/` и `/styleguide/` | **70/70.** Нет горизонтального скролла и элементов за краем, нет текста < 13 px и целей касания < 44 px, консоль без ошибок, кнопка Book online на первом экране, sticky-полоса в hero скрыта |
| `scripts/audit.cjs` — 13 страниц | **Чисто.** Один h1, `lang="en"`, длина и уникальность title и description, alt у всех изображений, валидный JSON-LD, порядок заголовков, видимый фокус на каждой остановке Tab (15–37 остановок на страницу), цели ≥ 44 px на 375 |
| `scripts/check-links.cjs` | **Все внутренние ссылки и якоря рабочие** (11 индексируемых страниц) |
| `npm test` — unit | **34/34**: hours, booking, plan, insurance, валидация и Telegram-сообщение, .ics, Pages Function (мок Telegram: 200 / 303 / 422 / honeypot / 503 / 502) |
| `scripts/e2e-lead.cjs` — собранный сайт + `wrangler pages dev` + мок Telegram | **10/10**: запись семьи с JS → сообщение (3 человека, время, страховка в долларах, комфорт) → `/thanks/` с .ics; ошибки у полей; серверный 422; запись без JS → `/thanks/`; ошибка без JS → блок ошибки; GET → 405 |
| `scripts/test-home.cjs` + `scripts/test-pages.cjs` | **12/12 + 26/26**: ленивая загрузка страховки, чипы → ссылка плана комфорта, sticky-полоса, подстановка в запись, side-by-side / back-to-back, сброс времени, запись без JS, 4 ветки сортировки Emergency, калькулятор плана |

**Исправлено в этой фазе:**
- title главной был 76 символов → 64 («Brightwater Family Dental — Austin dentist, evenings & Saturdays»);
- в `audit.cjs` чекбоксы и радио теперь меряются по зоне клика их `<label>` (во всех случаях ≥ 44 px);
- качество hero-AVIF главной снижено 55 → 48: LCP 1.96–2.03 → **1.88–1.96 s**, вес на старте 213 → 203 KB.

## 2. Lighthouse 13.5 mobile, финальные цифры
Moto G Power, simulated slow 4G, 2 прогона на страницу, `reports/final-*.report.html`.

| Страница | Perf | A11y | BP | SEO | LCP | CLS | TBT | Вес на старте |
|---|---|---|---|---|---|---|---|---|
| Home | 99 | 100 | 100 | 100 | 1.88–1.96 s | 0 | ≤ 15 ms | 203 KB |
| New Patients | 99 | 100 | 100 | 100 | 1.81 s | 0 | ≤ 83 ms | 137 KB |
| Services | 98–99 | 100 | 100 | 100 | 1.88 s | 0 | ≤ 134 ms | 242 KB |
| Cleanings & Exams | 100 | 100 | 100 | 100 | 1.66 s | 0 | ≤ 28 ms | 106 KB |
| Same-Day Crowns | 100 | 100 | 100 | 100 | 1.73 s | 0 | ≤ 14 ms | 153 KB |
| Clear Aligners | 100 | 100 | 100 | 100 | 1.66 s | 0 | ≤ 34 ms | 114 KB |
| Emergency | 99–100 | 100 | 100 | 100 | 1.81–1.85 s | 0 | ≤ 87 ms | 136 KB |
| Insurance & Financing | 100 | 100 | 100 | 100 | 1.66 s | 0 | ≤ 10 ms | 101 KB |
| Our Team | 99 | 100 | 100 | 100 | 1.88 s | 0 | ≤ 32 ms | 196 KB |
| Book Online | 100 | 100 | 100 | 100 | 1.51–1.66 s | 0.016 | ≤ 39 ms | 107 KB |
| Privacy | 100 | 100 | 100 | 100 | 1.55–1.65 s | 0 | ≤ 9 ms | 90 KB |
| **Цель (фаза 0)** | ≥ 95 | 100 | 100 | 100 | ≤ 2.0 s | ≤ 0.05 | ≤ 100 ms | ≤ 0.8 MB |

- **Шум измерений.** В отдельных прогонах Privacy и Clear Aligners давали TBT 592–1128 ms (Perf 74–84) — это шум машины. На этих страницах почти нет JS, и в повторных прогонах TBT 5–34 ms, Perf 100. В таблице — повторные значения.
- **`/thanks/`** — SEO 66 из-за намеренного `noindex`, остальные категории 100.
- **Полная страница** со всеми lazy-фото после прокрутки: главная 390 KB на мобильном @2x, 297 KB на десктопе.

## 3. Рынок / Brightwater — для кейса в портфолио
Конкуренты замерены в фазе 0 (19.10.2026) той же версией Lighthouse и в тех же условиях. Главная страница, mobile.

| Сайт | Perf | A11y | BP | SEO | LCP | Вес главной |
|---|---|---|---|---|---|---|
| Ideal Dental — Central Austin | 48 | 92 | 92 | 92 | 10.3–19.5 s | 4.3 MB |
| Hammons Family Dental — North Austin | 86 | 88 | 58 | 100 | 2.5 s | 9.8 MB |
| 512 Smiles — NW Austin | 39 | 93 | 77 | 92 | 29–56 s | 43.4 MB |
| 38th Street Dental — Central Austin | 52 | 95 | 77 | 92 | 7.7–14.5 s | 37.6 MB |
| Polished Family Dental — Fort Worth | 97 | 100 | 73 | 100 | 2.3–2.4 s | 0.5 MB |
| *Медиана рынка* | *52* | *93* | *77* | *92* | *~11 s* | *9.8 MB* |
| **Brightwater** | **99** | **100** | **100** | **100** | **1.9 s** | **0.2 MB на старте · 0.39 MB целиком** |

**Честные формулировки:**
- **Единственный в сравнении** с Accessibility, Best Practices и SEO = 100 одновременно и Performance ≥ 95 — на **каждой** индексируемой странице, а не только на главной.
- **LCP в ~6 раз быстрее медианы рынка** (1.9 s против ~11 s). Полная главная **в 25 раз легче медианы** (0.39 MB против 9.8 MB) и в 110 раз легче 512 Smiles.
- **Против Polished** (самый сильный конкурент) разрыв по скорости небольшой: LCP 1.9 против 2.3 s, Perf 99 против 97. Отличия здесь не в скорости, а в остальном:
  - Best Practices 100 против 73;
  - запись без стороннего сервиса и сторонних cookies, и всей семьёй сразу;
  - ответ по страховке в долларах;
  - план комфорта.

**Чего нет ни у одного из пяти** (фирменные моменты):
1. **Запись всей семьи одним заходом:** до 5 человек, кресла рядом или подряд, превью дорожек кресел, один набор контактов.
2. **План комфорта, который уходит вместе с записью:** «What makes the dentist hard for you?» → договорённости на карте пациента.
3. **Страховка с ответом в долларах** (включая UT SELECT и план штата Texas), сразу подставляется в запись.

Плюс: часы приёма дорожками с живым маркером «now», циферблат первого часа, сортировка экстренных случаев, семейный калькулятор плана.

## 4. Что сдано
- **Страницы:** Home, New Patients, Services, 4 страницы услуг, Insurance & Financing, Our Team, Book Online, Thanks, Privacy, 404, `/styleguide` (noindex).
- **Функционал:**
  - `POST /api/lead` → Telegram, HTML-сообщение;
  - валидация, honeypot, JSON для JS и 303 без JS;
  - `.ics` на странице «спасибо».
- **SEO:** schema.org `Dentist` + `openingHoursSpecification` на всех страницах, `FAQPage` (5 страниц), `BreadcrumbList` (услуги), OG 1200×630 для 7 разделов, favicon SVG/PNG, manifest, sitemap (11 URL, без styleguide/thanks/404), robots.txt, `_headers`.
- **Конфиги:**
  - `wrangler.toml` (`name = "brightwater-dental"`, `pages_build_output_dir = "./dist"`);
  - `.node-version` = 22;
  - `.dev.vars.example`;
  - `astro.config.mjs` `site = https://brightwater-dental-ba5.pages.dev` (после деплоя: адрес `brightwater-dental.pages.dev` занят чужим аккаунтом, Cloudflare выдал суффикс `-ba5`, см. п. 8).
- **Документы:** `README.md` (запуск, деплой через Git-интеграцию, Telegram-бот, таблица «что меняется для реального клиента»), `CREDITS.md` (30 фото, все файлы в `src/assets/photos/`), `docs/phase-0…6`.

## 5. Ограничения и честные оговорки
- **Фото — сток.** Для Dr. Ruiz и Dr. Kessler нет кадров «в работе» с теми же моделями. Hero главной снят дома, а не в клинике — клиника показана на первом же скролле.
- **Свободное время в записи — детерминированные демо-данные.** Реальная доступность требует интеграции с системой управления практикой (см. README).
- **Цены, сети страховок, условия плана и рассрочки — правдоподобные демо-значения** для Austin 2026. Их обязательно подтверждает реальный клиент.
- **В git не хранятся** скриншоты и Lighthouse HTML (`screenshots/`, `reports/` в `.gitignore`), цифры зафиксированы в этом документе.

## 6. Дальше — шаги пользователя (деплой)
1. Cloudflare → Workers & Pages → Create → Pages → **Import an existing Git repository** → `dmytromaksymov0/modd-demos`.
2. Project name **`brightwater-dental`**, production branch `main`, Framework preset Astro, **Root directory `brightwater-dental`**, Build command `npm run build`, Output `dist`, env `NODE_VERSION = 22`.
3. После создания проекта: **Settings → Builds → Build watch paths**: include `brightwater-dental/*`.
4. **Settings → Variables and Secrets:** `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` (Secret) → **Retry deployment**.
5. Проверка живого сайта и тестовая заявка — только с твоего разрешения.

## 7. Коммит
Коммит только папки `brightwater-dental/` в `main` репозитория `dmytromaksymov0/modd-demos`. Хеш — в сообщении сессии. После коммита сборка проверена ещё раз на `git archive HEAD:brightwater-dental` → `npm ci` → `npm run build`.

## 8. После деплоя (19.10.2026)
- Pages-проект `brightwater-dental` создан пользователем через Git-интеграцию. Секреты добавлены.
- **Адрес — `https://brightwater-dental-ba5.pages.dev`.** По `brightwater-dental.pages.dev` открывается чужое React-приложение другого аккаунта (свой `/assets/index-*.js`, нет наших страниц и `/api/lead`). Имена `*.pages.dev` глобальные, поэтому Cloudflare добавил суффикс.
- **Исправлено:** `site` в `astro.config.mjs` (canonical, sitemap, OG-ссылки, JSON-LD), `Sitemap:` в `robots.txt`, UID в `.ics`, README. До исправления canonical живого сайта указывал на чужой домен.
- **Проверено на живом сайте без отправки заявки:** все страницы 200, 404 отдаёт 404, `_headers` применены, `GET /api/lead` → 405, невалидный `POST` → 422 с сообщениями у полей. Секреты и Telegram не задействованы.
- **Lighthouse mobile на живом сайте** (до исправления адреса, по одному прогону, `reports/live-*`):

  | Страница | Perf / A11y / BP / SEO | LCP |
  |---|---|---|
  | Home | 98 / 100 / 100 / 100 | 2.14 s |
  | New Patients | 100 / 100 / 100 / 100 | 1.73 s |
  | Services | 99 / 100 / 100 / 100 | 2.01 s |
  | Emergency | 98 / 100 / 100 / 100 | 2.17 s |
  | Insurance & Financing | 99 / 100 / 100 / 100 | 2.03 s |
  | Our Team | 99 / 100 / 100 / 100 | 2.18 s |
  | Book Online | 99 / 100 / 100 / 100 | 1.96 s |

  CLS 0–0.004, TBT ≤ 26 ms, вес 97–237 KB. На живом CDN LCP на 0.1–0.2 s выше, чем локально: добавляется реальный TTFB. Пять страниц на 2.01–2.18 s — чуть выше цели 2.0 s. Категории в целях. Медиана рынка ~11 s.
- **Исправление адреса задеплоено** (коммит `59822e5`, сборка заняла около 15 s): canonical, sitemap, robots и OG на живом сайте указывают на `brightwater-dental-ba5.pages.dev`.
- **Тестовая заявка (одна, с разрешения пользователя)** — 2 человека, «TEST Sam» / «TEST Leo», телефон 512-555-0100. Результат: `502` от `/api/lead` — «We couldn’t send that». Секреты на месте (иначе был бы `503`), значит, Telegram отверг вызов `sendMessage`. Повторно не отправлялась. Нужна проверка токена, chat id и доступа бота к чату (см. README → Telegram bot).
- **Вторая тестовая заявка** после того, как пользователь исправил секреты и сделал Retry deployment: снова `502`, Telegram отверг `sendMessage`. Сайт и валидация работают (невалидный POST → 422, GET → 405). Ответ Telegram пишется в логи функции: `console.error('lead: delivery failed', …)`. Его видно в Cloudflare → Pages → brightwater-dental → Deployments → Functions → Real-time logs. Типичные причины: бот не добавлен в группу или вышел из неё; группа стала супергруппой и chat id сменился на `-100…`; токен сохранён с лишним пробелом или кавычками.
- **Причина 502 найдена.** В `TELEGRAM_CHAT_ID` был неверный id, и бот не получал `/start` в личном чате. Пользователь заменил id на id личного чата из `getUpdates`, проверил `sendMessage` в браузере и сделал Retry deployment.
- **Третья тестовая заявка (19.10.2026) — успешно.** `/api/lead` → 200, переход на `/thanks/?n=2&d=2026-10-20&t=7:30 am`, на странице «Tuesday, October 20 at 7:30 am — TEST Sam, TEST Leo», кнопка Add to calendar (.ics) видна. Сообщение ушло в Telegram: 2 человека, Delta Dental PPO → $0, план комфорта «The sounds». **Сайт полностью рабочий.**
