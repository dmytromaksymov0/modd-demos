# ТОРК Автосервіс — концепт-сайт

Адрес после деплоя: **https://tork-avtoservis.pages.dev** · Демо для портфолио **modd.**
Сайт вымышленного автосервиса на Салтовке (Харьков, с 2014 года) на украинском языке. Главное действие на сайте — запись.
Astro 7 + Tailwind CSS 4, статическая сборка и одна Cloudflare Pages Function для заявок.

**Страницы:**
- Головна, Послуги и 5 страниц услуг (Діагностика, Ходова, ТО та заміна мастила, Гальма, Кондиціонер);
- Калькулятор, Як ми працюємо, Ціни, Контакти;
- Дякуємо, Приватність, 404, `/styleguide` (noindex).

**Фирменные моменты**
- **«Ремонт у чаті»** — процесс как переписка с мастером. В кошторисе посетитель сам выбирает «Робимо / Відкласти», итог пересчитывается, а выбор попадает в заявку.
- **Калькулятор «від Lanos до Land Cruiser»** — класс авто × любые из 22 работ. Совмещённые операции дешевле (колодки + диски, амортизатори + стойки…). Расчёт переносится в заявку, сервер пересчитывает его сам.
- **«Що турбує?»** — человек описывает симптом своими словами, и подсвечивается нужная услуга.
- Ещё:
  - цены по классам A–D с липкой шапкой нормо-часов;
  - схема проезда от м. «Студентська» (SVG);
  - живой статус «Відчинено до 19:00» по киевскому времени;
  - плашка «Працюємо під час відключень: генератор + Starlink».

**Lighthouse (mobile), все индексируемые страницы:** Performance 99–100 · Accessibility 100 · Best Practices 100 · SEO 100 · LCP 1,5–2,0 с · CLS 0 · вес 103–266 КБ.
Полные цифры и сравнение с пятью реальными СТО Харькова и Киева — в `docs/phase-6-final-report.md`.

---

## Требования
- Node.js ≥ 22.22 (Astro 7). `.node-version` фиксирует 22 для Cloudflare. Локально проверено на Node 25.
- Для живых заявок: аккаунт Cloudflare и Telegram-бот (можно подключить позже — см. ниже).

## Запуск
```bash
npm install
npm run dev
```

`astro dev` не запускает функцию заявок. Сайт целиком вместе с функцией:
```bash
cp .dev.vars.example .dev.vars
npm run build
npx wrangler pages dev dist
```
В `.dev.vars` (в git не попадает) — токен бота и chat id. Без них форма честно отвечает «не вдалося надіслати» с телефоном и мессенджерами.

## Карта проекта
| Что | Где |
|---|---|
| Дизайн-токены: цвета, шрифты, шкала, отступы, запасные шрифты | `src/styles/tokens.css`, `src/styles/fonts.css` |
| Факты бизнеса: телефон, адрес, график, ставки классов A–D, гарантия, мессенджеры, аналитика | `src/config/site.ts` |
| Работы, нормативы, фиксированные цены, совмещённые операции | `src/data/works.ts` |
| Пример кошториса (Forester) | `src/data/estimate.ts` |
| Тексты страниц услуг, FAQ | `src/data/servicePages.ts`, `src/data/services.ts`, `src/data/faq.ts` |
| Логика калькулятора, кошториса, графика | `src/lib/calc.ts`, `src/lib/estimate.ts`, `src/lib/hours.ts` (UI: `src/lib/home-ui.ts`) |
| Валидация заявки и текст сообщения в Telegram | `src/lib/lead.ts` |
| Функция `POST /api/lead` | `functions/api/lead.ts` |
| schema.org: AutoRepair, FAQPage, BreadcrumbList | `src/lib/schema.ts` |
| Компоненты | `src/components/{ui,layout,patterns,home,page}/` |
| Фото и авторы | `src/assets/photos/`, `CREDITS.md` |
| Логотип, иконки, OG-картинки, схема проезда | `public/brand/`, `public/*.png`, `public/og/` (`npm run og`), `public/maps/tork-schema.svg` |
| Шрифты (свои подмножества Science Gothic + Onest) | `public/fonts/`, сборка — `npm run fonts` из `design/fonts-src/` |
| Документы фаз: исследование, направление, отчёты | `docs/` (скриншоты и HTML Lighthouse — локально в `screenshots/`, `reports/`) |

---

