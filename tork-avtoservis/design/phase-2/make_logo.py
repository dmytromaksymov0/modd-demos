"""ТОРК wordmark from Science Gothic outlines (no font needed at runtime).
Wordmark: «ТОРК» at wdth 150 / wght 820 — wide, like lettering on a Derzhprom facade — sitting on an ochre
"bridge" bar (the galleries that connect Derzhprom's towers). Tagline «АВТОСЕРВІС · САЛТІВКА» at wdth 150 / wght 600.
Outputs: public/brand/tork-logo.svg, tork-logo-inverse.svg, tork-mark.svg, public/favicon.svg,
src/components/brand/logo-paths.json (paths used by Logo.astro with currentColor)."""
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
import json, os
SRC = 'node_modules/@fontsource-variable/science-gothic/files/science-gothic-cyrillic-standard-normal.woff2'
STEEL, OCHRE, PAPER = '#20262A', '#E0A01A', '#F4F4F1'

def text_path(s, wdth, wght, size, tracking=0):
    fonts = [instancer.instantiateVariableFont(TTFont(p), {'wdth': wdth, 'wght': wght, 'slnt': 0}) for p in (SRC, SRC.replace('cyrillic', 'latin'))]
    f = fonts[0]; upm = f['head'].unitsPerEm; sc = size / upm
    pen = SVGPathPen(f.getGlyphSet(), ntos=lambda v: ('%.2f' % v).rstrip('0').rstrip('.'))
    x = 0
    for ch in s:
        ff = next(F for F in fonts if ord(ch) in F.getBestCmap()); gs = ff.getGlyphSet()
        g = gs[ff.getBestCmap()[ord(ch)]]
        if ch == ' ': x += g.width + tracking * upm; continue
        g.draw(TransformPen(pen, (sc, 0, 0, -sc, x * sc, 0)))
        x += g.width + tracking * upm
    asc = f['OS/2'].sCapHeight * sc
    return pen.getCommands(), (x - tracking * upm) * sc, asc

word, ww, cap = text_path('ТОРК', 150, 820, 100, tracking=0.04)
tag, tw, tcap = text_path('АВТОСЕРВІС · САЛТІВКА', 150, 600, 22, tracking=0.06)
gap, bar = 14, 10
H = cap + gap + bar + 12 + tcap
scale_tag = min(1, ww / tw)
paths = {
  'width': round(ww, 2), 'height': round(H, 2), 'cap': round(cap, 2),
  'word': word, 'wordTransform': f'translate(0 {cap:.2f})',
  'bar': [0, round(cap + gap, 2), round(ww, 2), bar],
  'tag': tag, 'tagTransform': f'translate(0 {cap + gap + bar + 12 + tcap * scale_tag:.2f}) scale({scale_tag:.4f})',
}
os.makedirs('public/brand', exist_ok=True); os.makedirs('src/components/brand', exist_ok=True)
json.dump(paths, open('src/components/brand/logo-paths.json', 'w'))

def svg(fg, accent, bg=None, title='ТОРК Автосервіс'):
    b = paths['bar']; pad = 0 if not bg else 16
    W, Hh = ww + 2 * pad, H + 2 * pad
    rect = f'<rect width="{W:.0f}" height="{Hh:.0f}" fill="{bg}"/>' if bg else ''
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W:.2f} {Hh:.2f}" role="img"><title>{title}</title>{rect}'
            f'<g transform="translate({pad} {pad})"><path fill="{fg}" transform="{paths["wordTransform"]}" d="{word}"/>'
            f'<rect x="{b[0]}" y="{b[1]}" width="{b[2]}" height="{b[3]}" fill="{accent}"/>'
            f'<path fill="{fg}" transform="{paths["tagTransform"]}" d="{tag}"/></g></svg>')
open('public/brand/tork-logo.svg', 'w').write(svg(STEEL, OCHRE))
open('public/brand/tork-logo-inverse.svg', 'w').write(svg(PAPER, OCHRE, STEEL))
# Footer: light wordmark on transparent background, served as a cached file instead of inline paths.
open('public/brand/tork-logo-mono-light.svg', 'w').write(svg(PAPER, OCHRE))

# Mark: steel window with an ochre bridge and a wide «Т».
t, tw1, tc = text_path('Т', 150, 860, 46)
mark = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><title>ТОРК</title><rect width="64" height="64" fill="{STEEL}"/>'
        f'<rect x="8" y="44" width="48" height="8" fill="{OCHRE}"/>'
        f'<path fill="{PAPER}" transform="translate({(64 - tw1) / 2:.2f} {8 + tc:.2f})" d="{t}"/></svg>')
open('public/brand/tork-mark.svg', 'w').write(mark); open('public/favicon.svg', 'w').write(mark)
print('wordmark', round(ww), 'x', round(H), 'tag scale', round(scale_tag, 3))
