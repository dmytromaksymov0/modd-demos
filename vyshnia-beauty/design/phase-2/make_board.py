"""Photo board for the phase-2 report: every photo in src/assets/photos, grouped, with its file name."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
ROOT = Path(__file__).resolve().parents[2]
P = ROOT / 'src' / 'assets' / 'photos'
groups = [('Віяло послуг (крок 1)', 'svc-'), ('Майстри — руки за роботою', 'master-'), ('Роботи · «Хочу так само»', 'work-'),
          ('Стерильність', 'sterile-'), ('Типси й відтінки', 'tips-'), ("Інтер'єр", 'interior-')]
f = ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf', 16)
fb = ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial Bold.ttf', 24)
T = 260; rows = []
for title, pre in groups:
    files = sorted(P.glob(pre + '*.jpg'))
    cols = 7; n = (len(files) + cols - 1) // cols
    img = Image.new('RGB', (cols * (T + 10) + 10, 50 + n * (T + 34)), '#F3F3F1'); d = ImageDraw.Draw(img)
    d.text((10, 12), title, fill='#221B1E', font=fb)
    for i, fp in enumerate(files):
        im = Image.open(fp).convert('RGB'); im.thumbnail((T, T))
        x = 10 + (i % cols) * (T + 10); y = 50 + (i // cols) * (T + 34)
        img.paste(im, (x + (T - im.width) // 2, y + (T - im.height) // 2)); d.text((x, y + T + 6), fp.stem, fill='#6B6366', font=f)
    rows.append(img)
W = max(r.width for r in rows); H = sum(r.height for r in rows)
board = Image.new('RGB', (W, H), '#F3F3F1'); y = 0
for r in rows: board.paste(r, (0, y)); y += r.height
board.save(ROOT / 'design' / 'phase-2' / 'photo-board.jpg', quality=82)
print(board.size)
