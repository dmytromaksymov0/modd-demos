"""Photo board for user review before page layout: design/phase-2/photo-board.png"""
from PIL import Image, ImageDraw, ImageFont
groups = [
  ('Харків (Constantin Ch)', ['derzhprom-bridges','derzhprom-facade-low','derzhprom-square']),
  ('Олег — Artem Podrez (форма приведена к одному синему)', ['oleg-portrait','oleg-full','oleg-lift','oleg-engine']),
  ('Андрій — Gustavo Fring', ['andrii-portrait','andrii-measure','andrii-brakes','andrii-tablet']),
  ('Цех', ['bay-04','bay-clean']),
  ('Фотозвіт: деталі', ['report-disc','report-hub-boot','report-old-drum','report-underbody']),
]
f = lambda s: ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial Bold.ttf', s)
H = 360; pad = 16; rows = []
for title, names in groups:
    ims = [Image.open(f'src/assets/photos/{n}.jpg') for n in names]
    ims = [im.resize((round(im.width * H / im.height), H)) for im in ims]
    w = sum(i.width for i in ims) + pad * (len(ims) - 1)
    r = Image.new('RGB', (w, H + 74), 'white'); d = ImageDraw.Draw(r)
    d.text((0, 4), title, fill='black', font=f(24)); x = 0
    for n, im in zip(names, ims):
        r.paste(im, (x, 40)); d.text((x, H + 46), n, fill='#444', font=f(16)); x += im.width + pad
    rows.append(r)
W = max(r.width for r in rows) + 2 * pad
board = Image.new('RGB', (W, sum(r.height for r in rows) + pad * (len(rows) + 1)), 'white'); y = pad
for r in rows: board.paste(r, (pad, y)); y += r.height + pad
board.save('design/phase-2/photo-board.png'); print(board.size)
