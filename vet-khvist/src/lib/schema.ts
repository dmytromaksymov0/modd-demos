// schema.org for the fictional clinic (address is the demo one from site.ts).
import { site } from '../config/site.ts';
export function veterinaryCare(base: URL) {
  return {
    '@context': 'https://schema.org',
    '@type': 'VeterinaryCare',
    '@id': new URL('/#clinic', base).href,
    name: site.name,
    url: base.href,
    telephone: site.phone.intl,
    email: site.email,
    image: new URL('/og/home.jpg', base).href,
    logo: new URL('/brand/khvist-logo.svg', base).href,
    priceRange: '₴₴',
    address: { '@type': 'PostalAddress', streetAddress: site.address.street, addressLocality: site.address.city, postalCode: site.address.zip, addressCountry: 'UA' },
    openingHoursSpecification: [{ '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], opens: '00:00', closes: '23:59' }],
    availableService: ['Невідкладна допомога', 'Терапія', 'Хірургія', 'Вакцинація', 'Діагностика'].map((n) => ({ '@type': 'MedicalProcedure', name: n })),
  };
}
export const faqPage = (items: readonly { q: string; a: string }[]) => ({
  '@context': 'https://schema.org', '@type': 'FAQPage',
  mainEntity: items.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
});
export const breadcrumbs = (base: URL, items: { href: string; label: string }[]) => ({
  '@context': 'https://schema.org', '@type': 'BreadcrumbList',
  itemListElement: [{ href: '/', label: 'Головна' }, ...items].map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.label, item: new URL(c.href, base).href })),
});
