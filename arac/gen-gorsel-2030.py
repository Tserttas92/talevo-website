# -*- coding: utf-8 -*-
"""
============================================================
 TALEVO — "Mesleklerin 2030'a akışı" hero görsel üreteci (kalıcı)
 Üç sürümü de tek dosyadan üretir:
   images/icgoruler/2030-hero.svg       (1600×900, makale hero)
   images/icgoruler/2030-hero-og.svg    (1200×630, sosyal / og:image)
   images/icgoruler/2030-hero-kart.svg  (640×360,  hub kart kapağı)

 KULLANIM (repo kökünden çalıştır):
   python3 arac/gen-gorsel-2030.py            # yalnız ANA sürüm (2030-hero.svg)
   python3 arac/gen-gorsel-2030.py --og       # yalnız OG sürümü
   python3 arac/gen-gorsel-2030.py --kart      # yalnız KART sürümü
   python3 arac/gen-gorsel-2030.py --og --kart # OG + KART
   python3 arac/gen-gorsel-2030.py --hepsi     # üçü birden

 BAĞIMLILIKLAR:
   - fonttools + brotli  → ZORUNLU (SVG üretimi; "2030" yazısı woff2 fontundan
     <path>'e çevrilir). Kur: pip3 install --user fonttools brotli
   - PIL/Pillow          → yalnız WebP ÖNİZLEME üretimi için (bu script SVG üretir;
     WebP ayrı adımdır — aşağıya bak). Kur: pip3 install --user pillow

 WebP ÖNİZLEME (SVG rasterize aracı yoksa Chrome headless ile):
   Bu ortamda rsvg-convert/resvg/cairosvg YOK. WebP'ler Chrome headless (PNG) +
   PIL (WEBP q82) ile üretildi. Komut için arac/README.md "Makale Görselleri"ne bak.

 "2030" NOTU: Görseldeki "2030" yazısı GÖMÜLÜ METİN DEĞİL, fonts/manrope-800.woff2'den
   <path>'e çevrilmiştir (font bağımlılığı yok). Başka bir yıl gerekiyorsa (ör. 2031)
   path_2030() içindeki "2030" dizisini değiştirip scripti YENİDEN çalıştır — elle
   düzenlenemez.

 Font yolu ve çıktı yolu repo köküne görelidir (script konumundan çözülür).
============================================================
"""
import sys, os, math, re, argparse

try:
    from fontTools.ttLib import TTFont
    from fontTools.pens.svgPathPen import SVGPathPen
    from fontTools.pens.transformPen import TransformPen
except ImportError as e:
    sys.exit("HATA: 'fonttools' gerekli. Kur: pip3 install --user fonttools brotli\n  Ayrıntı: " + str(e))
try:
    import brotli  # noqa: F401  (woff2 açmak için fontTools tarafından kullanılır)
except ImportError:
    sys.exit("HATA: 'brotli' gerekli (woff2 fontunu açmak için). Kur: pip3 install --user brotli")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))   # repo kökü
OUT  = os.path.join(ROOT, "images", "icgoruler") + os.sep
FONT = os.path.join(ROOT, "fonts", "manrope-800.woff2")
if not os.path.exists(FONT):
    sys.exit("HATA: font bulunamadı: " + FONT + "\n  (repo kökünden çalıştırdığından emin ol)")

# ---- "2030" glifini path'e çevir (font_size/2000 ölçek, baseline'a oturt, letter-spacing) ----
def path_2030(font_size, left_x, baseline_y, ls):
    f = TTFont(FONT); upm = f["head"].unitsPerEm; sc = font_size / upm
    cmap = f.getBestCmap(); gs = f.getGlyphSet(); penX = 0.0; parts = []
    for ch in "2030":
        g = cmap[ord(ch)]; spen = SVGPathPen(gs)
        gs[g].draw(TransformPen(spen, (sc, 0, 0, -sc, left_x + penX, baseline_y)))
        d = spen.getCommands()
        if d: parts.append(d)
        penX += gs[g].width * sc + ls
    return " ".join(parts), left_x + penX - ls

