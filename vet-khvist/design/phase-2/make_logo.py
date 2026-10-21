"""«Хвіст» wordmark from font outlines (no font needed at runtime).
Lockup: the night door — a dark tile with a lamp-coloured light edge on the left, built exactly like the
«Терміново» panel of the site (the panel is the logo enlarged) — followed by the wordmark «Хвіст» (Piazzolla 600,
opsz 30) and the tagline «ветклініка · Харків» (Ubuntu Sans 560, tracked caps).
Rejected: a boxed «Х» (reads as a close/cancel icon) and a lit «і» (reads as an info sign / a candle).
Outputs: src/components/brand/logo-paths.json (Logo.astro draws with currentColor), public/brand/*.svg,
public/favicon.svg. Run from the project root: python3 design/phase-2/make_logo.py
"""
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen
import json, os

SERIF = 'design/fonts-src/Piazzolla[opsz,wght].ttf'
SANS = 'design/fonts-src/UbuntuSans[wdth,wght].ttf'
NIGHT, LAMP, LAMP_TEXT, INK, DAY = '#2A211C', '#FFC98F', '#FFE6C9', '#1F1915', '#EEECE9'
ntos = lambda v: ('%.2f' % v).rstrip('0').rstrip('.')

_cache = {}
def font(path, loc):
    key = (path, tuple(sorted(loc.items())))
    if key not in _cache:
        _cache[key] = instancer.instantiateVariableFont(TTFont(path), loc)
    return _cache[key]

def text_path(s, path, loc, size, tracking=0.0):
    f = font(path, loc); upm = f['head'].unitsPerEm; sc = size / upm
    gs = f.getGlyphSet(); cmap = f.getBestCmap()
    pen = SVGPathPen(gs, ntos=ntos); bp = BoundsPen(gs)
    x = 0
    for ch in s:
        g = gs[cmap[ord(ch)]]
        if ch != ' ':
            g.draw(TransformPen(pen, (sc, 0, 0, -sc, x * sc, 0)))
            g.draw(TransformPen(bp, (sc, 0, 0, -sc, x * sc, 0)))
        x += g.width + tracking * upm
    return pen.getCommands(), (x - tracking * upm) * sc, bp.bounds  # bounds: xMin, yMin(top, negative), xMax, yMax

# Wordmark
word, ww, wb = text_path('Хвіст', SERIF, {'wght': 600, 'opsz': 30}, 100, tracking=-0.01)
cap = -wb[1]  # height above baseline (incl. і dot)
tag, tw, tb = text_path('ВЕТКЛІНІКА · ХАРКІВ', SANS, {'wdth': 100, 'wght': 560}, 19, tracking=0.12)
tag_scale = min(1.0, ww / tw)

# Door tile: same height as cap + tagline block
tile_h = round(cap + 14 + (-tb[1]) * tag_scale + 2)
tile_w = round(tile_h * 0.62)
edge = round(tile_w * 0.16)
x_mark, xw, xb = text_path('ı', SERIF, {'wght': 600, 'opsz': 30}, tile_h * 0.78)
_, _, ib = text_path('і', SERIF, {'wght': 600, 'opsz': 30}, tile_h * 0.78)
x_off = edge + (tile_w - edge - xw) / 2
x_base = tile_h * 0.80
stem_top = xb[1]; dot_top = ib[1]
dot_r = round((stem_top - dot_top) * 0.42, 2)
dot = (x_off + (xb[0] + xb[2]) / 2, x_base + (dot_top + stem_top) / 2 - 1)
gap = round(tile_h * 0.28)
W = tile_w + gap + ww
paths = {
    'width': round(W, 2), 'height': tile_h,
    'tile': [0, 0, tile_w, tile_h], 'edge': edge,
    'mark': x_mark, 'markTransform': f'translate({x_off:.2f} {x_base:.2f})', 'dot': [round(dot[0], 2), round(dot[1], 2), dot_r],
    'word': word, 'wordTransform': f'translate({tile_w + gap} {cap:.2f})',
    'tag': tag, 'tagTransform': f'translate({tile_w + gap} {tile_h - 2:.2f}) scale({tag_scale:.4f})',
}
os.makedirs('public/brand', exist_ok=True); os.makedirs('src/components/brand', exist_ok=True)
json.dump(paths, open('src/components/brand/logo-paths.json', 'w'))

def door(tile_fill):
    t = paths['tile']; d = paths['dot']
    return (f'<rect x="0" y="0" width="{t[2]}" height="{t[3]}" fill="{tile_fill}"/>'
            f'<rect x="0" y="0" width="{edge}" height="{t[3]}" fill="{LAMP}"/>'
            )
GLOW = ''

def lockup(fg, tagc, tile_fill=NIGHT, title='Ветклініка «Хвіст»'):
    t = paths['tile']
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W:.2f} {tile_h}" role="img"><title>{title}</title>'
            f'{GLOW}{door(tile_fill)}'
            f'<path fill="{fg}" transform="{paths["wordTransform"]}" d="{word}"/>'
            f'<path fill="{tagc}" transform="{paths["tagTransform"]}" d="{tag}"/></svg>')

open('public/brand/khvist-logo.svg', 'w').write(lockup(INK, '#5F5852'))
open('public/brand/khvist-logo-night.svg', 'w').write(lockup(LAMP_TEXT, '#C7AE95', tile_fill='#3D312A'))

def mark_svg(size=64):
    s = size / tile_h
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {tile_w} {tile_h}"><title>Хвіст</title>'
            f'{GLOW}{door(NIGHT)}</svg>')
open('public/brand/khvist-mark.svg', 'w').write(mark_svg())
# Favicon: square canvas, door tile centered.
dx = (tile_h - tile_w) / 2
fav = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {tile_h} {tile_h}"><title>Хвіст</title>{GLOW}'
       f'<rect width="{tile_h}" height="{tile_h}" fill="{NIGHT}"/><g transform="translate({dx:.2f} 0)">{door(NIGHT)}</g></svg>')
open('public/favicon.svg', 'w').write(fav)
print('lockup', round(W), 'x', tile_h, 'tile', tile_w, 'edge', edge, 'tag scale', round(tag_scale, 3))
