// Kestrel Roofing Co. — fictional company, demo data. Everything a real client would change lives here.

export const site = {
  name: 'Kestrel Roofing Co.',
  shortName: 'Kestrel',
  founded: 2009,
  phone: { display: '(614) 555-0142', href: 'tel:+16145550142' },
  email: 'hello@kestrelroofing.example',
  address: {
    street: '2150 Bethel Rd, Suite 4',
    city: 'Columbus',
    region: 'OH',
    zip: '43220',
  },
  // Office hours, America/New_York. 0 = Sunday.
  hours: { tz: 'America/New_York', open: 7, close: 19, days: [1, 2, 3, 4, 5, 6], label: 'Mon–Sat, 7 am – 7 pm' },
  license: 'City of Columbus Home Improvement Contractor #HIC-0000 (demo)',
  insurance: '$2M general liability + workers’ comp',
  certification: 'Manufacturer-Certified Master Installer',
  warrantyYears: 25,
  nailBounty: 25, // $ per nail found after cleanup — confirm with the real client
  financing: { apr: 0, months: 12, note: 'On approved credit. Example only.' },
} as const;

// Analytics stub — off in the demo. Set provider to 'plausible' or 'ga4' and fill the id to switch on.
// Lead submissions fire a 'Lead' event (see Analytics.astro).
export const analytics = {
  provider: 'none' as 'none' | 'plausible' | 'ga4',
  plausibleDomain: 'kestrelroofing.example',
  ga4Id: 'G-XXXXXXXXXX',
};

// Storm alert banner — one switch. Set `enabled: false` when there is no recent storm.
export const storm = {
  enabled: true,
  date: 'Oct 14',
  areas: ['Dublin', 'Hilliard', 'Upper Arlington'],
  message: 'free storm inspections this week',
  href: '/storm-damage/',
  cta: 'Book a storm inspection',
} as const;

export const nav = [
  { label: 'Roof Replacement', href: '/roof-replacement/' },
  { label: 'Storm & Hail', href: '/storm-damage/' },
  { label: 'Cost Calculator', href: '/roof-cost-calculator/' },
  { label: 'Projects', href: '/projects/' },
  { label: 'About', href: '/about/' },
] as const;

export type Area = { city: string; zips: string[]; storm?: boolean };

// Service area around Columbus. `storm: true` = inside the current storm banner area.
export const serviceArea: Area[] = [
  { city: 'Columbus', zips: ['43201', '43202', '43203', '43204', '43205', '43206', '43207', '43209', '43210', '43211', '43212', '43213', '43214', '43215', '43219', '43220', '43222', '43223', '43224', '43227', '43228', '43229', '43231', '43232', '43235'] },
  { city: 'Dublin', zips: ['43016', '43017'], storm: true },
  { city: 'Hilliard', zips: ['43026'], storm: true },
  { city: 'Upper Arlington', zips: ['43221'], storm: true },
  { city: 'Worthington', zips: ['43085'] },
  { city: 'Westerville', zips: ['43081', '43082'] },
  { city: 'Powell', zips: ['43065'] },
  { city: 'Lewis Center', zips: ['43035'] },
  { city: 'Delaware', zips: ['43015'] },
  { city: 'Gahanna', zips: ['43230'] },
  { city: 'New Albany', zips: ['43054'] },
  { city: 'Bexley', zips: ['43209'] },
  { city: 'Reynoldsburg', zips: ['43068'] },
  { city: 'Pickerington', zips: ['43147'] },
  { city: 'Canal Winchester', zips: ['43110'] },
  { city: 'Groveport', zips: ['43125'] },
  { city: 'Grove City', zips: ['43123'] },
  { city: 'Plain City', zips: ['43064'] },
];

export const problemTypes = [
  { value: 'leak', label: 'Leak' },
  { value: 'storm', label: 'Storm or hail' },
  { value: 'old-roof', label: 'Old roof' },
  { value: 'not-sure', label: 'Not sure' },
] as const;
