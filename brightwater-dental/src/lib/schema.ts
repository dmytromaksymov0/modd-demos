// JSON-LD helpers (schema.org). Facts come from src/config/site.ts — one source of truth.
import { site, hours, prices } from '../config/site.ts';
import { team } from '../data/team';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const hhmm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

export const dentist = (base: URL | undefined) => ({
  '@context': 'https://schema.org',
  '@type': 'Dentist',
  '@id': new URL('/#practice', base).href,
  name: site.name,
  url: new URL('/', base).href,
  image: new URL('/og/home.jpg', base).href,
  logo: new URL('/brand/brightwater-logo.svg', base).href,
  telephone: site.phone.href.replace('tel:', ''),
  email: site.email,
  priceRange: '$$',
  currenciesAccepted: 'USD',
  paymentAccepted: 'Cash, Credit Card, Dental insurance (PPO), HSA, FSA',
  knowsLanguage: ['en', 'es'],
  address: { '@type': 'PostalAddress', streetAddress: site.address.street, addressLocality: site.address.city, addressRegion: site.address.region, postalCode: site.address.zip, addressCountry: 'US' },
  areaServed: ['Mueller', 'Windsor Park', 'Cherrywood', 'Hyde Park', 'Upper Boggy Creek', 'Austin'].map((n) => ({ '@type': 'Place', name: `${n}, TX` })),
  openingHoursSpecification: hours.days.map((d) => ({ '@type': 'OpeningHoursSpecification', dayOfWeek: DAYS[d.day], opens: hhmm(d.open), closes: hhmm(d.close) })),
  employee: team.map((d) => ({ '@type': 'Person', name: d.name.replace(/, D[DM]{2}S?$/, ''), honorificSuffix: d.name.split(', ')[1], jobTitle: `Dentist — ${d.role}`, alumniOf: d.school })),
  makesOffer: [
    { '@type': 'Offer', name: 'New patient visit: exam, cleaning and X-rays', price: String(prices.newPatient), priceCurrency: 'USD' },
    { '@type': 'Offer', name: 'Emergency exam with one X-ray', price: String(prices.emergencyExam), priceCurrency: 'USD' },
    { '@type': 'Offer', name: 'Brightwater Plan (adult, monthly)', price: String(prices.planAdult), priceCurrency: 'USD' },
  ],
});

const strip = (html: string) => html.replace(/<[^>]+>/g, '');
export const faqSchema = (items: readonly { q: string; a: string }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: items.map((i) => ({ '@type': 'Question', name: i.q, acceptedAnswer: { '@type': 'Answer', text: strip(i.a) } })),
});

export const breadcrumbs = (base: URL | undefined, trail: { name: string; path: string }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [{ name: 'Home', path: '/' }, ...trail].map((t, i) => ({ '@type': 'ListItem', position: i + 1, name: t.name, item: new URL(t.path, base).href })),
});
