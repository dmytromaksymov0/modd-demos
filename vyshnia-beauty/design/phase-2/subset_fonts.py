"""Self-hosted fonts for «Вишня» from the full variable sources in design/fonts-src (google/fonts, OFL).

One file per family (Latin + Ukrainian Cyrillic + punctuation + ₴ №), so a page loads 2 fonts.
  Geologica  -> public/fonts/vyshnia-display.woff2  wght 400–600, SHRP 0–100 kept (sharpness — the «fresh
                manicure» headline axis), CRSV pinned 0, slnt pinned 0
  Golos Text -> public/fonts/vyshnia-text.woff2     wght 400–600
Run from the project root: npm run fonts
"""
import io
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools import subset

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / 'design' / 'fonts-src'
OUT = ROOT / 'public' / 'fonts'

UNICODES = (
    list(range(0x20, 0x7F))                       # Basic Latin
    + [0xA0, 0xA9, 0xAB, 0xB0, 0xB7, 0xBB, 0xD7]  # nbsp © « ° · » ×
    + list(range(0x400, 0x460))                   # Cyrillic (incl. і ї є)
    + [0x490, 0x491, 0x2BC]                       # Ґ ґ ʼ
    + list(range(0x2010, 0x2027))                 # dashes, quotes, …
    + [0x2116, 0x20B4, 0x2212, 0x2009, 0x202F]    # № ₴ − thin spaces
)

def _bytes(f):
    b = io.BytesIO(); f.save(b); return b.getvalue()

def build(src, out, limits):
    f = TTFont(SRC / src, lazy=False)
    f = instancer.instantiateVariableFont(f, limits)
    f = TTFont(io.BytesIO(_bytes(f)), lazy=False)  # round-trip: the subsetter chokes on instancer output otherwise
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
    axes = [(a.axisTag, a.minValue, a.maxValue) for a in f['fvar'].axes] if 'fvar' in f else []
    print(out, (OUT / out).stat().st_size // 1024, 'KB', axes, 'missing:', missing or '-')

OUT.mkdir(parents=True, exist_ok=True)
build('Geologica[CRSV,SHRP,slnt,wght].ttf', 'vyshnia-display.woff2', {'wght': (400, 600), 'SHRP': (0, 100), 'CRSV': 0, 'slnt': 0})
build('GolosText[wght].ttf', 'vyshnia-text.woff2', {'wght': (400, 600)})
