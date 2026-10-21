// schema.org JSON-LD: the studio (BeautySalon + NailSalon) with services as offers, and the FAQ.
import { site } from '../config/site.ts';
import { services } from '../data/services.ts';
export function beautySalon(origin: URL) {
  return {
    '@context': 'https://schema.org',
    '@type': ['BeautySalon', 'NailSalon'],
    name: site.name,
    url: origin.href,
    telephone: '+380570002121',
    image: new URL('/og/home.jpg', origin).href,
    logo: new URL('/brand/vyshnia-logo.svg', origin).href,
    priceRange: '450–1560 ₴',
    address: { '@type': 'PostalAddress', streetAddress: site.address, addressLocality: 'Харків', addressCountry: 'UA' },
    openingHoursSpecification: [{ '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], opens: site.opensAt, closes: site.closesAt }],
    sameAs: [site.instagram, site.telegram],
    makesOffer: services.map((s) => ({ '@type': 'Offer', priceCurrency: 'UAH', price: s.price, itemOffered: { '@type': 'Service', name: s.name } })),
  };
}
export const faqPage = (items: readonly { q: string; a: string }[]) => ({
  '@context': 'https://schema.org', '@type': 'FAQPage',
  mainEntity: items.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
});
export const breadcrumbs = (origin: URL, items: { href: string; label: string }[]) => ({
  '@context': 'https://schema.org', '@type': 'BreadcrumbList',
  itemListElement: [{ href: '/', label: 'Головна' }, ...items].map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.label, item: new URL(c.href, origin).href })),
});
