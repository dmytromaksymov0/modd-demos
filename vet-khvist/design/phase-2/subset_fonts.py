"""Build the two self-hosted font files from the full variable sources in design/fonts-src.

One file per family (Latin + Ukrainian Cyrillic + punctuation + ₴ №), so a page loads 2 fonts, not 6–8
Fontsource subsets. Axes are trimmed to the weights the design uses.
  Piazzolla (OFL)   -> public/fonts/khvist-serif.woff2  wght 400–600, opsz 8–30 kept (optical size)
  Ubuntu Sans (UFL) -> public/fonts/khvist-sans.woff2   wght 400–700, wdth pinned to 100
Run: npm run fonts
"""
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools import subset

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / 'design' / 'fonts-src'
OUT = ROOT / 'public' / 'fonts'

UNICODES = (
    list(range(0x20, 0x7F))                  # Basic Latin
    + [0xA0, 0xA9, 0xAB, 0xB0, 0xB7, 0xBB, 0xD7]  # nbsp © « ° · » ×
    + list(range(0x400, 0x460))              # Cyrillic (incl. і ї є)
    + [0x490, 0x491, 0x2BC]                  # Ґ ґ ʼ
    + list(range(0x2010, 0x2027))            # dashes, quotes, …
    + [0x2116, 0x20B4, 0x2212, 0x2192, 0x2190, 0x2193, 0x2009, 0x202F]  # № ₴ − → ← ↓ thin spaces
)

def build(src: str, out: str, limits: dict):
    f = TTFont(SRC / src, lazy=False)
    f = instancer.instantiateVariableFont(f, limits)
    f = TTFont(__import__('io').BytesIO(_save(f)), lazy=False)  # round-trip: subsetter chokes on instancer output otherwise
    opts = subset.Options()
    opts.flavor = 'woff2'
    opts.layout_features = ['kern', 'liga', 'calt', 'ccmp', 'locl', 'mark', 'mkmk', 'tnum', 'pnum', 'lnum', 'case']
    opts.name_IDs = ['*']
    opts.notdef_outline = True
    s = subset.Subsetter(opts)
    s.populate(unicodes=UNICODES)
    s.subset(f)
    f.flavor = 'woff2'
    f.save(OUT / out)
    cmap = f.getBestCmap()
    missing = [hex(u) for u in UNICODES if u not in cmap]
    print(out, (OUT / out).stat().st_size // 1024, 'KB', 'missing:', missing or '-')

def _save(f):
    import io
    b = io.BytesIO(); f.save(b); return b.getvalue()

OUT.mkdir(parents=True, exist_ok=True)
build('Piazzolla[opsz,wght].ttf', 'khvist-serif.woff2', {'wght': (400, 600)})
build('UbuntuSans[wdth,wght].ttf', 'khvist-sans.woff2', {'wdth': 100, 'wght': (400, 700)})
