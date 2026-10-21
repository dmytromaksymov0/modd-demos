// «Хочу так само»: each work links a photo to a master, a service and a shade.
// `alt` / `title` describe only what is in the frame (CREDITS.md «Що в кадрі»).
import type { Group } from './services';
import type { ShadeId } from './shades';
export interface Work { id: string; photo: string; title: string; alt: string; group: Group; service: string; master: string; shade?: ShadeId }

export const works: Work[] = [
  { id: 'w1', photo: 'svc-manicure', title: 'Вишня з втиркою', alt: 'Короткі нігті, вишневий гель-лак, на одному нігті втирка з блиском', group: 'manicure', service: 'mani-coat', master: 'olena', shade: 'vyshnia' },
  { id: 'w2', photo: 'work-nude-almond', title: 'Нюдовий мигдаль', alt: 'Довгий нюдовий мигдаль, рука на білому', group: 'manicure', service: 'mani-ext', master: 'daryna', shade: 'pudra' },
  { id: 'w3', photo: 'work-nude-hands', title: 'Молочні овали', alt: 'Руки з молочними нігтями овальної форми на білій тканині', group: 'manicure', service: 'mani-coat', master: 'sofiia', shade: 'moloko' },
  { id: 'w4', photo: 'work-nude-soft', title: 'Короткий нюд', alt: 'Рука з короткими нюдовими нігтями в теплому світлі', group: 'manicure', service: 'mani-strong', master: 'marta', shade: 'pudra' },
  { id: 'w5', photo: 'work-french-ring', title: 'Френч на мигдалі', alt: 'Френч на мигдалевих нігтях, рука з каблучкою', group: 'manicure', service: 'mani-coat', master: 'olena', shade: 'french' },
  { id: 'w6', photo: 'work-pedi-milk', title: 'Молочний педикюр', alt: 'Ступні згори, молочний педикюр на бежевому пледі', group: 'pedicure', service: 'pedi-coat', master: 'marta', shade: 'moloko' },
  { id: 'w7', photo: 'work-brows-freckles', title: 'Густі природні брови', alt: 'Густі брови й веснянки крупним планом', group: 'brows', service: 'brows-lam', master: 'iryna' },
  { id: 'w8', photo: 'work-nude-fluffy', title: 'Нюд на білому пледі', alt: 'Нюдові нігті на білому хутряному пледі', group: 'manicure', service: 'mani-coat', master: 'daryna', shade: 'pudra' },
  { id: 'w9', photo: 'work-lashes-result', title: 'Довгі вії, погляд угору', alt: 'Погляд угору, довгі вії', group: 'lashes', service: 'lash-lam', master: 'alina' },
  { id: 'w10', photo: 'work-pedi-milk-2', title: 'Молочні пальчики', alt: 'Ступні з молочним педикюром на бежевому пледі', group: 'pedicure', service: 'pedi-toes', master: 'daryna', shade: 'moloko' },
  { id: 'w11', photo: 'work-brows-natural', title: 'Природна форма брів', alt: 'Око й брова крупним планом, природна форма', group: 'brows', service: 'brows-shape', master: 'iryna' },
  { id: 'w12', photo: 'work-french-red', title: 'Френч на квадраті', alt: 'Френч на довгих нігтях квадратної форми, червоне тло', group: 'manicure', service: 'mani-ext', master: 'daryna', shade: 'french' },
];

/** Home «Хочу так само»: 8 works, no two neighbours with the same shade at 2, 3 or 4 columns (checked by brute force). */
export const homeOrder = ['w1', 'w2', 'w3', 'w5', 'w7', 'w9', 'w4', 'w6'];

/** «Роботи» page: all 12. No same-shade neighbours horizontally at 2, 3 and 4 columns and vertically at 3 and 4
 *  (a full 2/3/4-column solution doesn't exist with 3 × pudra, 3 × moloko, 2 × french — checked by backtracking). */
export const galleryOrder = ['w1', 'w10', 'w11', 'w12', 'w2', 'w5', 'w3', 'w7', 'w6', 'w4', 'w9', 'w8'];
