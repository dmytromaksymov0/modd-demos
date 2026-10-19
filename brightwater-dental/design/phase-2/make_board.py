"""Photo board for review: python3 make_board.py (from design/phase-2), then screenshot photo-board.html."""
import json, html
ph = json.load(open('photos.json'))
groups = []
for p in ph:
    if not groups or groups[-1][0] != p['g']:
        groups.append((p['g'], []))
    groups[-1][1].append(p)
verdict = {'hero-1-mom-daughter-checkup': 'Reserve', 'hero-2-mom-girl-chair': 'No',
           'hero-3-dad-daughter-xray': 'Pick · in clinic', 'hero-4-dad-kids-brushing': 'Pick · mood'}
sec = []
for g, items in groups:
    hero = g.startswith('Hero')
    cards = ''.join(
        f'<figure><img src="thumbs/{p["f"]}.jpg" alt=""><figcaption><b>{p["f"]}</b>'
        + (f' <em class="v v{verdict[p["f"]][:2]}">{verdict[p["f"]]}</em>' if p['f'] in verdict else '')
        + f'<span>{html.escape(p["note"])}</span><small>{html.escape(p["by"])} · {p["src"]}</small></figcaption></figure>'
        for p in items)
    sec.append(f'<section><h2>{g} <small>{len(items)}</small></h2><div class="grid {"hero" if hero else ""}">{cards}</div></section>')
rejected = ('Rejected after a full-size check: Dentify-branded doctor portraits (real clinic logo + a real dentist\'s embroidered name), '
            'a waiting room with a song lyric on a letter board, a front desk with a clinic logo on the wall, a hygienist with a real practice name badge.')
doc = f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Brightwater — photo board (phase 2)</title>
<link rel="stylesheet" href="../../node_modules/@fontsource-variable/gabarito/index.css"><link rel="stylesheet" href="../../node_modules/@fontsource-variable/atkinson-hyperlegible-next/index.css">
<style>
:root{{--tile:#F7F8F6;--ink:#10231F;--stone:#5B6B67;--spring:#0A6B5D;--sun:#F5C842}}
*{{box-sizing:border-box;margin:0}} body{{background:var(--tile);color:var(--ink);font:15px/1.45 "Atkinson Hyperlegible Next Variable",system-ui;padding:40px}}
h1{{font:800 40px/1 "Gabarito Variable";letter-spacing:-.03em}} .lede{{color:var(--stone);max-width:85ch;margin:12px 0 8px}}
h2{{font:750 24px/1 "Gabarito Variable";margin:36px 0 16px}} h2 small{{font-size:15px;color:var(--stone)}}
.grid{{display:grid;grid-template-columns:repeat(6,1fr);gap:16px}} .grid.hero{{grid-template-columns:repeat(4,1fr)}}
figure{{background:#fff;border-radius:12px;overflow:hidden}} img{{display:block;width:100%;aspect-ratio:4/3;object-fit:cover}} .hero img{{aspect-ratio:3/2}}
figcaption{{padding:10px 12px 12px;display:grid;gap:4px}} figcaption b{{font:700 13px "Gabarito Variable"}} figcaption span{{font-size:13px}} figcaption small{{color:var(--stone);font-size:12px}}
.v{{font:700 12px "Gabarito Variable";padding:2px 8px;border-radius:99px;justify-self:start}} .vPi{{background:var(--spring);color:#fff}} .vRe{{background:var(--sun)}} .vNo{{background:#eee;color:var(--stone)}}
</style></head><body><h1>Brightwater Family Dental — photo board</h1>
<p class="lede">{len(ph)} real photos (Pexels / Unsplash, free licenses), each checked at full size for logos, name badges and readable text. Hero brief: “Saturday morning — light room, a child with a parent, few instruments”. Stock has no perfect frame; four honest candidates, two recommended.</p>
<p class="lede">{html.escape(rejected)}</p>
{''.join(sec)}</body></html>'''
open('photo-board.html', 'w').write(doc)
print(len(ph), 'photos')
