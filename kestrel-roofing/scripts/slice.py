"""Slice a tall full-page screenshot into side-by-side columns for review.
python3 scripts/slice.py <png> <out.jpg> [chunk_px]"""
import sys
from PIL import Image
src, dst = sys.argv[1], sys.argv[2]
chunk = int(sys.argv[3]) if len(sys.argv) > 3 else 1600
im = Image.open(src).convert('RGB'); w, h = im.size
n = (h + chunk - 1) // chunk
o = Image.new('RGB', (n * (w + 16), min(h, chunk)), 'white')
for i in range(n):
    o.paste(im.crop((0, i * chunk, w, min(h, (i + 1) * chunk))), (i * (w + 16), 0))
o.save(dst, quality=82)
print(n, 'columns')
