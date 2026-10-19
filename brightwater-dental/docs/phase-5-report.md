# Brightwater Family Dental — Фаза 5: функционал

Дата: 19.10.2026 · Статус: **готово, ждёт «ок» на фазу 6**. Ничего не закоммичено и не задеплоено.

## 0. Правки фазы 4
1. **/team.** Hero теперь — три единых портрета с именами и специализациями (ссылки на профили ниже). Barton Springs перенесён ниже, в блок «Why “Brightwater” — Named after the springs we swim in.», перед правилами практики.
2. **Emergency.** Кадр «держится за щёку» заменён спокойным: Dr. Holloway (та же модель, что на `/team`) настраивает свет над спокойным пациентом в светлом кабинете (Pexels, Kaboompics). `CREDITS.md` обновлён. Старый кадр остаётся только в файлах, на сайте не используется.

## 1. Отправка записи → Telegram
`functions/api/lead.ts` (Cloudflare Pages Function) + `src/lib/lead.ts` (чистая валидация и форматирование, общие для функции и тестов).

- **Вход.** JSON от виджета записи или обычная форма без JS. Повторяющиеся `comfort` (чекбоксы) собираются в массив.
- **Валидация** с понятными сообщениями у полей:
  - **имя первого человека**;
  - **до 5 человек** с допустимыми типами визита;
  - **слот:** рабочий день, внутри часов приёма, от сегодня (по Остину) до +60 дней, время в формате `9:30 am`. Без JS вместо слота — «preferred»: first / evening / saturday / day;
  - **контакты:** имя, 10-значный номер США (не с 0 или 1), email — необязательный, но корректный.
- **Мусорные значения не ломают заявку.** Неизвестные страховка, врач и пункты комфорта молча нормализуются.
- **Honeypot** `company` → ответ «успех» для бота, в Telegram ничего не уходит.
- **Ответы:**
  - JSON-клиенту: `200 {ok, thanks}` / `422 {errors}` / `503` (нет секретов) / `502` (Telegram недоступен, в тексте — «позвоните нам»);
  - без JS: `303` на `/thanks/?…` или на `/book/?error=1#form-error` (блок ошибки показывается через `:target`);
  - `GET` → `405`.
- **Сообщение в Telegram (HTML):**
  - сколько человек;
  - день и время, side by side или back-to-back;
  - каждый человек с типом визита;
  - контакт с `tel:`-ссылкой;
  - страховка с ответом в долларах («Cigna (PPO) — $0 typical cost…»);
  - выбранный врач;
  - план комфорта («The sounds → headphones; Out of control → stop signal; Ask about sedation»);
  - время отправки по Остину.

  Весь пользовательский текст экранируется.
- **Секреты** — `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` из env Pages. Их вводишь ты, в фазе 6. `TELEGRAM_API_BASE` нужен только для тестов.
- **Виджет записи:**
  - перед отправкой проверка на клиенте: время выбрано, имя, телефон, email;
  - отправляет JSON;
  - ошибки сервера показывает у полей (`aria-invalid`, текст в `role="alert"`) и ставит фокус на первое проблемное поле;
  - пока идёт запрос — «Sending…»;
  - при успехе — переход на `/thanks/`.

## 2. `/thanks/`
- Показывает «Saturday, October 24 at 9:30 am — Sam, Leo, Mia» (имена из sessionStorage, если есть) и «What happens next» в 4 шага.
- **Add to calendar:** `.ics` собирается в браузере (`src/lib/ics.ts`). Часовой пояс America/Chicago, статус TENTATIVE, длительность — до окончания последнего визита группы.
- Без JS — общий текст «Got it. We’ll text you to confirm».
- `noindex`, без sticky-полосы, исключён из sitemap и robots.

## 3. SEO и метаданные
- **schema.org на каждой странице:** `Dentist`. В нём:
  - адрес, телефон, email;
  - `openingHoursSpecification` по дням из `src/config/site.ts`: Mon–Thu 07:30–19:00, Fri 07:30–15:00, Sat 08:00–14:00;
  - районы, языки en/es;
  - 3 врача (`employee`, alumniOf);
  - офферы $99 / $59 / $29.
- **`FAQPage`** — на всех страницах с FAQ, из тех же данных, что видимый FAQ. **`BreadcrumbList`** — на 4 страницах услуг.
- **OG-картинки 1200×630** (`scripts/make-og.cjs` → `public/og/`): home, new-patients, services, emergency, insurance-financing, team, book. Логотип, заголовок, канат, фото, плашка с фактом. Каждая страница получает свою, плюс `twitter:card`.
- **Favicon:** `favicon.svg`, `favicon-32.png`, `apple-touch-icon.png`, `icon-512.png`, `site.webmanifest`.
- **Sitemap:** `sitemap-index.xml` — 11 страниц, без `/styleguide`, `/thanks`, 404.
- **`robots.txt`:** `Disallow: /styleguide/` и `/thanks/`, `Sitemap: https://brightwater-dental.pages.dev/sitemap-index.xml`.
- **`public/_headers`:** nosniff, referrer-policy, permissions-policy, X-Frame-Options, immutable-кэш для `/_astro/*`.
- **Аналитика:** заготовка в `src/config/site.ts` (`provider: 'none'`). Подключение — при продаже.