def hexagon(cx, cy, R):
    return " ".join(f"{round(cx+R*math.cos(math.radians(a)),2)},{round(cy+R*math.sin(math.radians(a)),2)}" for a in range(0, 360, 60))

# ==== ANA SÜRÜM (1600×900) — 12-örnekli merkez-çizgi projeksiyonu ====
def _pp12(d):
    toks = re.findall(r'[MC]|-?\d+\.?\d*', d); pts = []; i = 0; cur = None
    while i < len(toks):
        t = toks[i]
        if t == 'M':
            cur = (float(toks[i+1]), float(toks[i+2])); pts.append(cur); i += 3
        elif t == 'C':
            p0 = cur; p1 = (float(toks[i+1]), float(toks[i+2])); p2 = (float(toks[i+3]), float(toks[i+4])); p3 = (float(toks[i+5]), float(toks[i+6]))
            for k in range(1, 13):
                tt = k/12; mt = 1-tt
                x = mt**3*p0[0]+3*mt**2*tt*p1[0]+3*mt*tt**2*p2[0]+tt**3*p3[0]
                y = mt**3*p0[1]+3*mt**2*tt*p1[1]+3*mt*tt**2*p2[1]+tt**3*p3[1]
                pts.append((x, y))
            cur = p3; i += 7
        else: i += 1
    return pts
def _mindist(pt, pts):
    return min(math.hypot(pt[0]-p[0], pt[1]-p[1]) for p in pts)

