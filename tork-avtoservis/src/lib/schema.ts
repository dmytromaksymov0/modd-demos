// JSON-LD helpers (schema.org). Facts come from src/config/site.ts — one source of truth.
import { site, hours, carClasses } from '../config/site.ts';
import { works } from '../data/works.ts';
import { workPrice } from './calc.ts';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const hhmm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

export const autoRepair = (base: URL | undefined) => ({
  '@context': 'https://schema.org',
  '@type': 'AutoRepair',
  '@id': new URL('/#business', base).href,
  name: site.name,
  description: 'Автосервіс на Салтівці: діагностика, ходова, ТО та заміна мастила, гальма, кондиціонер. Кошторис у Telegram до ремонту, фотозвіт, старі деталі — клієнту.',
  url: new URL('/', base).href,
  image: new URL('/og/home.jpg', base).href,
  logo: new URL('/brand/tork-logo.svg', base).href,
  telephone: site.phone.href.replace('tel:', ''),
  email: site.email,
  foundingDate: String(site.since),
  priceRange: '₴₴',
  currenciesAccepted: 'UAH',
  paymentAccepted: 'Cash, Credit Card, Invoice',
  knowsLanguage: ['uk'],
  address: { '@type': 'PostalAddress', streetAddress: site.address.street, addressLocality: site.address.city, addressRegion: 'Харківська область', postalCode: site.address.zip, addressCountry: 'UA' },
  areaServed: ['Салтівка', 'Північна Салтівка', "П'ятихатки", 'Олексіївка', 'Харків'].map((name) => ({ '@type': 'Place', name })),
  openingHoursSpecification: hours.days.map((d) => ({ '@type': 'OpeningHoursSpecification', dayOfWeek: DAYS[d.day], opens: hhmm(d.open), closes: hhmm(d.close) })),
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Ціна роботи, клас A (Lanos, Aveo, Logan)',
    itemListElement: works.map((w) => ({
      '@type': 'Offer',
      itemOffered: { '@type': 'Service', name: w.label },
      price: String(workPrice(w, carClasses[0].rate)),
      priceCurrency: 'UAH',
    })),
  },
  warranty: { '@type': 'WarrantyPromise', durationOfWarranty: { '@type': 'QuantitativeValue', value: site.warranty.months, unitCode: 'MON' } },
});

const strip = (html: string) => html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ');
export const faqSchema = (items: readonly { q: string; a: string }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: items.map((i) => ({ '@type': 'Question', name: i.q, acceptedAnswer: { '@type': 'Answer', text: strip(i.a) } })),
});

export const breadcrumbs = (base: URL | undefined, trail: { name: string; path: string }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [{ name: 'Головна', path: '/' }, ...trail].map((t, i) => ({ '@type': 'ListItem', position: i + 1, name: t.name, item: new URL(t.path, base).href })),
});
