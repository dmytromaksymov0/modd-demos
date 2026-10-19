"""Build Brightwater wordmark SVGs from Gabarito outlines (no font needed at runtime).
Run from the site folder: python3 design/phase-2/make_logo.py"""
import json
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

SRC = 'node_modules/@fontsource-variable/gabarito/files/gabarito-latin-wght-normal.woff2'
bold = instantiateVariableFont(TTFont(SRC), {'wght': 800})
semi = instantiateVariableFont(TTFont(SRC), {'wght': 600})

def text_path(font, text, size, x0, y0, track=0.0):
    gs = font.getGlyphSet(); cmap = font.getBestCmap(); upm = font['head'].unitsPerEm
    s = size / upm; pen = SVGPathPen(gs, ntos=lambda v: ('%.1f' % v).rstrip('0').rstrip('.')); x = x0
    kern = {}
    for ch in text:
        if ch == ' ':
            x += font['hmtx'][cmap[32]][0] * s + track * size; continue
        gn = cmap[ord(ch)]
        gs[gn].draw(TransformPen(pen, (s, 0, 0, -s, x, y0)))
        x += font['hmtx'][gn][0] * s + track * size
    return pen.getCommands(), x - track * size

TILE, INK, STONE, SPRING, SUN = '#F7F8F6', '#10231F', '#5B6B67', '#0A6B5D', '#F5C842'

def mark(x, y, d, sun, water, rope):
    """Spring pool seen from the side: sun over the waterline, one lane rope of floats.
    d = diameter. Colours may be CSS vars (inline component) or hex (static files)."""
    r = d / 2; cx, cy = x + r, y + r; hz = y + d * 0.52        # horizon
    clip = f'bw-clip-{abs(hash((x, y, d))) % 9999}'
    floats = ''.join(
        f'<rect x="{x + d * (0.14 + i * 0.152):.2f}" y="{y + d * 0.70:.2f}" width="{d * 0.105:.2f}" height="{d * 0.068:.2f}" rx="{d * 0.034:.2f}" fill="{rope}"/>'
        for i in range(5))
    return (f'<clipPath id="{clip}"><circle cx="{cx:.2f}" cy="{cy:.2f}" r="{r:.2f}"/></clipPath>'
            f'<g clip-path="url(#{clip})"><rect x="{x}" y="{y}" width="{d}" height="{d}" fill="{sun}"/>'
            f'<rect x="{x}" y="{hz:.2f}" width="{d}" height="{d}" fill="{water}"/>'
            f'<rect x="{x}" y="{y + d * 0.73:.2f}" width="{d}" height="{d * 0.012 + 0.6:.2f}" fill="{rope}" opacity=".55"/>{floats}</g>')

def lockup(word_c, sub_c, sun, water, rope, fname):
    D = 52
    word, wx = text_path(bold, 'Brightwater', 40, D + 14, 36, track=-0.02)
    sub, sx = text_path(semi, 'Family Dental · Austin', 14.5, D + 15, 56, track=0.01)
    W = max(wx, sx) + 2
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W:.0f} 62" width="{W:.0f}" height="62" role="img" aria-label="Brightwater Family Dental">'
           f'<title>Brightwater Family Dental</title>{mark(0, 5, D, sun, water, rope)}'
           f'<path d="{word}" fill="{word_c}"/><path d="{sub}" fill="{sub_c}"/></svg>')
    open('public/brand/' + fname, 'w').write(svg)
    return W, word, sub

W, word, sub = lockup(INK, STONE, SUN, SPRING, TILE, 'brightwater-logo.svg')
lockup(TILE, '#B9CFC9', SUN, '#2E8B7C', TILE, 'brightwater-logo-inverse.svg')
open('public/brand/brightwater-mark.svg', 'w').write(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="Brightwater Family Dental">'
    f'<title>Brightwater Family Dental</title><rect width="64" height="64" rx="14" fill="{TILE}"/>{mark(6, 6, 52, SUN, SPRING, TILE)}</svg>')
json.dump({'width': round(W), 'word': word, 'sub': sub,
           'mark': mark(0, 5, 52, '@SUN', '@WATER', '@ROPE')}, open('src/components/brand/logo-paths.json', 'w'))
print('ok', round(W))