def build_main():
    s = []
    s.append('<rect x="0" y="0" width="1600" height="900" rx="28" fill="#0D0D16"/>')
    s.append('<ellipse cx="1285" cy="447" rx="329" ry="216" fill="#48218E" opacity=".07"/>')
    s.append('<circle cx="555" cy="499" r="447" fill="#6B4BA8" opacity=".04"/>')
    ust_bank = 'M71 297 C 306 301, 518 353, 753 358 C 918 362, 998 386, 1078 400'
    alt_bank = 'M71 734 C 329 748, 541 706, 729 640 C 875 588, 993 499, 1078 466'
    s.append(f'<path d="{ust_bank}" fill="none" stroke="#FFFFFF" stroke-opacity=".09" stroke-width="2.4"/>')
    s.append(f'<path d="{alt_bank}" fill="none" stroke="#FFFFFF" stroke-opacity=".09" stroke-width="2.4"/>')
    up = 'M94 348 C 282 353, 400 400, 565 414 C 729 428, 904 447, 1064 456'
    green = 'M94 697 C 329 706, 494 678, 659 617 C 800 565, 946 499, 1064 466'
    sec = 'M94 588 C 306 593, 447 555, 617 513 C 777 475, 927 447, 1064 438'
    main = 'M94 471 C 329 461, 471 395, 659 376 C 824 360, 946 395, 1064 419'
    ca = 'M94 471 C 278 464, 391 428, 504 402'
    cb = 'M504 402 C 574 386, 631 372, 706 367'
    cc = 'M706 367 C 828 360, 951 395, 1064 419'
    s.append(f'<path d="{up}" fill="none" stroke="#48218E" stroke-width="21" opacity=".5" stroke-linecap="round"/>')
    s.append(f'<path d="{green}" fill="none" stroke="#5FC79A" stroke-width="12" opacity=".26" stroke-linecap="round"/>')
    s.append(f'<path d="{sec}" fill="none" stroke="#7B5BC4" stroke-width="24" opacity=".34" stroke-linecap="round"/>')
    s.append(f'<path d="{sec}" fill="none" stroke="#9F7BEA" stroke-width="3.8" opacity=".5" stroke-linecap="round"/>')
    s.append(f'<path d="{main}" fill="none" stroke="#6B4BA8" stroke-width="35" opacity=".34" stroke-linecap="round"/>')
    s.append(f'<path d="{ca}" fill="none" stroke="#9F7BEA" stroke-width="4.9" opacity=".72" stroke-linecap="round"/>')
    s.append(f'<path d="{cb}" fill="none" stroke="#FF6A35" stroke-width="28" opacity=".08" stroke-linecap="round"/>')
    s.append(f'<path d="{cb}" fill="none" stroke="#FF6A35" stroke-width="6.8" opacity=".95" stroke-linecap="round"/>')
    s.append(f'<path d="{cc}" fill="none" stroke="#9F7BEA" stroke-width="5.6" opacity=".9" stroke-linecap="round"/>')
    s.append(f'<path d="{path_2030(169,1115,513,-3.5)[0]}" fill="#9F7BEA" fill-opacity=".09" stroke="#9F7BEA" stroke-opacity=".68" stroke-width="3.3" stroke-linejoin="round"/>')
    s.append('<line x1="828" y1="249" x2="805" y2="362" stroke="#FFFFFF" stroke-opacity=".16" stroke-width="1.4"/>')
    s.append(f'<polygon points="{hexagon(838,216,30)}" fill="#2A1B4D" stroke="#9F7BEA" stroke-width="3"/>')
    s.append('<circle cx="838" cy="216" r="9.4" fill="#9F7BEA"/>')
    for x, y, r, op, col in [(922,169,5.6,.55,'#9F7BEA'), (955,207,4.5,.4,'#9F7BEA'), (904,132,3.8,.3,'#9F7BEA'), (965,146,3.3,.14,'#FFFFFF')]:
        s.append(f'<circle cx="{x}" cy="{y}" r="{r}" fill="{col}" opacity="{op}"/>')
    s.append('<line x1="254" y1="744" x2="297" y2="692" stroke="#FFFFFF" stroke-opacity=".14" stroke-width="1.4"/>')
    s.append(f'<polygon points="{hexagon(245,767,26)}" fill="#12332A" stroke="#5FC79A" stroke-width="2.8"/>')
    s.append('<circle cx="245" cy="767" r="8" fill="#5FC79A"/>')
    s.append('<circle cx="174" cy="809" r="4.2" fill="#5FC79A" opacity=".4"/>')
    def human(cx, cy):
        body = f'M {cx-14.6} {cy+35} v-14 a 14.6 14.6 0 0 1 29.2 0 v14 z'
        return (f'<path d="{body}" fill="#E4E1F2" opacity=".9"/>'
                f'<circle cx="{cx}" cy="{cy}" r="10.4" fill="#E4E1F2"/>')
    s.append('<line x1="438" y1="734" x2="461" y2="687" stroke="#FFFFFF" stroke-opacity=".14" stroke-width="1.4"/>')
    s.append(human(438, 767))
    s.append('<line x1="1007" y1="555" x2="1021" y2="480" stroke="#FFFFFF" stroke-opacity=".14" stroke-width="1.4"/>')
    s.append(human(1007, 588))
    marks = []
    marks.append(('rect', 207, 461, 17.6, '#C4A9F5', .85, 6, 'ana'))
    marks.append(('circle', 391, 419, 9.4, '#9F7BEA', .9, None, 'ana'))
    marks.append(('rrect', 607, 360, 21, '#FF6A35', 1, 6.6, 'ana'))
    marks.append(('tri', 838, 353, None, '#C4A9F5', .9, None, 'ana'))
    marks.append(('circle', 998, 405, 10.4, '#9F7BEA', 1, None, 'ana'))
    marks.append(('circle', 287, 591, 8, '#9F7BEA', .6, None, 'sec'))
    marks.append(('rect', 513, 530, 15.3, '#9F7BEA', .65, None, 'sec'))
    marks.append(('tri', 744, 468, None, '#9F7BEA', .6, None, 'sec'))
    marks.append(('circle', 960, 442, 8.5, '#9F7BEA', .7, None, 'sec'))
    marks.append(('tri', 348, 360, None, '#7B5BC4', .55, None, 'up'))
    marks.append(('circle', 649, 421, 7.5, '#7B5BC4', .55, None, 'up'))
    marks.append(('rect', 908, 445, 12.9, '#7B5BC4', .6, None, 'up'))
    marks.append(('circle', 466, 687, 7, '#5FC79A', .45, None, 'green'))
    marks.append(('circle', 758, 569, 6.1, '#5FC79A', .4, None, 'green'))
    # PROJEKSİYON: her işaret merkezini ilgili akıntının merkez çizgisine snap et (>6px sapanı)
    core_ana = _pp12(ca) + _pp12(cb) + _pp12(cc)
    stream_pts = {'ana': core_ana, 'sec': _pp12(sec), 'up': _pp12(up), 'green': _pp12(green)}
    def nearest(pt, pts):
        best = None; bd = 1e9
        for q in pts:
            d = (pt[0]-q[0])**2 + (pt[1]-q[1])**2
            if d < bd: bd = d; best = q
        return best
    def mcenter(m):
        kind, x, y, sz, col, op, rx, stream = m
        if kind in ('rect', 'rrect'): return (x+sz/2, y+sz/2)
        if kind == 'circle': return (x, y)
        if kind == 'tri': return (x, y+23/2)
    nm = []
    for m in marks:
        kind, x, y, sz, col, op, rx, stream = m
        c = mcenter(m); tgt = nearest(c, stream_pts[stream])
        dx, dy = tgt[0]-c[0], tgt[1]-c[1]
        if math.hypot(dx, dy) > 6:
            x, y = x+dx, y+dy
        nm.append((kind, round(x, 1), round(y, 1), sz, col, op, rx, stream))
    marks = nm
    for m in marks:
        kind, x, y, sz, col, op, rx, stream = m
        if kind == 'rect':
            s.append(f'<rect x="{x}" y="{y}" width="{sz}" height="{sz}" fill="{col}" opacity="{op}"/>')
        elif kind == 'rrect':
            s.append(f'<rect x="{x}" y="{y}" width="{sz}" height="{sz}" rx="{rx}" fill="{col}" opacity="{op}"/>')
        elif kind == 'circle':
            s.append(f'<circle cx="{x}" cy="{y}" r="{sz}" fill="{col}" opacity="{op}"/>')
        elif kind == 'tri':
            s.append(f'<polygon points="{x},{y} {x+13},{y+23} {x-13},{y+23}" fill="{col}" opacity="{op}"/>')
    s.append('<circle cx="1064" cy="419" r="11.8" fill="#9F7BEA"/>')
    s.append('<circle cx="1064" cy="438" r="8" fill="#7B5BC4" opacity=".7"/>')
    s.append('<circle cx="1064" cy="456" r="6.6" fill="#48218E" opacity=".8"/>')
    s.append('<circle cx="1064" cy="466" r="5.2" fill="#5FC79A" opacity=".5"/>')
    for x, y, r, op in [(120,150,3.5,.14), (1470,760,4,.12), (1400,150,3,.16), (150,470,3,.10)]:
        s.append(f'<circle cx="{x}" cy="{y}" r="{r}" fill="#9F7BEA" opacity="{op}"/>')
    body = "\n".join(s)
    return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" role="img" aria-labelledby="t d">\n'
            '<title id="t">Mesleklerin 2030\'a akışı</title>\n'
            '<desc id="d">Soldan sağa akan bir dere yatağı; su yerine meslekleri temsil eden küçük geometrik işaretler akıyor ve sağda içi boş büyük 2030 yazısına dökülüyor. Mor tonlarda, turuncu bir dönüşüm anıyla, minimal ve sakin.</desc>\n'
            + body + '\n</svg>\n')

