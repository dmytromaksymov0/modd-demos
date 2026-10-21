"""«Вишня» wordmark from font outlines (no font needed at runtime).
Lockup: the tip mark — a cherry nail tip (almond arch on top, straight edge below) with a lacquer gloss streak —
followed by the wordmark «вишня» (Geologica 560, SHRP 100) and the tagline «студія краси · Харків»
(Golos Text 560, tracked caps, same width as the wordmark). No berry anywhere (phase-0 decision).
Outputs: src/components/brand/logo-paths.json (Logo.astro draws with tokens), public/brand/*.svg, public/favicon.svg.
Run from the project root: npm run logo
"""
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen
import json, os

DISPLAY = 'design/fonts-src/Geologica[CRSV,SHRP,slnt,wght].ttf'
TEXT = 'design/fonts-src/GolosText[wght].ttf'
CHERRY, INK, GRAPHITE, PORCELAIN, WHITE = '#7E1631', '#221B1E', '#6B6366', '#F3F3F1', '#FFFFFF'
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
    return pen.getCommands(), (x - tracking * upm) * sc, bp.bounds

word, ww, wb = text_path('вишня', DISPLAY, {'wght': 560, 'SHRP': 100, 'CRSV': 0, 'slnt': 0}, 100, tracking=-0.015)
xh = -wb[1]                                   # x-height (lowercase only)
tag, tw, tb = text_path('СТУДІЯ КРАСИ · ХАРКІВ', TEXT, {'wght': 560}, 18, tracking=0.12)
tag_scale = ww / tw
tag_h = -tb[1] * tag_scale
gap_v = round(xh * 0.42)
H = round(xh + gap_v + tag_h)

# Tip mark: height = full lockup height, width 0.56 h; arch radius = w/2; gloss streak on the left.
tip_h = H; tip_w = round(tip_h * 0.56); r = tip_w / 2; rb = round(tip_w * 0.12)
tip = (f'M{rb} {tip_h}H{tip_w - rb}Q{tip_w} {tip_h} {tip_w} {tip_h - rb}V{r:.2f}'
       f'A{r:.2f} {r:.2f} 0 0 0 0 {r:.2f}V{tip_h - rb}Q0 {tip_h} {rb} {tip_h}Z')
gl_x, gl_w = round(tip_w * 0.2, 2), round(tip_w * 0.11, 2)
gloss = [gl_x, round(tip_h * 0.22, 2), gl_w, round(tip_h * 0.36, 2), round(gl_w / 2, 2)]
gap = round(tip_w * 0.5)
W = tip_w + gap + ww

paths = {
    'width': round(W, 2), 'height': H, 'tipWidth': tip_w,
    'tip': tip, 'gloss': gloss,
    'word': word, 'wordTransform': f'translate({tip_w + gap} {xh:.2f})',
    'tag': tag, 'tagTransform': f'translate({tip_w + gap} {H:.2f}) scale({tag_scale:.4f})',
}
os.makedirs('public/brand', exist_ok=True); os.makedirs('src/components/brand', exist_ok=True)
json.dump(paths, open('src/components/brand/logo-paths.json', 'w'))

def mark(fill=CHERRY):
    g = gloss
    return (f'<path fill="{fill}" d="{tip}"/>'
            f'<rect x="{g[0]}" y="{g[1]}" width="{g[2]}" height="{g[3]}" rx="{g[4]}" fill="{WHITE}" fill-opacity=".5"/>')

def lockup(fg, tagc, title='Вишня, студія краси'):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W:.2f} {H}" role="img"><title>{title}</title>'
            f'{mark()}<path fill="{fg}" transform="{paths["wordTransform"]}" d="{word}"/>'
            f'<path fill="{tagc}" transform="{paths["tagTransform"]}" d="{tag}"/></svg>')

open('public/brand/vyshnia-logo.svg', 'w').write(lockup(INK, GRAPHITE))
open('public/brand/vyshnia-logo-white.svg', 'w').write(lockup(WHITE, '#E9D6CF'))
open('public/brand/vyshnia-mark.svg', 'w').write(
    f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {tip_w} {tip_h}"><title>Вишня</title>{mark()}</svg>')
# Favicon: porcelain square, the tip centred, 78% of the height.
S = round(tip_h / 0.78); dx = (S - tip_w) / 2; dy = (S - tip_h) / 2
open('public/favicon.svg', 'w').write(
    f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {S} {S}"><title>Вишня</title>'
    f'<rect width="{S}" height="{S}" rx="{round(S * 0.22)}" fill="{PORCELAIN}"/><g transform="translate({dx:.2f} {dy:.2f})">{mark()}</g></svg>')
print('lockup', round(W), 'x', H, 'tip', tip_w, 'x-height', round(xh), 'tag scale', round(tag_scale, 3))
