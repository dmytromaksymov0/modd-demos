// Fictional dentists for the concept site. Photos are stock models (see CREDITS.md) — replaced at launch.
// Portraits are unified by design/phase-4/team_portraits.py: same 4:5 head-and-shoulders crop, eyes on one line, one grade.
import ruiz from '../assets/photos/team-portrait-ruiz.jpg';
import holloway from '../assets/photos/team-portrait-holloway.jpg';
import kessler from '../assets/photos/team-portrait-kessler.jpg';
import hollowayAtWork from '../assets/photos/team-holloway-at-work.jpg';

export const team = [
  {
    slug: 'elena-ruiz', photo: ruiz,
    name: 'Dr. Elena Ruiz, DDS', short: 'Dr. Ruiz', role: 'Family care & nervous patients', school: 'UT Health San Antonio School of Dentistry',
    languages: 'Hablamos español',
    why: 'A dentist lectured me when I was twelve. I decided nobody in my chair would ever feel that way.',
    asked: '“Can my kid sit on my lap for the first visit?” Yes — and I’ll count their teeth while they do.',
    focus: ['Kids from their first birthday', 'Nitrous and oral sedation (Level 2 permit)', 'Patients who haven’t been in years'],
  },
  {
    slug: 'mark-holloway', photo: holloway, atWork: hollowayAtWork,
    name: 'Dr. Mark Holloway, DDS', short: 'Dr. Holloway', role: 'Same-day crowns & restorative', school: 'Texas A&M College of Dentistry',
    why: 'People have jobs and kids. If I can fix it in one visit instead of two, I will.',
    asked: '“Will a same-day crown last?” Ceramic crowns milled here last as long as lab crowns — 10 to 15 years with normal care.',
    focus: ['Same-day ceramic crowns', 'Fillings, root canals, bridges', 'Teaching teens to brush like they mean it'],
  },
  {
    slug: 'hannah-kessler', photo: kessler,
    name: 'Dr. Hannah Kessler, DMD', short: 'Dr. Kessler', role: 'Clear aligners & kids', school: 'UTHealth Houston School of Dentistry',
    why: 'Kids remember how a visit felt, not what we did. I’m in the business of good memories.',
    asked: '“Am I too old for aligners?” My oldest patient finished at 67. Gums matter more than age.',
    focus: ['Clear aligners for teens and adults', 'Kids’ cleanings and sealants', 'Night guards and TMJ'],
  },
] as const;