# ==== OG (1200×630) + KART (640×360) — 16-örnekli merkez-çizgi snap'i ====
def _pp16(d):
    toks = re.findall(r'[MC]|-?\d+\.?\d*', d); pts = []; i = 0; cur = None
    while i < len(toks):
        t = toks[i]
        if t == 'M':
            cur = (float(toks[i+1]), float(toks[i+2])); pts.append(cur); i += 3
        elif t == 'C':
            p0 = cur; p1 = (float(toks[i+1]), float(toks[i+2])); p2 = (float(toks[i+3]), float(toks[i+4])); p3 = (float(toks[i+5]), float(toks[i+6]))
            for k in range(1, 17):
                tt = k/16; mt = 1-tt
                pts.append((mt**3*p0[0]+3*mt**2*tt*p1[0]+3*mt*tt**2*p2[0]+tt**3*p3[0],
                            mt**3*p0[1]+3*mt**2*tt*p1[1]+3*mt*tt**2*p2[1]+tt**3*p3[1]))
            cur = p3; i += 7
        else: i += 1
    return pts
def _nearest16(pt, pts):
    best = None; bd = 1e9
    for q in pts:
        d = (pt[0]-q[0])**2 + (pt[1]-q[1])**2
        if d < bd: bd = d; best = q
    return best
