// All photos live in src/assets/photos (CREDITS.md). Look them up by file name without extension.
import type { ImageMetadata } from 'astro';
const files = import.meta.glob<{ default: ImageMetadata }>('../assets/photos/*.jpg', { eager: true });
export const photo = (name: string): ImageMetadata => {
  const hit = files[`../assets/photos/${name}.jpg`];
  if (!hit) throw new Error(`photo not found: ${name}`);
  return hit.default;
};
