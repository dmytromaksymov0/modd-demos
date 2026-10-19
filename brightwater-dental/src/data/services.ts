// Content for the four main service pages (fictional practice; prices are demo values from src/config/site.ts).
import type { ImageMetadata } from 'astro';
import { prices } from '../config/site';
import cleaning from '../assets/photos/service-cleaning.jpg';
import crownScan from '../assets/photos/service-crown-scan.jpg';
import aligners from '../assets/photos/service-aligners.jpg';
import emergency from '../assets/photos/service-emergency-exam.jpg';

export type Service = {
  slug: string; title: string; short: string; visit: string; photo: ImageMetadata; alt: string; position: string;
  lead: string; facts: [string, string][]; forWho: string[];
  steps: { t: string; time: string; d: string }[];
  comfort: string; price: { amount: string; label: string; lines: string[] };
  faq: { q: string; a: string }[];
};

export const services: Service[] = [
  {
    slug: 'cleanings-exams', title: 'Cleanings & Exams', short: 'Twice a year, about an hour. Kids from their first birthday.', visit: 'cleaning',
    photo: cleaning, alt: 'A hygienist with her mask down chats with a relaxed patient in the chair', position: '40% 40%',
    lead: 'The visit that keeps every other visit small. About an hour, usually $0 with a PPO plan, and you see everything we see.',
    facts: [['60 min', 'adults · 30 for kids'], ['$0', 'with most PPO plans'], ['2×', 'a year for most people']],
    forWho: ['Everyone, every six months', 'Kids from age one (a first look) and three (a real cleaning)', 'Gum disease? Every three or four months'],
    steps: [
      { t: 'X-rays when due', time: '10 min', d: 'Bitewings once a year, a panoramic every five. Low-dose digital.' },
      { t: 'Exam on the screen', time: '10 min', d: 'Camera pictures of anything worth watching, shown to you as we go. Oral cancer screening included.' },
      { t: 'Cleaning', time: '20–30 min', d: 'Plaque and tartar off, polish, floss. Numbing gel for sensitive spots.' },
      { t: 'What’s next', time: '5 min', d: 'Nothing to do? See you in six months. Something to watch? We tell you how urgent it is, honestly.' },
    ],
    comfort: 'Hate the scraping sound? Headphones with your playlist, and we can use a gentler ultrasonic scaler for most of the cleaning.',
    price: { amount: '$0', label: 'with most PPO plans', lines: [`$${prices.newPatient} first visit without insurance (exam, X-rays, cleaning)`, `Or $${prices.planAdult}/month on the Brightwater Plan — two cleanings included`, 'Deep cleaning (scaling & root planing) is quoted in writing first'] },
    faq: [
      { q: 'What’s the difference between a regular and a deep cleaning?', a: 'A regular cleaning works above the gum line. A deep cleaning (scaling and root planing) cleans below it when gum pockets are 4 mm or deeper. We measure, show you the numbers and give you the price before doing it.' },
      { q: 'How often do kids need cleanings?', a: 'Every six months from about age three. Under three, a quick check and fluoride varnish at the same visits as yours.' },
      { q: 'Do I need X-rays every visit?', a: 'No. Bitewings about once a year, a panoramic every few years, more only if something needs a closer look.' },
    ],
  },
  {
    slug: 'same-day-crowns', title: 'Same-Day Crowns', short: 'Scan, design, mill and bond — one visit, one numbing.', visit: 'crown',
    photo: crownScan, alt: 'A patient gets a quick digital scan instead of an impression tray', position: '50% 45%',
    lead: 'A cracked or worn-out tooth fixed in one visit of about two hours. No goop impressions, no temporary crown for three weeks.',
    facts: [['~2 hrs', 'one appointment'], [`$${prices.crownFrom.toLocaleString('en-US')}`, 'from, before insurance'], ['~50%', 'typical PPO coverage']],
    forWho: ['A tooth that cracked or broke', 'A large old filling that’s failing', 'After a root canal on a back tooth'],
    steps: [
      { t: 'Numb and prepare', time: '30 min', d: 'Numbing gel first, then the injection. We shape the tooth and remove decay.' },
      { t: 'Scan', time: '5 min', d: 'A small wand takes a 3D picture. No trays, no gagging on putty.' },
      { t: 'Design with you', time: '15 min', d: 'Dr. Holloway designs the crown on the screen — you can see the shape and color before it’s made.' },
      { t: 'Mill', time: '20–30 min', d: 'The crown is milled from a single block of ceramic in our office. Coffee, Wi-Fi, a show on the ceiling screen.' },
      { t: 'Fit and bond', time: '20 min', d: 'Try-in, bite check, polish, bond. You leave with the final crown.' },
    ],
    comfort: 'Long visit? Ask for nitrous oxide — it wears off in minutes and you can drive home. Breaks are built in while the crown mills.',
    price: { amount: `$${prices.crownFrom.toLocaleString('en-US')}`, label: 'from, per crown before insurance', lines: ['Most PPO plans cover about 50% of a crown after the deductible', 'About $96/month over 12 months at 0% on approved credit', 'Written estimate before we start — no surprises'] },
    faq: [
      { q: 'Are same-day crowns as strong as lab crowns?', a: 'Yes for most teeth. Milled ceramic crowns last 10–15 years with normal care, the same range as lab-made ceramic crowns. For a few situations (heavy grinding, some front teeth) we recommend a lab crown and tell you why.' },
      { q: 'How is this different from the traditional way?', a: 'Traditionally you have two visits two to three weeks apart, a goopy impression and a temporary crown in between. Same-day means one visit, one numbing and no temporary that can fall off.' },
      { q: 'Does insurance cover a same-day crown?', a: 'Insurance treats it like any crown — usually about 50% after your deductible on PPO plans. We send a pre-estimate if you want certainty first.' },
    ],
  },
  {
    slug: 'clear-aligners', title: 'Clear Aligners', short: 'Straighter teeth with removable trays. Free 3D scan first.', visit: 'aligners',
    photo: aligners, alt: 'A smiling woman puts in a clear aligner', position: '50% 35%',
    lead: 'Removable clear trays, a new set every one or two weeks. We scan your teeth for free and show you the predicted result before you decide.',
    facts: [[`$${prices.alignersMonthlyFrom}/mo`, `from · or $${prices.alignersFrom.toLocaleString('en-US')} total`], ['6–18 mo', 'for most adults'], ['Free', '3D scan & consult']],
    forWho: ['Crowding or gaps that bother you', 'Teens who’d rather not have brackets', 'Teeth that moved back after braces'],
    steps: [
      { t: 'Free consult & scan', time: '30 min', d: 'A 3D scan and a short exam. We show you a simulation of the result and tell you if you’re not a good fit.' },
      { t: 'Your trays', time: '2–3 weeks later', d: 'We fit the first trays, add small tooth-colored attachments if needed and show you how to put them in.' },
      { t: 'Wear them 22 hours a day', time: '6–18 months', d: 'New trays every one or two weeks. Check-ins every 8–10 weeks — evenings and Saturdays work.' },
      { t: 'Retainers', time: 'at the end', d: 'Your first set of retainers is included. Wear them at night to keep the result.' },
    ],
    comfort: 'New trays feel tight for a day or two. Switch to a new set at night so the pressure fades while you sleep.',
    price: { amount: `$${prices.alignersMonthlyFrom}`, label: `a month, from · $${prices.alignersFrom.toLocaleString('en-US')}+ total`, lines: ['Includes refinement trays and your first retainers', 'Many PPO plans with ortho coverage pay $1,000–$1,500 lifetime', 'HSA/FSA eligible'] },
    faq: [
      { q: 'Who isn’t a good fit for aligners?', a: 'Severe bite problems, active gum disease, or a lot of missing teeth. We’ll tell you at the free consult and refer you to an orthodontist if braces are the better tool.' },
      { q: 'Can I eat with them in?', a: 'Take them out to eat and drink anything but water, brush, and put them back. That’s the main habit to learn.' },
      { q: 'Am I too old?', a: 'Healthy gums matter more than age. Dr. Kessler’s oldest aligner patient finished at 67.' },
    ],
  },
  {
    slug: 'emergency-dentist', title: 'Emergency Dentistry', short: 'Toothache, broken tooth, swelling — time held every day.', visit: 'emergency',
    photo: emergency, alt: 'A dentist adjusts the exam light over a calm patient in a bright treatment room', position: '50% 42%',
    lead: 'We hold time every day we’re open for people in pain. Call us or book an emergency slot — most people are seen the same day.',
    facts: [['Today', 'most same-day visits'], [`$${prices.emergencyExam}`, 'exam + one X-ray'], ['7 pm', 'open late Mon–Thu']],
    forWho: ['Toothache or throbbing pain', 'A broken or knocked-out tooth', 'A crown or filling that came out', 'Swelling in the gum or face'],
    steps: [
      { t: 'Call or book', time: 'now', d: 'Tell us what happened. We give you the first open time and what to do until then.' },
      { t: 'Exam and X-ray', time: '20 min', d: 'We find the cause and get you out of pain first.' },
      { t: 'Fix or stabilize', time: 'same visit', d: 'Often fixed the same day (a filling, a same-day crown, a temporary). If not, you leave comfortable with a plan and a price.' },
    ],
    comfort: 'In pain and scared? Say so. Numbing comes first, and nitrous is available for emergency visits too.',
    price: { amount: `$${prices.emergencyExam}`, label: 'limited exam + one X-ray', lines: ['Usually covered by PPO plans as a limited exam', 'Treatment priced in writing before we start', 'Brightwater Plan members: one emergency exam a year included'] },
    faq: [
      { q: 'What if it happens when you’re closed?', a: 'Call our number — the message gives a dentist’s on-call line for patients of record. For facial swelling that affects breathing or swallowing, go to the nearest ER or call 911.' },
      { q: 'A tooth got knocked out. What do I do?', a: 'Pick it up by the crown, not the root. Rinse it gently, don’t scrub. Put it back in the socket if you can, or in a cup of milk, and come in within 30–60 minutes — time matters most.' },
      { q: 'Will you see me if I’m not a patient?', a: 'Yes. Emergency visits are open to everyone.' },
    ],
  },
];