def _svg_wrap(vb_w, vb_h, body, title, desc):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {vb_w} {vb_h}" role="img" aria-labelledby="t d">\n'
            f'<title id="t">{title}</title>\n<desc id="d">{desc}</desc>\n' + body + '\n</svg>\n')

_TITLE = "Mesleklerin 2030'a akışı"
_DESC = "Soldan sağa akan bir dere yatağı; su yerine meslekleri temsil eden küçük geometrik işaretler akıyor ve sağda içi boş büyük 2030 yazısına dökülüyor."

def _mark(kind, cx, cy, sz, col, op, stream_pts, rx=None):
    tgt = _nearest16((cx, cy), stream_pts); cx, cy = tgt
    if kind == 'circle': return f'<circle cx="{round(cx,1)}" cy="{round(cy,1)}" r="{sz}" fill="{col}" opacity="{op}"/>'
    if kind == 'rect': return f'<rect x="{round(cx-sz/2,1)}" y="{round(cy-sz/2,1)}" width="{sz}" height="{sz}" fill="{col}" opacity="{op}"/>'
    if kind == 'rrect': return f'<rect x="{round(cx-sz/2,1)}" y="{round(cy-sz/2,1)}" width="{sz}" height="{sz}" rx="{rx}" fill="{col}" opacity="{op}"/>'
    if kind == 'tri':
        h = sz; return f'<polygon points="{round(cx,1)},{round(cy-h*0.55,1)} {round(cx+h*0.55,1)},{round(cy+h*0.45,1)} {round(cx-h*0.55,1)},{round(cy+h*0.45,1)}" fill="{col}" opacity="{op}"/>'

