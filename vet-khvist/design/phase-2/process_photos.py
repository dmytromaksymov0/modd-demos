"""Copy the chosen Pexels photos into src/assets/photos with semantic names and retouch what must not be
shown: on-screen UI text (the ultrasound UI is in Russian) and an embroidered monogram on scrubs.
Run from the project root: python3 design/phase-2/process_photos.py"""
from PIL import Image, ImageFilter, ImageDraw
from pathlib import Path
import numpy as np, cv2

SRC = Path('design/phase-2/candidates'); OUT = Path('src/assets/photos'); OUT.mkdir(parents=True, exist_ok=True)

# name in candidates -> (output name, [boxes]); box = (x0,y0,x1,y1, radius) blurs, (x0,y0,x1,y1, 'inpaint') removes
CHOSEN = {
    'vet-cat-stethoscope': ('vet-cat-stethoscope', []),
    'paw-in-hands': ('paw-in-hands', []),
    'cat-ear-exam': ('cat-ear-exam', []),
    'kitten-vaccine': ('kitten-bodysuit-syringe', []),
    'dog-exam-table': ('dog-exam-table', [(2128, 1468, 2208, 1518, 'inpaint')]),          # «SFK» monogram on the trousers
    'dog-listening': ('dog-listening', []),
    'ultrasound-pomeranian': ('ultrasound-pomeranian', [(1860, 490, 2300, 970, 9)]),  # monitor UI (Russian labels)
    'xray-pomeranian': ('xray-pomeranian', []),
    'doctor-male-pomeranian': ('doctor-male-pomeranian', []),
    'doctor-female-pomeranian': ('doctor-female-pomeranian', [(2250, 1650, 2400, 2250, 9)]),  # edge of the same ultrasound monitor
    'dog-teeth-check': ('dog-teeth-check', []),
    'dog-exam-sitting': ('doctor-blue-shepherd', [(1172, 1380, 1234, 1420, 'inpaint')]),  # same doctor as dog-listening / dog-exam-table; chest monogram
}

for src, (name, boxes) in CHOSEN.items():
    im = Image.open(SRC / f'{src}.jpg').convert('RGB')
    for (x0, y0, x1, y1, r) in boxes:
        if r == 'inpaint':
            a = cv2.cvtColor(np.array(im), cv2.COLOR_RGB2BGR); m = np.zeros(a.shape[:2], np.uint8); m[y0:y1, x0:x1] = 255
            im = Image.fromarray(cv2.cvtColor(cv2.inpaint(a, m, 9, cv2.INPAINT_TELEA), cv2.COLOR_BGR2RGB)); continue
        region = im.crop((x0, y0, x1, y1)).filter(ImageFilter.GaussianBlur(r))
        mask = Image.new('L', region.size, 0); ImageDraw.Draw(mask).rounded_rectangle((0, 0, *region.size), radius=12, fill=255)
        mask = mask.filter(ImageFilter.GaussianBlur(6))
        im.paste(region, (x0, y0), mask)
    im.save(OUT / f'{name}.jpg', quality=88, optimize=True, progressive=True)
    print(name, im.size, len(boxes), 'retouch')
