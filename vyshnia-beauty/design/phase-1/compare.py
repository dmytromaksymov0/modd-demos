# Сетка сравнения первых экранов: python3 compare.py out.jpg name1 name2 ...
import sys
from PIL import Image, ImageDraw, ImageFont
out, names = sys.argv[1], sys.argv[2:]
rows = []
try: font = ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf', 22)
except Exception: font = None
for n in names:
    d = Image.open(f'shots/{n}-1280.png').convert('RGB').resize((800, 500))
    m = Image.open(f'shots/{n}-375.png').convert('RGB'); m = m.resize((231, 500))
    row = Image.new('RGB', (800 + 231 + 30, 540), 'white'); row.paste(d, (0, 40)); row.paste(m, (820, 40))
    ImageDraw.Draw(row).text((4, 8), n, fill='black', font=font); rows.append(row)
cols = 2; W = rows[0].width; H = rows[0].height
sheet = Image.new('RGB', (cols * W + 20, ((len(rows) + 1) // 2) * H), '#e5e5e5')
for i, r in enumerate(rows): sheet.paste(r, ((i % cols) * (W + 20), (i // cols) * H))
sheet.save(out, quality=80)