## Деплой на Cloudflare Pages — только через Git-интеграцию
Сайт живёт в общем репозитории `dmytromaksymov0/modd-demos` (ветка `main`), в папке `tork-avtoservis/`.
Деплой **только** через Git-интеграцию Pages. Не используйте Direct Upload и `wrangler pages deploy` для нового проекта: такой проект потом нельзя подключить к Git.

1. Дашборд Cloudflare → **Workers & Pages → Create → Pages → Import an existing Git repository** (не мастер Workers) → `dmytromaksymov0/modd-demos`.
2. Настройки сборки:

   | Параметр | Значение |
   |---|---|
   | Project name | **`tork-avtoservis`** — совпадает с `name` в `wrangler.toml`. Адрес `tork-avtoservis.pages.dev` проверен curl 20.10.2026: ответа нет (`000`), имя свободно |
   | Production branch | `main` |
   | Framework preset | Astro |
   | Root directory | **`tork-avtoservis`** |
   | Build command | `npm run build` |
   | Build output directory | `dist` |
   | Переменная окружения | `NODE_VERSION` = `22` |
   | Build watch paths (Settings → Builds) | include **`tork-avtoservis/*`** — чтобы коммиты в другие демо не пересобирали этот сайт |

3. `functions/` Cloudflare подхватывает сам. `public/_headers` задаёт заголовки безопасности и долгий кеш для `/_astro/*`.
4. **Если адрес получил суффикс** (например `tork-avtoservis-xyz.pages.dev`): поменяйте `site` в `astro.config.mjs` и строку `Sitemap:` в `public/robots.txt` на фактический адрес, затем запушьте.

### Telegram-бот (можно позже)
Пока секретов нет, функция отвечает `503`. Форма показывает «Не вдалося надіслати заявку. Запишемо вас інакше:» с телефоном, Telegram и Viber — и с JS, и без JS. Ошибки 500 и потерянных заявок без объяснения нет.

1. В Telegram: **@BotFather** → `/newbot` → скопировать токен.
2. Создать группу для заявок (или взять личный чат), добавить бота, написать любое сообщение.
3. Открыть `https://api.telegram.org/bot<TOKEN>/getUpdates` и взять `chat.id` (у групп он начинается с `-100…`).
4. Pages → **Settings → Variables and Secrets** → добавить как *Secret* (Production; при желании и Preview):

   | Переменная | Значение |
   |---|---|
   | `TELEGRAM_BOT_TOKEN` | токен от @BotFather |
   | `TELEGRAM_CHAT_ID` | id чата для заявок |

   Или из терминала: `npx wrangler pages secret put TELEGRAM_BOT_TOKEN --project-name tork-avtoservis` (так же для `TELEGRAM_CHAT_ID`).
5. **Deployments → Retry deployment** — секреты применяются только к новым деплоям.
6. Отправить одну тестовую заявку с живого сайта.

Что приходит мастеру:
- телефон в формате `+380 XX XXX-XX-XX`, имя, авто, «що турбує»;
- как ответить: Telegram, Viber или дзвінок;
- расчёт калькулятора (класс, работы, сумма, экономия) — пересчитан на сервере;
- выбор по кошторису;
- страница, с которой пришла заявка, и время по Києву.

### После первого деплоя
- [ ] Lighthouse на живом адресе, OG-превью ссылки в Telegram.
- [ ] Свой домен: **Pages → Custom domains**, затем `site` в `astro.config.mjs` и `Sitemap:` в `public/robots.txt`.
- [ ] Google Search Console: отправить `https://<домен>/sitemap-index.xml`. Google Business Profile с тем же названием, адресом, телефоном и графиком.
- [ ] Аналитика (по желанию): `src/config/site.ts` → `analytics.provider = 'plausible' | 'ga4'`.

---

## Тесты и QA
```bash
npm test
npm run build && npm run e2e
npm run preview
```
- `npm test` — 40 unit-тестов: калькулятор и совмещения, кошторис, график, телефоны и валидация, сообщение, функция с mock Telegram.
- `npm run e2e` — 17 проверок: собранный сайт + 2 × `wrangler pages dev` (с mock Telegram и без секретов), с JS и без JS.

Пока `npm run preview` работает, в другом терминале прогоните проверки на http://localhost:4321:
```bash
npm run qa
```
```bash
npm run qa:fonts
```
```bash
node scripts/clip-check.cjs
```
```bash
npm run audit
```
- `npm run qa` — скриншоты 320/375/768/1280/1920 всех страниц, горизонтальный скролл, консоль, CTA на первом экране, focus; интерактив (24 + 13 проверок); ссылки и якоря.
- `npm run qa:fonts` — CLS, когда шрифты приходят на 1,5 с позже.
- `node scripts/clip-check.cjs` — обрезанный текст внутри окон фасада.
- `npm run audit` — один h1, `lang`, длина и уникальность title/description, alt, JSON-LD, порядок заголовков, видимый фокус на каждой остановке Tab, цели ≥ 44 px.

