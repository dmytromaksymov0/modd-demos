# Credits — ТОРК Автосервіс (concept site)

## Фото на сайті — `src/assets/photos/` (фаза 2, перевірено зумом 20.10.2026)
Pexels License: безкоштовно для комерційного використання, атрибуція не обов’язкова — вказуємо з поваги.
Обробка: `design/phase-2/process_photos.py` (кадрування; у серії Artem Podrez синій комбінезон приглушено до тону серії Gustavo Fring, щоб двоє майстрів читалися як одна команда).

| Файл | Автор | Джерело | Обробка / що перевірено |
|---|---|---|---|
| `derzhprom-bridges.jpg` | Constantin Ch | https://www.pexels.com/photo/23881456/ | Кадр праворуч від центру: емблема на даху лишається поза кадром |
| `derzhprom-facade-low.jpg` | Constantin Ch | https://www.pexels.com/photo/23881456/ | Нижня частина фасаду, без даху |
| `derzhprom-square.jpg` | Constantin Ch | https://www.pexels.com/photo/23881455/ | Без змін |
| `oleg-portrait.jpg` | Artem Podrez | https://www.pexels.com/photo/8985713/ | Колір форми; плакат на фоні нечитабельний (розмитий) |
| `oleg-full.jpg` | Artem Podrez | https://www.pexels.com/photo/8986176/ | Колір форми |
| `oleg-lift.jpg` | Artem Podrez | https://www.pexels.com/photo/8986068/ | Колір форми |
| `oleg-engine.jpg` | Artem Podrez | https://www.pexels.com/photo/8985455/ | Колір форми |
| `andrii-portrait.jpg` | Gustavo Fring | https://www.pexels.com/photo/6870303/ | Без змін |
| `andrii-measure.jpg` | Gustavo Fring | https://www.pexels.com/photo/6870304/ | Без змін |
| `andrii-brakes.jpg` | Gustavo Fring | https://www.pexels.com/photo/6870319/ | Без змін |
| `andrii-tablet.jpg` | Gustavo Fring | https://www.pexels.com/photo/6870308/ | Без змін; логотипа на планшеті не видно |
| `bay-04.jpg` | Artem Podrez | https://www.pexels.com/photo/8985723/ | Колір форми; видно шильдик Subaru (марка авто, не чужий бізнес) |
| `bay-clean.jpg` | Renee Razumov | https://www.pexels.com/photo/33814736/ | Без змін; дрібний напис на жовтому пилососі нечитабельний |
| `report-disc.jpg` | Gustavo Fring | https://www.pexels.com/photo/6870299/ | Без змін |
| `report-hub-boot.jpg` | Sandeep Singh | https://www.pexels.com/photo/8651900/ | Без змін |
| `report-old-drum.jpg` | Phe Di Mônaco | https://www.pexels.com/photo/31040178/ | Без змін |
| `report-underbody.jpg` | Magda Ehlers | https://www.pexels.com/photo/37175105/ | Обрізано ліворуч: вивіска чужого сервісу |
| `bay-04-wide.jpg` | Artem Podrez | https://www.pexels.com/photo/8985723/ | Фаза 3: горизонтальний кроп для чату; колір форми |
| `oleg-wheel.jpg` | Artem Podrez | https://www.pexels.com/photo/8985660/ | Фаза 4: «Ходова»; обрізано вгорі ліворуч табличку з логотипом; колір форми |
| `oleg-suspension.jpg` | Artem Podrez | https://www.pexels.com/photo/8985614/ | Фаза 4: огляд підвіски знизу; колір форми |
| `oleg-under-lift.jpg` | Artem Podrez | https://www.pexels.com/photo/8985618/ | Фаза 4: фотозвіт 13:05 (Олег під авто); колір форми |
| `ac-panel.jpg` | Vladimir Srajber | https://www.pexels.com/photo/28490734/ | Фаза 4: «Кондиціонер» — панель клімату в салоні, без бренду авто |

Імена майстрів («Олег», «Андрій») вигадані; на фото — стокові моделі. Для реального клієнта — фотосесія справжніх майстрів.

**Не використовуються на сайті** (залишені в `src/assets/photos/`, бо їх збирають `design/phase-2/process_photos.py` і `make_board.py`; у збірку не потрапляють): `report-underbody.jpg` (іржаве днище — «гаражна» естетика), `oleg-lift.jpg`, `derzhprom-facade-low.jpg`.

