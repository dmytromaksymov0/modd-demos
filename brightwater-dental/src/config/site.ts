// Brightwater Family Dental — fictional practice, demo data.
// Everything a real client would change lives here; components and schema.org read from it.

export const site = {
  name: 'Brightwater Family Dental',
  shortName: 'Brightwater',
  phone: { display: '(512) 555-0142', href: 'tel:+15125550142' },
  email: 'hello@brightwaterdental.example',
  address: {
    street: '2200 Lakeshore Walk, Suite 140', // fictional street in the Mueller neighborhood
    neighborhood: 'Mueller',
    city: 'Austin',
    region: 'TX',
    zip: '78723',
  },
  languages: ['English', 'Español'],
} as const;

// Office hours, America/Chicago. 0 = Sunday. Times are minutes after midnight.
export const hours = {
  tz: 'America/Chicago',
  days: [
    { day: 1, short: 'Mon', open: 450, close: 1140 },  // 7:30 am – 7 pm
    { day: 2, short: 'Tue', open: 450, close: 1140 },
    { day: 3, short: 'Wed', open: 450, close: 1140 },
    { day: 4, short: 'Thu', open: 450, close: 1140 },
    { day: 5, short: 'Fri', open: 450, close: 900 },   // 7:30 am – 3 pm
    { day: 6, short: 'Sat', open: 480, close: 840 },   // 8 am – 2 pm
  ],
  summary: 'Mon–Thu 7:30–7 · Fri 7:30–3 · Sat 8–2',
} as const;

export const prices = {
  newPatient: 99,          // exam + cleaning + X-rays, in the absence of gum disease
  planAdult: 29,           // Brightwater Plan, per month
  planKid: 19,             // per month, under 18
  emergencyExam: 59,       // limited exam + one X-ray
  crownFrom: 1150,         // same-day crown
  alignersFrom: 3900,
  alignersMonthlyFrom: 129,
} as const;

export const nav = [
  { label: 'New Patients', href: '/new-patients/' },
  { label: 'Services', href: '/services/' },
  { label: 'Insurance & Financing', href: '/insurance-financing/' },
  { label: 'Our Team', href: '/team/' },
] as const;

export const cta = {
  book: { label: 'Book online', href: '/book/' },
  insurance: { label: 'Check my insurance', href: '/insurance-financing/#check' },
} as const;

// Analytics stub — off in the demo. Set provider to 'plausible' or 'ga4' and fill the id to switch on.
export const analytics = {
  provider: 'none' as 'none' | 'plausible' | 'ga4',
  plausibleDomain: 'brightwaterdental.example',
  ga4Id: 'G-XXXXXXXXXX',
};
