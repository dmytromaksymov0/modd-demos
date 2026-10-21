"""Photos for «Вишня»: design/phase-2/originals (Pexels / Unsplash, 2400px) -> src/assets/photos (≤2000px, q86).
Crops remove text the site must not show:
  sterile-kraft   — keep the tools and the blank top of the pouch; the pouch print below («Сделано в России») is cut off
  sterile-cabinet — the dry-heat cabinet with its handle, temperature dial and timer; the hand with the pouches
                    is cut off (crop starts right of the pouches), the model plate on the panel is inpainted
  master-daryna   — the bottle with a label at the top is cut off
  master-iryna    — tight on face and hands; the poster behind is cut off
astro:assets makes AVIF/WebP + srcset at build. Run from the project root: npm run photos
"""
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / 'design' / 'phase-2' / 'originals'
OUT = ROOT / 'src' / 'assets' / 'photos'
OUT.mkdir(parents=True, exist_ok=True)

# name: (left, top, right, bottom) as fractions of the original
CROPS = {
    'sterile-kraft': (0.42, 0.28, 1.0, 0.655),
    'sterile-cabinet': (0.50, 0.30, 1.0, 0.86),
    'master-daryna': (0.0, 0.22, 1.0, 1.0),
    'master-iryna': (0.0, 0.10, 0.84, 0.86),
}

# Retouch before cropping (boxes are fractions of the original):
#  clone — rebuild an area by repeating each row's colour sampled at column sx (the lid, body and wall run horizontally);
#  text  — light letters on a dark panel: only bright pixels surrounded by dark are masked, then OpenCV Telea inpaint.
RETOUCH = {
    'sterile-cabinet': {'text': [(0.505, 0.57, 0.69, 0.675)]},
}

def retouch(im, spec):
    import cv2, numpy as np
    a = np.array(im).astype(np.float32)
    h, w = a.shape[:2]
    for l, t, r, b, sx in spec.get('clone', []):                   # sx: column to sample (clear of the handle)
        L, T, R, B, S = round(l * w), round(t * h), round(r * w), round(b * h), round(sx * w)
        src = a[T:B, S:S + 12].mean(axis=1, keepdims=True)          # one colour per row
        a[T:B, L:R] = np.repeat(src, R - L, axis=1)
        feather = 24                                                # soften the seam on the right
        for i in range(feather):
            k = i / feather
            a[T:B, R - feather + i] = a[T:B, R - feather + i] * (1 - k) + a[T:B, R + i] * k
    img = cv2.cvtColor(np.clip(a, 0, 255).astype(np.uint8), cv2.COLOR_RGB2BGR)
    for l, t, r, b in spec.get('text', []):
        L, T, R, B = round(l * w), round(t * h), round(r * w), round(b * h)
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY).astype(np.float32)
        dark = (gray < 80).astype(np.float32)
        around = cv2.blur(dark, (41, 41))
        mask = ((gray > 110) & (around > 0.62)).astype(np.uint8) * 255
        box = np.zeros_like(mask); box[T:B, L:R] = 255
        mask = cv2.dilate(cv2.bitwise_and(mask, box), np.ones((5, 5), np.uint8), iterations=2)
        img = cv2.inpaint(img, mask, 6, cv2.INPAINT_TELEA)
    return Image.fromarray(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))

for f in sorted(SRC.glob('*.jpg')):
    im = ImageOps.exif_transpose(Image.open(f)).convert('RGB')
    if f.stem in RETOUCH:
        im = retouch(im, RETOUCH[f.stem])
    if f.stem in CROPS:
        l, t, r, b = CROPS[f.stem]
        w, h = im.size
        im = im.crop((round(l * w), round(t * h), round(r * w), round(b * h)))
    im.thumbnail((2000, 2000), Image.LANCZOS)
    im.save(OUT / f.name, quality=86, optimize=True, progressive=True)
    print(f.stem, im.size)
