// JSON-LD helpers.
import { site, serviceArea } from '../config/site';

export const business = (url?: string) => ({
  '@context': 'https://schema.org',
  '@type': 'RoofingContractor',
  name: site.name,
  url,
  telephone: '+1-614-555-0142',
  foundingDate: String(site.founded),
  priceRange: '$$',
  address: { '@type': 'PostalAddress', streetAddress: site.address.street, addressLocality: site.address.city, addressRegion: site.address.region, postalCode: site.address.zip, addressCountry: 'US' },
  openingHoursSpecification: [{ '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], opens: '07:00', closes: '19:00' }],
  areaServed: serviceArea.map((a) => ({ '@type': 'City', name: `${a.city}, OH` })),
  makesOffer: [
    { '@type': 'Offer', name: 'Free roof inspection', price: '0', priceCurrency: 'USD' },
    { '@type': 'Offer', name: 'Roof replacement' },
    { '@type': 'Offer', name: 'Storm and hail damage repair' },
  ],
});

const strip = (html: string) => html.replace(/<[^>]+>/g, '');
export const faqSchema = (items: { q: string; a: string }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: items.map((i) => ({ '@type': 'Question', name: i.q, acceptedAnswer: { '@type': 'Answer', text: strip(i.a) } })),
});

export const breadcrumbs = (base: string | undefined, trail: { name: string; path: string }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [{ name: 'Home', path: '/' }, ...trail].map((t, i) => ({ '@type': 'ListItem', position: i + 1, name: t.name, item: new URL(t.path, base).href })),
});
