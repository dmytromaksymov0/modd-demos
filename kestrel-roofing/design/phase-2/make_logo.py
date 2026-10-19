"""Build Kestrel wordmark SVGs from Archivo (wdth 125) + IBM Plex Mono outlines.
Run: python3 design/phase-2/make_logo.py"""
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen

NM = 'node_modules/'
arch = instantiateVariableFont(TTFont(NM + '@fontsource-variable/archivo/files/archivo-latin-wdth-normal.woff2'), {'wdth': 125, 'wght': 800})
mono = TTFont(NM + '@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-500-normal.woff2')

def text_path(font, text, size, x0, y0, track=0.0):
    gs = font.getGlyphSet(); cmap = font.getBestCmap(); upm = font['head'].unitsPerEm
    s = size / upm; pen = SVGPathPen(gs); x = x0; bp = BoundsPen(gs)
    for ch in text:
        if ch == ' ':
            x += font['hmtx'][cmap[32]][0] * s + track * size; continue
        gn = cmap[ord(ch)]
        tp = TransformPen(pen, (s, 0, 0, -s, x, y0)); gs[gn].draw(tp)
        tb = TransformPen(bp, (s, 0, 0, -s, x, y0)); gs[gn].draw(tb)
        x += font['hmtx'][gn][0] * s + track * size
    return pen.getCommands(), x - track * size, bp.bounds

INK, BLUE, PAPER = '#14181C', '#2341D6', '#F4F5F3'

def mark(x, y, s, ink, dot):
    # Roof pitch chevron (also a kestrel's wings in a hover) + annotation pin above the ridge.
    t = 0.3 * s                      # stroke weight
    ax, ay = x + s, y + 0.12 * s     # apex
    lx, rx, by = x, x + 2 * s, y + s # wing tips
    k = t / 0.62                     # vertical offset of the inner edge
    chevron = (f'M{lx:.1f},{by:.1f} L{ax:.1f},{ay:.1f} L{rx:.1f},{by:.1f} L{rx - t * 0.9:.1f},{by + t * 0.55:.1f} '
               f'L{ax:.1f},{ay + k:.1f} L{lx + t * 0.9:.1f},{by + t * 0.55:.1f} Z')
    return (f'<path d="{chevron}" fill="{ink}"/>'
            f'<circle cx="{ax:.1f}" cy="{y - 0.2 * s:.1f}" r="{0.19 * s:.1f}" fill="{dot}"/>')

def lockup(ink, dot, sub, fname):
    m = 30  # mark unit (wing span = 2m)
    word, wx, wb = text_path(arch, 'KESTREL', 48, 2 * m + 18, 52, track=0.01)
    small, sx, sb = text_path(mono, 'ROOFING CO. · COLUMBUS, OH', 12.5, 2 * m + 20, 76, track=0.08)
    W = max(wx, sx) + 2
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W:.0f} 84" width="{W:.0f}" height="84" role="img" aria-label="Kestrel Roofing Co.">'
           f'<title>Kestrel Roofing Co.</title>{mark(0, 21, m, ink, dot)}'
           f'<path d="{word}" fill="{ink}"/><path d="{small}" fill="{sub}"/></svg>')
    open('public/brand/' + fname, 'w').write(svg)
    return W, word, small

W, word, small = lockup(INK, BLUE, '#545C63', 'kestrel-logo.svg')
lockup(PAPER, '#8EA2FF', '#AEB6BC', 'kestrel-logo-inverse.svg')
# Mark only (favicon / avatar), square.
open('public/brand/kestrel-mark.svg', 'w').write(
    f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="Kestrel Roofing Co."><title>Kestrel Roofing Co.</title>'
    f'<rect width="64" height="64" rx="10" fill="{INK}"/>{mark(9, 24, 23, PAPER, "#8EA2FF")}</svg>')
# Inline component paths (colours via CSS custom properties).
import json
json.dump({'width': round(W), 'word': word, 'small': small, 'mark': mark(0, 21, 30, '@INK', '@DOT')},
          open('src/components/brand/logo-paths.json', 'w'))
print('ok', round(W))