---

## Що змінюється для реального клієнта
Усе нижче — демо-контент. Більшість фактів зібрано в одному-двох файлах.

| Що | Зараз (демо) | Для реального сервісу | Де |
|---|---|---|---|
| Фото майстрів | Стокові моделі Pexels (Artem Podrez → «Олег», Gustavo Fring → «Андрій»), форма тонована в один синій | Пів дня зйомки в реальному цеху: портрет кожного майстра на одному тлі + 2–3 кадри в роботі, бокс, підйомник, ресепшн. Справжні імена, стаж, спеціалізація | `src/assets/photos/`, `CREDITS.md`, `src/components/home/Masters.astro`, `src/components/patterns/FacadeHero.astro`, `src/data/servicePages.ts` (автор фотозвіту) |
| Фото деталей у фотозвітах | Стокові кадри дисків, колодок, пильника | Реальні фото з ремонтів (з дозволу клієнтів, без номерів авто) | `src/assets/photos/report-*`, `src/components/home/RepairChat.astro` |
| Відгуки | «Приклади відгуків — замінимо на реальні відгуки з Google при запуску» | Реальні відгуки з Google Business Profile (вбудувати або цитати з дозволу) | `src/components/home/Masters.astro` |
| Адреса | Вигадана вул. Ремісна, 14 (перевірено: такої вулиці в Харкові немає) | Справжня адреса — однаково на сайті, в Google Business Profile і schema.org | `src/config/site.ts` |
| Карта й маршрут | Схема SVG «не в масштабі», маршрут від м. «Студентська»; Google Maps і Waze ведуть до станції метро | Перемалювати схему під реальну адресу, посилання Google Maps / Waze — на точку сервісу, де заїзд | `public/maps/tork-schema.svg`, `src/pages/kontakty/index.astro` |
| Телефон | +380 57 000-14-14 (явно демонстраційний) | Реальний номер; перевірити `tel:` на мобільному | `src/config/site.ts` |
| Telegram / Viber | Кнопки «Telegram / Viber» обирають канал у формі; прямі посилання для «не вдалося надіслати» прив’язані до демо-номера (`t.me/+380570001414`, `viber://chat?number=…`) | Посилання на акаунт менеджера: `https://t.me/<username>` і `viber://chat?number=%2B380…` | `src/config/site.ts` → `messengers` |
| Куди йдуть заявки | Telegram-бот (секрети не підключені) | Бот у робочу групу сервісу; за потреби — CRM | Pages → Variables and Secrets, `functions/api/lead.ts` |
| Реквізити | ФОП «ТОРК» (демо), ЄДРПОУ і IBAN нулями | Справжні реквізити ФОП / ТОВ, з ПДВ чи без | `src/pages/kontakty/index.astro` |
| Ціни | Нормо-година 800 / 950 / 1 100 / 1 300 ₴ (класи A–D), 22 роботи з нормативами, фіксовані ціни на діагностику, 5 суміщених операцій | Прайс сервісу; обіцянка «ціна з калькулятора = ціна роботи в чеку» має відповідати реальній політиці | `src/config/site.ts` (ставки), `src/data/works.ts` |
| Гарантія | 12 міс / 10 000 км на роботу й наші запчастини; на запчастини клієнта — тільки на роботу | Реальні умови гарантії, як у заказ-наряді | `src/config/site.ts` → `warranty`, тексти FAQ |
| Графік | Пн–Пт 8:30–19:00, Сб 9:00–16:00, Нд вихідний | Реальний графік (живий статус рахує його сам) | `src/config/site.ts` → `hours` |
| Відключення світла | Генератор + Starlink, під час тривоги роботи на підйомнику призупиняються | Лише те, що справді є | `src/config/site.ts`, `src/pages/kontakty/index.astro` |
| Аналітика | Вимкнена | Plausible або GA4 (+ повідомлення про cookies для GA4) | `src/config/site.ts` → `analytics` |
| Приватність | Текст для концепт-сайту | Політика, перевірена юристом | `src/pages/pryvatnist/index.astro` |
| Футер | «Concept site · fictional company · designed & built by modd.» | Прибрати | `src/components/layout/Footer.astro` |
| Домен | `tork-avtoservis.pages.dev` | Свій домен | `astro.config.mjs`, `public/robots.txt` |