def build_og():
    s = ['<rect x="0" y="0" width="1200" height="630" rx="22" fill="#0D0D16"/>']
    s.append('<ellipse cx="980" cy="320" rx="250" ry="180" fill="#48218E" opacity=".07"/>')
    s.append('<circle cx="360" cy="360" r="330" fill="#6B4BA8" opacity=".04"/>')
    s.append('<path d="M50 200 C 230 204, 400 248, 560 252 C 660 255, 720 268, 772 278" fill="none" stroke="#FFFFFF" stroke-opacity=".08" stroke-width="2.2"/>')
    s.append('<path d="M50 520 C 250 528, 420 486, 560 420 C 660 372, 720 305, 772 292" fill="none" stroke="#FFFFFF" stroke-opacity=".08" stroke-width="2.2"/>')
    up = 'M60 250 C 220 254, 330 292, 470 300 C 610 308, 700 300, 772 296'
    sec = 'M60 410 C 220 414, 340 384, 480 352 C 610 322, 700 300, 772 290'
    green = 'M60 500 C 240 506, 380 480, 500 420 C 620 360, 710 300, 772 288'
    main = 'M60 300 C 220 294, 330 256, 470 244 C 600 233, 690 262, 772 284'
    ca = 'M60 300 C 180 296, 280 272, 372 260'
    cb = 'M372 260 C 420 253, 452 250, 500 247'
    cc = 'M500 247 C 600 240, 690 262, 772 284'
    s.append(f'<path d="{up}" fill="none" stroke="#48218E" stroke-width="16" opacity=".5" stroke-linecap="round"/>')
    s.append(f'<path d="{green}" fill="none" stroke="#5FC79A" stroke-width="9" opacity=".26" stroke-linecap="round"/>')
    s.append(f'<path d="{sec}" fill="none" stroke="#7B5BC4" stroke-width="18" opacity=".34" stroke-linecap="round"/>')
    s.append(f'<path d="{sec}" fill="none" stroke="#9F7BEA" stroke-width="3" opacity=".5" stroke-linecap="round"/>')
    s.append(f'<path d="{main}" fill="none" stroke="#6B4BA8" stroke-width="27" opacity=".34" stroke-linecap="round"/>')
    s.append(f'<path d="{ca}" fill="none" stroke="#9F7BEA" stroke-width="4" opacity=".72" stroke-linecap="round"/>')
    s.append(f'<path d="{cb}" fill="none" stroke="#FF6A35" stroke-width="22" opacity=".08" stroke-linecap="round"/>')
    s.append(f'<path d="{cb}" fill="none" stroke="#FF6A35" stroke-width="5.6" opacity=".95" stroke-linecap="round"/>')
    s.append(f'<path d="{cc}" fill="none" stroke="#9F7BEA" stroke-width="4.6" opacity=".9" stroke-linecap="round"/>')
    d2030, _ = path_2030(150, 800, 392, -3.2)
    s.append(f'<path d="{d2030}" fill="#9F7BEA" fill-opacity=".09" stroke="#9F7BEA" stroke-opacity=".68" stroke-width="3"/>')
    s.append('<line x1="648" y1="150" x2="628" y2="240" stroke="#FFFFFF" stroke-opacity=".16" stroke-width="1.3"/>')
    s.append(f'<polygon points="{hexagon(656,126,25)}" fill="#2A1B4D" stroke="#9F7BEA" stroke-width="2.8"/>')
    s.append('<circle cx="656" cy="126" r="8" fill="#9F7BEA"/>')
    s.append('<circle cx="720" cy="96" r="4.5" fill="#9F7BEA" opacity=".5"/><circle cx="748" cy="120" r="3.5" fill="#9F7BEA" opacity=".35"/>')
    s.append(f'<polygon points="{hexagon(150,516,22)}" fill="#12332A" stroke="#5FC79A" stroke-width="2.6"/>')
    s.append('<circle cx="150" cy="516" r="7" fill="#5FC79A"/><circle cx="96" cy="548" r="3.6" fill="#5FC79A" opacity=".4"/>')
    core = _pp16(ca) + _pp16(cb) + _pp16(cc); secp = _pp16(sec); grp = _pp16(green); upp = _pp16(up)
    s.append(_mark('rect', 150, 290, 14, '#C4A9F5', .85, core))
    s.append(_mark('rrect', 440, 250, 17, '#FF6A35', 1, core, rx=5.5))
    s.append(_mark('tri', 600, 255, 17, '#C4A9F5', .9, core))
    s.append(_mark('circle', 720, 282, 8, '#9F7BEA', 1, core))
    s.append(_mark('circle', 300, 392, 6.5, '#9F7BEA', .6, secp))
    s.append(_mark('rect', 540, 330, 12, '#9F7BEA', .6, secp))
    s.append(_mark('circle', 430, 452, 6, '#5FC79A', .45, grp))
    s.append(_mark('tri', 360, 300, 13, '#7B5BC4', .5, upp))
    s.append('<circle cx="772" cy="284" r="10" fill="#9F7BEA"/><circle cx="772" cy="298" r="7" fill="#7B5BC4" opacity=".7"/><circle cx="772" cy="310" r="5.5" fill="#48218E" opacity=".8"/>')
    for x, y, r, op in [(120,120,3,.14), (1080,540,3.5,.12), (1050,120,2.6,.14)]:
        s.append(f'<circle cx="{x}" cy="{y}" r="{r}" fill="#9F7BEA" opacity="{op}"/>')
    return _svg_wrap(1200, 630, "\n".join(s), _TITLE, _DESC)

