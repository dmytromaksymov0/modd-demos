"""hero-3 → consult-onscreen.jpg: blur the Russian title/menu bar (and patient name) on the monitor,
keep the X-ray. Run from the site folder: python3 design/phase-3/retouch_onscreen.py"""
from PIL import Image, ImageFilter
im = Image.open('src/assets/photos/hero-3-dad-daughter-xray.jpg').convert('RGB')
for box, r in [((1470, 266, 2400, 314), 9), ((1218, 236, 1300, 262), 4), ((1880, 175, 2050, 215), 4)]:  # menu bar, bezel logo, webcam label
    region = im.crop(box).filter(ImageFilter.GaussianBlur(r))
    im.paste(region, box)
im.save('src/assets/photos/consult-onscreen.jpg', quality=90)