**Відбраковано при перевірці:** 8986130 і 8986145 (Artem Podrez — російськомовні плакати й табличка «Внимание к деталям»), 13065690 (пляшка Shell), 4116193 / 4116198 (бренд сканера Autel MaxiSys), 6870309 (бренд підйомника на колоні), 6870326 (бренд планшета), 10490609 (темний кадр, червоно-чорне поло), 4022543 / 34277924 / 34277926 (тюнінг-гальма — не наша аудиторія), Unsplash 1625047509168 (читається бренд шин, інша форма).

## Шрифти (SIL Open Font License 1.1)
- **Science Gothic** — заголовки, таблички, великі цифри. **Onest** — текст і всі цифри. Обидва з `@fontsource-variable`, сабсети `public/fonts/*.woff2` (скрипт `design/phase-2/subset_fonts.py`).

## Іконки
- Lucide (ISC License) — інлайн SVG, `src/components/ui/Icon.astro`.

---

# Фаза 1 — превʼю напрямів (`design/phase-1/`), не на сайті

## Фото (Pexels License — бесплатно для коммерческого использования, без обязательной атрибуции; указываем из уважения)

Фаза 1 — превью направлений (`design/phase-1/photos/`). Не финальный отбор: подборка — в фазе 2.

| Файл | Автор | Источник | Где используется |
|---|---|---|---|
| `a-bay-wide.jpg` (кроп из `pexels-8986145.jpg`) | Artem Podrez | https://www.pexels.com/photo/8986145/ | A · десктоп hero. Кадр обрезан: справа убрана табличка на русском языке с логотипом, слева — плакат |
| `a-bay-tall.jpg` (кроп из `pexels-8985723.jpg`) | Artem Podrez | https://www.pexels.com/photo/8985723/ | A · мобильный hero |
| `b-measure.jpg` (кроп из `pexels-6870299.jpg`) | Gustavo Fring | https://www.pexels.com/photo/6870299/ | B · строка кошторису (замір гальмівного диска) |
| `b-arch.jpg` (кроп из `pexels-6870319.jpg`) | Gustavo Fring | https://www.pexels.com/photo/6870319/ | B · строка кошторису |
| `c-bay.jpg` (из `pexels-33814736.jpg`) | Renee Razumov | https://www.pexels.com/photo/33814736/ | C · фото боксу |

Второй заход (D, E, F):

| Файл | Автор | Источник | Где используется |
|---|---|---|---|
| `d-derzhprom.jpg` (кроп из `pexels-23881456.jpg`) | Constantin Ch | https://www.pexels.com/photo/23881456/ | D · вежа «Держпром» (переходи між корпусами) |
| `e-oleg.jpg` (кроп из `pexels-8985713.jpg`) | Artem Podrez | https://www.pexels.com/photo/8985713/ | E, F · «Олег» |
| `e-andrii.jpg` (кроп из `pexels-6870303.jpg`) | Gustavo Fring | https://www.pexels.com/photo/6870303/ | E, F · «Андрій» |
| `e-viktor.jpg` (кроп из `pexels-3855478.jpg`) | Andrea Piacquadio | https://www.pexels.com/photo/3855478/ | E, F · «Віктор» |
| `e-andrii-tablet.jpg` (кроп из `pexels-6870326.jpg`) | Gustavo Fring | https://www.pexels.com/photo/6870326/ | не используется: на планшете читается бренд |

Также скачаны как кандидаты (в превью не используются): Artem Podrez 8986119, 8986130, 8986148, 8985971, 8985967, 8985702; Gustavo Fring 6870304, 6870317; Constantin Ch 23881455; Sergey Mart 13377065; cottonbro studio 7006684.

Имена мастеров («Олег», «Андрій», «Віктор») вымышлены; на фото — стоковые модели. Для реального клиента — фотосессия настоящих мастеров.

## Шрифты (SIL Open Font License 1.1, self-hosted из @fontsource)
- Unbounded, Onest — направление A
- Source Serif 4, IBM Plex Sans — направление B
- Commissioner, Arsenal — направление C
- Science Gothic, Finlandica — направления D и F
- Noto Serif Display, Akt — направление E

## Иконки
- Lucide (ISC License) — инлайн SVG.
