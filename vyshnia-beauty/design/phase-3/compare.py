"""Phase-3 comparison: full home pages at 1280 of the four live sites and «Вишня», side by side, same scale."""
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
f = ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial Bold.ttf', 30)
items = [('Kestrel', 'design/phase-3/live/kestrel-full.png'), ('Brightwater', 'design/phase-3/live/brightwater-full.png'),
         ('ТОРК', 'design/phase-3/live/tork-full.png'), ('Хвіст', 'design/phase-3/live/khvist-full.png'), ('Вишня', 'design/phase-3/live/vyshnia-full.png')]
W = 420; cols = []
for name, p in items:
    im = Image.open(ROOT / p).convert('RGB'); im = im.resize((W, round(im.height * W / im.width)))
    cols.append((name, im))
H = max(i.height for _, i in cols) + 60
sheet = Image.new('RGB', (len(cols) * (W + 24) + 24, H + 24), '#d9d9d9'); d = ImageDraw.Draw(sheet)
for k, (name, im) in enumerate(cols):
    x = 24 + k * (W + 24)
    d.text((x, 14), name, fill=(126, 22, 49) if name == 'Вишня' else (20, 20, 20), font=f)
    sheet.paste(im, (x, 60))
sheet.save(ROOT / 'design' / 'phase-3' / 'compare-home.jpg', quality=78)
print(sheet.size)