def build_kart():
    s = ['<rect x="0" y="0" width="640" height="360" rx="16" fill="#0D0D16"/>']
    s.append('<ellipse cx="520" cy="180" rx="150" ry="120" fill="#48218E" opacity=".07"/>')
    up = 'M30 150 C 130 154, 200 176, 290 182 C 360 187, 400 182, 430 180'
    green = 'M30 300 C 150 304, 240 286, 320 246 C 380 216, 420 186, 430 178'
    main = 'M30 185 C 130 180, 200 150, 300 142 C 370 137, 405 158, 430 172'
    ca = 'M30 185 C 100 181, 160 166, 214 158'
    cb = 'M214 158 C 250 152, 274 150, 300 148'
    cc = 'M300 148 C 360 143, 405 158, 430 172'
    s.append(f'<path d="{up}" fill="none" stroke="#48218E" stroke-width="16" opacity=".5" stroke-linecap="round"/>')
    s.append(f'<path d="{green}" fill="none" stroke="#5FC79A" stroke-width="9" opacity=".28" stroke-linecap="round"/>')
    s.append(f'<path d="{main}" fill="none" stroke="#6B4BA8" stroke-width="24" opacity=".36" stroke-linecap="round"/>')
    s.append(f'<path d="{ca}" fill="none" stroke="#9F7BEA" stroke-width="4.4" opacity=".75" stroke-linecap="round"/>')
    s.append(f'<path d="{cb}" fill="none" stroke="#FF6A35" stroke-width="18" opacity=".1" stroke-linecap="round"/>')
    s.append(f'<path d="{cb}" fill="none" stroke="#FF6A35" stroke-width="5.4" opacity=".95" stroke-linecap="round"/>')
    s.append(f'<path d="{cc}" fill="none" stroke="#9F7BEA" stroke-width="4.6" opacity=".9" stroke-linecap="round"/>')
    d2030, _ = path_2030(78, 432, 214, -2.4)
    s.append(f'<path d="{d2030}" fill="#9F7BEA" fill-opacity=".1" stroke="#9F7BEA" stroke-opacity=".7" stroke-width="2.4"/>')
    core = _pp16(ca) + _pp16(cb) + _pp16(cc); grp = _pp16(green)
    s.append(_mark('rect', 90, 180, 12, '#C4A9F5', .85, core))
    s.append(_mark('rrect', 250, 151, 15, '#FF6A35', 1, core, rx=4.8))
    s.append(_mark('tri', 345, 150, 15, '#C4A9F5', .9, core))
    s.append(_mark('circle', 400, 166, 7, '#9F7BEA', 1, core))
    s.append(_mark('circle', 230, 268, 5.5, '#5FC79A', .5, grp))
    s.append('<circle cx="430" cy="172" r="8.5" fill="#9F7BEA"/><circle cx="430" cy="184" r="6" fill="#7B5BC4" opacity=".7"/>')
    for x, y, r, op in [(70,70,2.4,.14), (580,300,2.8,.12)]:
        s.append(f'<circle cx="{x}" cy="{y}" r="{r}" fill="#9F7BEA" opacity="{op}"/>')
    return _svg_wrap(640, 360, "\n".join(s), _TITLE, _DESC)

VERSIONS = {
    'main': ("2030-hero.svg", build_main),
    'og':   ("2030-hero-og.svg", build_og),
    'kart': ("2030-hero-kart.svg", build_kart),
}

def main():
    ap = argparse.ArgumentParser(description="Talevo 2030 hero görsel üreteci (SVG).")
    ap.add_argument('--og', action='store_true', help="OG (1200×630) sürümünü üret")
    ap.add_argument('--kart', action='store_true', help="Kart (640×360) sürümünü üret")
    ap.add_argument('--hepsi', action='store_true', help="Üç sürümü birden üret")
    a = ap.parse_args()
    if a.hepsi:
        targets = ['main', 'og', 'kart']
    else:
        targets = []
        if a.og: targets.append('og')
        if a.kart: targets.append('kart')
        if not targets: targets = ['main']   # bayraksız → yalnız ANA sürüm
    for key in targets:
        fname, builder = VERSIONS[key]
        svg = builder()
        with open(OUT + fname, 'w') as f:
            f.write(svg)
        print(f"  yazıldı: images/icgoruler/{fname}  ({len(svg)} byte)")
    print("NOT: WebP önizlemeleri ayrı adımda üretilir (Chrome headless + PIL) — bkz. arac/README.md")

if __name__ == '__main__':
    main()