## 4. Конфиги
- `wrangler.toml`: `name = "brightwater-dental"`, `pages_build_output_dir = "./dist"`.
- `.node-version` = 22, `.dev.vars.example` с заглушками; `.dev.vars` в `.gitignore`.
- `package.json` scripts: `test`, `e2e`, `og`, `qa`.
- `npm audit` — 0 уязвимостей.

## 5. Тесты
| Набор | Что проверяет | Итог |
|---|---|---|
| `node --test tests/*.test.ts` | `hours` (формат, статус, время Остина), `booking` (дни без воскресенья, детерминированность, side-by-side в разных креслах, закрытие, час запаса, back-to-back для 4+, подстановка из URL), `plan` (2+2 → $328), `insurance` (6 веток ответа), `lead` (нормализация, honeypot, ошибки по полям, слот вне часов, в прошлом или через 60+ дней, режим без JS, экранирование, `.ics`), **функция** (JSON → Telegram, форма без JS → 303 с массивом comfort, 422, ошибка без JS → 303, honeypot, 503, 502) | **34/34** |
| `scripts/e2e-lead.cjs` — собранный сайт + `wrangler pages dev` + мок Telegram | Запись семьи с JS (подстановка из URL → время → отправка → сообщение с 3 людьми, временем, страховкой в долларах, комфортом → `/thanks/` с рабочим `.ics`); телефон с ошибкой → текст у поля, ничего не отправлено; подделанное время вне часов → 422 у выбора времени; **без JS**: форма → `/thanks/` с «Saturday morning» и двумя пунктами комфорта; ошибка без JS → блок ошибки; GET → 405 | **10/10** |
| `scripts/test-home.cjs` + `scripts/test-pages.cjs` | Ленивая загрузка страховки, чипы, sticky-полоса, запись, сортировка, калькулятор | **12/12 + 26/26** |
| `scripts/check-links.cjs` | Все внутренние ссылки и якоря | **OK** |
| `scripts/qa.cjs` — 13 страниц × 5 ширин (375 / 768 / 1280 / 1920 / 320) | Нет горизонтального скролла и элементов за краем, нет текста < 13 px и целей < 44 px, консоль без ошибок | **65/65** |

## 6. Lighthouse 13.5 mobile, 2 прогона (`reports/p5-*`)

| Страница | Perf | A11y | BP | SEO | LCP | CLS | Вес |
|---|---|---|---|---|---|---|---|
| Home | 99 | 100 | 100 | 100 | 1.96 s | 0 | 213 KB |
| New Patients | 99–100 | 100 | 100 | 100 | 1.81 s | 0 | 137 KB |
| Services | 99 | 100 | 100 | 100 | 1.88 s | 0 | 242 KB |
| Cleanings & Exams | 100 | 100 | 100 | 100 | 1.65 s | 0 | 106 KB |
| Same-Day Crowns | 100 | 100 | 100 | 100 | 1.73 s | 0 | 153 KB |
| Clear Aligners | 100 | 100 | 100 | 100 | 1.66 s | 0 | 114 KB |
| Emergency | 100 | 100 | 100 | 100 | 1.81 s | 0 | 136 KB |
| Insurance & Financing | 100 | 100 | 100 | 100 | 1.66 s | 0 | 101 KB |
| Our Team | 99 | 100 | 100 | 100 | 1.88 s | 0 | 196 KB |
| Book Online | 96–100 | 100 | 100 | 100 | 1.58–1.66 s | 0.004 | 107 KB |
| Privacy | 100 | 100 | 100 | 100 | 1.66 s | 0 | 91 KB |
| Thanks | 99–100 | 100 | 100 | 66* | 1.66 s | 0 | 92 KB |

\* `/thanks/` — `noindex` намеренно. Все индексируемые страницы — SEO 100.

Все цели фазы 0 выполнены. По-прежнему впритык: LCP главной 1.96 s.

## 7. Что останется на фазу 6
- **Финальный QA-прогон и отчёт; README:** деплой через Git-интеграцию Pages (Root directory `brightwater-dental`, Build output `dist`, `NODE_VERSION=22`, watch paths `brightwater-dental/*`), env и секреты.
- **Список «что меняется при продаже клиенту»:**
  - фото команды и клиники;
  - отзывы → Google;
  - адрес, телефон, часы;
  - реальное расписание (API) вместо демо-слотов;
  - список сетей страховок и цены;
  - аналитика;
  - уровень разрешения на седацию.
- **Коммит и пуш — только по твоему «ок».** Pages-проект `brightwater-dental` создаёшь ты в дашборде («Import an existing Git repository»), секреты вводишь сам, тестовую заявку отправляю только с твоего разрешения.
