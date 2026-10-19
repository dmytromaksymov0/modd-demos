// Demo case studies — fictional jobs, real photos (see CREDITS.md). Format: "on the job → work details".
// One photo per job; never pair two different houses as before/after.
import type { ImageMetadata } from 'astro';
import clintonville from '../assets/photos/hero-1-porch-house-crew.jpg';
import hilliard from '../assets/photos/hero-2-brick-house-decking.jpg';
import dublin from '../assets/photos/project-stone-house-in-progress.jpg';
import westerville from '../assets/photos/project-stone-house-2.jpg';
import delaware from '../assets/photos/material-metal-farmhouse.jpg';
import worthington from '../assets/photos/project-gray-colonial.jpg';

export type Tag = 'replacement' | 'storm' | 'metal';
export interface Project {
  slug: string; place: string; img: ImageMetadata; alt: string; pos?: string;
  tags: Tag[]; kind: string; squares: number; pitch: string; material: string; days: number; paidBy: string; month: string;
  found: string; did: string; review?: { text: string; who: string };
}

export const projects: Project[] = [
  { slug: 'hilliard-hail', place: 'Hilliard', img: hilliard, alt: 'Crew tearing off a hail-damaged roof on a brick home, new decking leaning on the garage', pos: '60% 50%', tags: ['storm', 'replacement'], kind: 'Hail claim', squares: 34, pitch: '8/12', material: 'Architectural shingle', days: 1, paidBy: 'Insurance + $1,000 deductible', month: 'Oct 2026',
    found: 'Hail bruising on all four slopes, 9 hits in a 10 × 10 ft test square.', did: 'Met the adjuster with 212 photos — approved on the first visit. 6 soft decking sheets swapped, shown to the owner first.',
    review: { text: 'They were up on the roof with the adjuster and pointed out things I’d never have seen. The yard was cleaner when they left than when they came.', who: 'Homeowner, Hilliard' } },
  { slug: 'clintonville-victorian', place: 'Clintonville', img: clintonville, alt: 'Crew replacing the roof of a white two-story house with a wraparound porch', tags: ['replacement'], kind: 'Replacement', squares: 31, pitch: '12/12', material: 'Architectural shingle', days: 2, paidBy: 'Owner', month: 'Sep 2026',
    found: '1920s house, two old layers, steep gables and a box gutter on the porch.', did: 'Both layers off, 9 sheets of decking replaced, porch roof re-flashed. Harnessed crew on the 12/12 gables.' },
  { slug: 'dublin-stone', place: 'Dublin', img: dublin, alt: 'Stone-front home mid-replacement with crew on the roof', tags: ['replacement'], kind: 'Replacement', squares: 42, pitch: '8/12', material: 'Architectural shingle', days: 2, paidBy: 'Owner', month: 'Aug 2026',
    found: 'Complex roof with 11 valleys; previous roofer skipped ice & water shield.', did: 'Ice & water shield in every valley and at the eaves, new ridge vent, new pipe boots throughout.' },
  { slug: 'westerville-gables', place: 'Westerville', img: westerville, alt: 'Stone two-story home with a finished shingle roof and many gables', tags: ['replacement'], kind: 'Finished', squares: 38, pitch: '10/12', material: 'Architectural shingle', days: 2, paidBy: 'Financed, 0% / 12 mo', month: 'Jul 2026',
    found: 'Nine gables, two chimneys, leaking step flashing at the front wall.', did: 'All flashing replaced, chimney crickets added. The owner paid monthly, no interest.',
    review: { text: 'The estimate had every line on it, and the final bill matched it to the dollar.', who: 'Homeowner, Westerville' } },
  { slug: 'delaware-metal', place: 'Delaware', img: delaware, alt: 'White farmhouse with a new standing-seam metal roof', tags: ['metal', 'replacement'], kind: 'Metal', squares: 24, pitch: '8/12', material: 'Standing-seam metal', days: 3, paidBy: 'Owner', month: 'Jun 2026',
    found: 'Farmhouse on open land, shingles kept blowing off in west wind.', did: 'Standing-seam metal with hidden fasteners, snow guards over the porch entry.' },
  { slug: 'worthington-colonial', place: 'Worthington', img: worthington, alt: 'Gray two-story house surrounded by trees', pos: '50% 40%', tags: ['storm'], kind: 'Wind claim', squares: 22, pitch: '6/12', material: 'Architectural shingle', days: 1, paidBy: 'Insurance + $500 deductible', month: 'May 2026',
    found: 'Tree branches and a May windstorm lifted shingles on the back slope.', did: 'Documented the wind damage, insurer paid for the full slope plus matching ridge.' },
];
