"""Phase 2: crop, uniform-match and export selected stock photos to src/assets/photos/.
Oleg's series (Artem Podrez) has a saturated royal-blue coverall; Andrii's (Gustavo Fring) is a
muted mid-blue. To make them read as one crew uniform, Oleg's coverall pixels (hue 140-175 on PIL's
0-255 scale, sat > 150) are desaturated toward Fring's level with a soft mask. Skin, cars and
background are untouched (different hue/saturation)."""
from PIL import Image, ImageFilter
import numpy as np, sys, os
SRC = 'design/phase-2/candidates'; DST = 'src/assets/photos'
os.makedirs(DST, exist_ok=True)

def match_uniform(im, strength=0.5):
    hsv = np.asarray(im.convert('HSV')).astype(float)
    h, s, v = hsv[..., 0], hsv[..., 1], hsv[..., 2]
    hue_w = np.clip(1 - np.abs(h - 157) / 20, 0, 1)
    sat_w = np.clip((s - 120) / 60, 0, 1)
    m = Image.fromarray((hue_w * sat_w * 255).astype('uint8')).filter(ImageFilter.GaussianBlur(2))
    m = np.asarray(m).astype(float) / 255
    s2 = s * (1 - m * strength)
    v2 = np.clip(v * (1 + m * 0.06), 0, 255)
    h2 = h - m * 6                      # nudge from violet-blue toward Fring's cooler blue
    out = np.stack([h2, s2, v2], -1).astype('uint8')
    return Image.merge('HSV', [Image.fromarray(out[..., i]) for i in range(3)]).convert('RGB')

def export(src, name, box=None, uniform=False, w=2000):
    im = Image.open(f'{SRC}/{src}').convert('RGB')
    W, H = im.size
    if box: im = im.crop(tuple(int(v * (W if i % 2 == 0 else H)) for i, v in enumerate(box)))
    if uniform: im = match_uniform(im)
    if im.width > w: im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    im.save(f'{DST}/{name}.jpg', quality=86, optimize=True, progressive=True)
    print(name, im.size)

# Kharkiv
export('p-23881456.jpg', 'derzhprom-bridges', box=(0.55, 0, 1, 1))          # emblem at x 0.42-0.56 stays out
export('p-23881456.jpg', 'derzhprom-facade-low', box=(0, 0.36, 1, 1))       # below the roof emblem
export('p-23881455.jpg', 'derzhprom-square')
# Masters
export('p-8985713.jpg', 'oleg-portrait', uniform=True)
export('p-8986176.jpg', 'oleg-full', uniform=True)
export('p-8986068.jpg', 'oleg-lift', uniform=True)
export('p-8985455.jpg', 'oleg-engine', uniform=True)
export('p-8985614.jpg', 'oleg-suspension', uniform=True)   # phase 4: Oleg under the lifted car, hands on suspension (service page)
export('p-8985660.jpg', 'oleg-wheel', box=(0.04, 0.14, 0.96, 1), uniform=True)  # phase 4: «Ходова» card — Forester on the lift, wheel off; crop removes a sign with a logo at top left
export('p-8985618.jpg', 'oleg-under-lift', uniform=True)   # phase 4: 13:05 photo report — Oleg (bald) under the lifted car
export('p-6870303.jpg', 'andrii-portrait')
export('p-6870304.jpg', 'andrii-measure')
export('p-6870319.jpg', 'andrii-brakes')
export('p-6870308.jpg', 'andrii-tablet')
# Climate
export('p-28490734.jpg', 'ac-panel')                     # phase 4: A/C control panel in the cabin («Кондиціонер»)
# Workshop
export('p-8985723.jpg', 'bay-04', uniform=True)
export('p-8985723.jpg', 'bay-04-wide', box=(0, 0.2, 1, 0.66), uniform=True)   # landscape crop: car + mechanic under it
export('p-33814736.jpg', 'bay-clean')
# Photo report details
export('p-6870299.jpg', 'report-disc')
export('p-8651900.jpg', 'report-hub-boot')
export('p-31040178.jpg', 'report-old-drum')
export('p-37175105.jpg', 'report-underbody', box=(0.07, 0, 1, 1))           # crops the shop sign at left
