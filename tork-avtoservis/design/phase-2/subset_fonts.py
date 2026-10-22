"""Self-hosted font subsets for ТОРК, built from the full variable fonts in design/fonts-src/
(google/fonts: ScienceGothic[CTRS,slnt,wdth,wght].ttf, Onest[wght].ttf — OFL).
Two files per family, wired with non-overlapping unicode-range in src/styles/fonts.css:
  core  — Ukrainian Cyrillic + ASCII (digits, Latin letters for Telegram/Viber/car names), ₴ № « » ’ — · — one request per family
  latin — rare Latin-1 symbols only, loaded on demand (normally never)
Display (Science Gothic): wght 600–900, wdth 50–150, slnt/CTRS pinned. Text (Onest): wght 400–700."""
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools import subset
import io, os
CORE = ('U+0020-007E,U+00A0,U+00AB,U+00B0,U+00B7,U+00BB,U+00D7,U+2013-2014,U+2018-201E,U+2026,'
        'U+2116,U+20B4,U+2192,U+2212,U+2248,U+0401,U+0404,U+0406-0407,U+0410-044F,U+0451,U+0454,U+0456-0457,U+0490-0491')
LATIN = 'U+00A1-00AA,U+00AC-00AF,U+00B1-00B6,U+00B8-00BA,U+00BC-00BF,U+02BC,U+2010-2012,U+2022,U+2039-203A'

# Science Gothic draws Д Л д л in its default set as Λ-like triangles (САЛТІВКА reads «СААТІВКА»).
# The standard Ukrainian forms are its ss01 / salt alternates (*.alt). They are baked into the cmap of our subsets,
# so every use — plates, headings, the hero face — gets them without font-feature-settings. Review fix 22.10.2026.
UA_FORMS = {0x0414: 'uni0414.alt', 0x041B: 'uni041B.alt', 0x0434: 'uni0434.alt', 0x043B: 'uni043B.alt'}
def ukrainian_forms(f):
    order = set(f.getGlyphOrder())
    for t in f['cmap'].tables:
        if t.isUnicode():
            for u, g in UA_FORMS.items():
                if u in t.cmap and g in order: t.cmap[u] = g

def build(src, name, limits, ua_forms=False):
    base = TTFont(src, lazy=False)
    inst = instancer.instantiateVariableFont(base, limits)
    if ua_forms: ukrainian_forms(inst)
    b = io.BytesIO(); inst.save(b)
    for part, rng in (('core', CORE), ('latin', LATIN)):
        b.seek(0); f = TTFont(b, lazy=False)
        want = subset.parse_unicodes(rng); have = f.getBestCmap()
        us = [u for u in want if u in have]
        o = subset.Options(); o.flavor = 'woff2'; o.layout_features = ['kern', 'liga', 'calt', 'tnum', 'lnum', 'case', 'locl', 'mark', 'mkmk', 'ccmp']
        o.name_IDs = ['*']; o.notdef_outline = True; o.drop_tables += ['STAT'] if False else []
        s = subset.Subsetter(o); s.populate(unicodes=us); s.subset(f)
        out = f'public/fonts/{name}-{part}.woff2'; f.flavor = 'woff2'; f.save(out)
        print(out, os.path.getsize(out), 'missing:', [hex(u) for u in want if u not in have][:12])

build('design/fonts-src/ScienceGothic.ttf', 'tork-display', {'wght': (600, 900), 'wdth': (50, 150), 'slnt': 0, 'CTRS': 0}, ua_forms=True)
build('design/fonts-src/Onest.ttf', 'tork-text', {'wght': (400, 700)})

# Hero face: only the glyphs of the home H1, one static instance (wght 850, wdth 50 — the .t-display setting).
# Preloaded on the home page instead of the full display file, so the LCP headline paints as soon as ~3 KB arrive.
HERO_TEXT = 'Ремонт без сюрпризів у чеку '
def build_hero(src, out):
    f = instancer.instantiateVariableFont(TTFont(src, lazy=False), {'wght': 850, 'wdth': 50, 'slnt': 0, 'CTRS': 0})
    ukrainian_forms(f)
    b = io.BytesIO(); f.save(b); b.seek(0); f = TTFont(b, lazy=False)
    o = subset.Options(); o.flavor = 'woff2'; o.layout_features = ['kern', 'liga', 'calt', 'locl']; o.notdef_outline = True
    s = subset.Subsetter(o); s.populate(text=HERO_TEXT); s.subset(f); f.flavor = 'woff2'; f.save(out)
    print(out, os.path.getsize(out), 'chars:', ''.join(sorted(set(HERO_TEXT))))
build_hero('design/fonts-src/ScienceGothic.ttf', 'public/fonts/tork-hero.woff2')
