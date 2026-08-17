# -*- coding: utf-8 -*-
"""
============================================================
 TALEVO — "CV'ye yetkinlik ekleme" hero görsel üreteci (kalıcı)
 (2. İçgörüler makalesi: 2026 yetkinlikler)
 Üç sürüm:
   images/icgoruler/2026-yetkinlikler-hero.svg       (1600×900, makale hero)
   images/icgoruler/2026-yetkinlikler-hero-og.svg    (1200×630, sosyal / og:image)
   images/icgoruler/2026-yetkinlikler-hero-kart.svg  (640×360,  hub kart kapağı)

 KULLANIM (repo kökünden):
   python3 arac/gen-gorsel-2026-yetkinlikler.py            # yalnız ANA
   python3 arac/gen-gorsel-2026-yetkinlikler.py --og       # OG
   python3 arac/gen-gorsel-2026-yetkinlikler.py --kart      # KART
   python3 arac/gen-gorsel-2026-yetkinlikler.py --hepsi     # üçü birden

 BAĞIMLILIKLAR:
   - fonttools + brotli → ZORUNLU ("YENİ" yazısı woff2'den <path>'e çevrilir).
     Kur: pip3 install --user fonttools brotli
   - PIL/Pillow → yalnız WebP/JPG önizleme için (bu script SVG üretir; rasterize ayrı adım,
     Chrome headless + PIL). Bkz. arac/README.md "Makale Görselleri".

 "YENİ" NOTU: Görseldeki "YENİ" GÖMÜLÜ METİN DEĞİL, path'e çevrilmiştir. Türkçe 'İ' (U+0130)
   ana manrope-800.woff2'de YOK; latin-ext alt kümesi manrope-800-ext.woff2'de VAR
   (glif "Idotaccent"). Bu yüzden Y/E/N ana fonttan, İ ext fonttan alınır (ikisi de
   aynı Manrope 800 master'ının alt kümesi, upm=2000 → tutarlı).
============================================================
"""
import sys, os, math, argparse

try:
    from fontTools.ttLib import TTFont
    from fontTools.pens.svgPathPen import SVGPathPen
    from fontTools.pens.transformPen import TransformPen
except ImportError as e:
    sys.exit("HATA: 'fonttools' gerekli. Kur: pip3 install --user fonttools brotli\n  Ayrıntı: " + str(e))
try:
    import brotli  # noqa: F401
except ImportError:
    sys.exit("HATA: 'brotli' gerekli (woff2 açmak için). Kur: pip3 install --user brotli")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT  = os.path.join(ROOT, "images", "icgoruler") + os.sep
FONT_MAIN = os.path.join(ROOT, "fonts", "manrope-800.woff2")
FONT_EXT  = os.path.join(ROOT, "fonts", "manrope-800-ext.woff2")
for p in (FONT_MAIN, FONT_EXT):
    if not os.path.exists(p):
        sys.exit("HATA: font bulunamadı: " + p + " (repo kökünden çalıştır)")

# --- iki fonttan glif çözümleyici (İ için ext, Y/E/N için ana) ---
_MAIN = TTFont(FONT_MAIN); _EXT = TTFont(FONT_EXT)
_CM_MAIN = _MAIN.getBestCmap(); _GS_MAIN = _MAIN.getGlyphSet()
_CM_EXT  = _EXT.getBestCmap();  _GS_EXT  = _EXT.getGlyphSet()
_UPM = _MAIN["head"].unitsPerEm
def _glyph(ch):
    cp = ord(ch)
    if cp in _CM_MAIN: return (_GS_MAIN, _CM_MAIN[cp])
    if cp in _CM_EXT:  return (_GS_EXT,  _CM_EXT[cp])
    sys.exit("HATA: '" + ch + "' (U+%04X) hiçbir fontta yok — 'YENİ' çizilemez." % cp)

def path_text(text, badge_x, badge_w, baseline_y, font_size, ls):
    """text'i badge içinde YATAY ORTALA, baseline_y'ye oturt; path string döndür."""
    sc = font_size / _UPM
    glyphs = [(_glyph(ch)) for ch in text]
    advs = [gs[gn].width for gs, gn in glyphs]
    total = sum(a * sc + ls for a in advs) - ls        # görünür genişlik (son ls hariç)
    left_x = badge_x + (badge_w - total) / 2.0
    penX = 0.0; parts = []
    for (gs, gn), adv in zip(glyphs, advs):
        spen = SVGPathPen(gs)
        gs[gn].draw(TransformPen(spen, (sc, 0, 0, -sc, left_x + penX, baseline_y)))
        d = spen.getCommands()
        if d: parts.append(d)
        penX += adv * sc + ls
    return " ".join(parts)

def poly(pts): return " ".join(f"{x},{y}" for x, y in pts)

# ==================== ANA SÜRÜM (1600×900) ====================
def build_main():
    s = []
    s.append('<rect x="0" y="0" width="1600" height="900" rx="28" fill="#0D0D16"/>')
    # derinlik
    s.append('<ellipse cx="1059" cy="329" rx="471" ry="329" fill="#48218E" opacity=".08"/>')
    s.append('<circle cx="282" cy="635" r="353" fill="#6B4BA8" opacity=".04"/>')

    # ---- YETKİNLİK PENCERESİ (sağ üst) ----
    s.append('<rect x="522" y="66" width="984" height="626" rx="52" fill="#9F7BEA" opacity=".05"/>')          # parıltı
    s.append('<polygon points="' + poly([(541,424),(579,391),(579,456)]) + '" fill="#1A1A24" stroke="#9F7BEA" stroke-opacity=".32" stroke-width="2.6"/>')  # kuyruk
    s.append('<rect x="541" y="80" width="951" height="593" rx="42" fill="#1A1A24" stroke="#9F7BEA" stroke-opacity=".32" stroke-width="2.6"/>')            # panel
    s.append('<rect x="565" y="395" width="19" height="56" fill="#1A1A24"/>')                                  # kuyruk birleşim maskesi
    # hücre ızgarası
    cols = [602, 828, 1054, 1280]; rows = [141, 367]
    selected = {(602,141),(1054,141),(828,367)}
    for ry in rows:
        for cx in cols:
            if (cx,ry) in selected:
                s.append(f'<rect x="{cx}" y="{ry}" width="188" height="188" rx="38" fill="#1C1C26" stroke="#FF6A35" stroke-opacity=".9" stroke-width="4.2"/>')
            else:
                s.append(f'<rect x="{cx}" y="{ry}" width="188" height="188" rx="38" fill="#1C1C26" stroke="#9F7BEA" stroke-opacity=".26" stroke-width="2.8"/>')
    # hücre sembolleri
    s.append('<rect x="671" y="209" width="52" height="52" fill="#C4A9F5"/>')                                  # 1 dolu kare
    s.append('<polygon points="' + poly([(922,186),(949,202),(949,235),(922,252),(896,235),(896,202)]) + '" fill="none" stroke="#9F7BEA" stroke-width="4.2" stroke-opacity=".55"/>')  # 2 altıgen
    s.append('<circle cx="1148" cy="235" r="28" fill="#C4A9F5"/>')                                              # 3 dolu daire
    s.append('<polygon points="' + poly([(1374,202),(1402,264),(1346,264)]) + '" fill="none" stroke="#9F7BEA" stroke-width="4.2" stroke-opacity=".55"/>')  # 4 üçgen
    s.append('<polygon points="' + poly([(696,428),(729,461),(696,494),(664,461)]) + '" fill="none" stroke="#9F7BEA" stroke-width="4.2" stroke-opacity=".55"/>')  # 5 dörtgen
    s.append('<circle cx="922" cy="461" r="28" fill="none" stroke="#C4A9F5" stroke-width="8.5"/>')             # 6 halka
    s.append('<rect x="1118" y="433" width="24" height="56" rx="7" fill="none" stroke="#9F7BEA" stroke-width="4" stroke-opacity=".55"/>')
    s.append('<rect x="1155" y="433" width="24" height="56" rx="7" fill="none" stroke="#9F7BEA" stroke-width="4" stroke-opacity=".55"/>')  # 7 iki çubuk
    for cx in (1346, 1374, 1402):
        s.append(f'<circle cx="{cx}" cy="461" r="9.4" fill="#9F7BEA" opacity=".5"/>')                           # 8 üç nokta

    # ---- CV KARTI (sol alt) ----
    s.append('<rect x="122" y="461" width="358" height="358" rx="28" fill="#161620" stroke="#9F7BEA" stroke-opacity=".26" stroke-width="2.6"/>')
    s.append('<circle cx="184" cy="522" r="21" fill="#48218E" stroke="#9F7BEA" stroke-opacity=".45" stroke-width="2.4"/>')
    s.append('<rect x="221" y="508" width="104" height="16" rx="8" fill="#C4A9F5" opacity=".7"/>')
    s.append('<rect x="221" y="534" width="71" height="12" rx="6" fill="#9F7BEA" opacity=".38"/>')
    s.append('<line x1="160" y1="574" x2="442" y2="574" stroke="#9F7BEA" stroke-opacity=".16" stroke-width="2.4"/>')
    for y, w, op in [(598,240,.48),(624,188,.40),(649,259,.48)]:
        s.append(f'<rect x="160" y="{y}" width="{w}" height="12" rx="6" fill="#7B5BC4" opacity="{op}"/>')
    s.append('<line x1="160" y1="687" x2="442" y2="687" stroke="#9F7BEA" stroke-opacity=".16" stroke-width="2.4"/>')
    s.append('<rect x="160" y="706" width="71" height="12" rx="6" fill="#9F7BEA" opacity=".5"/>')
    s.append('<rect x="160" y="739" width="89" height="33" rx="16.5" fill="#48218E" stroke="#9F7BEA" stroke-opacity=".42" stroke-width="2.4"/>')
    s.append('<rect x="264" y="739" width="71" height="33" rx="16.5" fill="#48218E" stroke="#9F7BEA" stroke-opacity=".42" stroke-width="2.4"/>')
    s.append('<rect x="348" y="739" width="85" height="33" rx="16.5" fill="#48218E" stroke="#C4A9F5" stroke-opacity=".6" stroke-width="2.4"/>')
    # artı butonu (kartın sağ üst köşesi)
    s.append('<circle cx="471" cy="475" r="31" fill="#1C1C26" stroke="#9F7BEA" stroke-opacity=".85" stroke-width="3.3"/>')
    s.append('<path d="M471 461 V490 M456 475 H485" stroke="#C4A9F5" stroke-width="4.5" stroke-linecap="round"/>')

    # ---- "YENİ" ROZETLERİ (turuncu pill + koyu path metin) ----
    for bx, by, base in [(706,120,148),(1158,120,148),(932,346,374)]:
        s.append(f'<rect x="{bx}" y="{by}" width="85" height="38" rx="19" fill="#FF6A35"/>')
        s.append(f'<path d="{path_text("YENİ", bx, 85, base, 21, 1.2)}" fill="#0D0D16"/>')

    # köşe parçacıkları
    for x, y, r, op in [(90,120,4,.16),(1520,760,4.5,.12),(120,820,3.5,.14),(1500,120,3,.14),(760,840,3,.10)]:
        s.append(f'<circle cx="{x}" cy="{y}" r="{r}" fill="#9F7BEA" opacity="{op}"/>')

    return _svg(1600, 900, "\n".join(s))

DESC = ("Bir özgeçmişin yanında açılan yetkinlik penceresinde yeni becerilerin eklenmeye hazır olduğunu "
        "gösteren soyut illüstrasyon")
def _svg(w, h, body):
    return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + str(w) + ' ' + str(h) + '" role="img" aria-labelledby="t d">\n'
            '<title id="t">CV\'ye yetkinlik ekleme</title>\n'
            '<desc id="d">' + DESC + '</desc>\n' + body + '\n</svg>\n')

# ==================== OG (1200×630) — yeniden kompoze ====================
# CV kartı küçültülüp sol-alta kısmen kadraj dışı; pencere + YENİ rozetleri öne çıkar.
def build_og():
    s = []
    s.append('<rect x="0" y="0" width="1200" height="630" rx="22" fill="#0D0D16"/>')
    s.append('<ellipse cx="820" cy="250" rx="420" ry="300" fill="#48218E" opacity=".08"/>')
    s.append('<circle cx="150" cy="520" r="300" fill="#6B4BA8" opacity=".04"/>')
    # pencere (büyük, ortadan sağa)
    s.append('<rect x="300" y="54" width="900" height="536" rx="46" fill="#9F7BEA" opacity=".05"/>')
    s.append('<polygon points="' + poly([(316,360),(352,330),(352,392)]) + '" fill="#1A1A24" stroke="#9F7BEA" stroke-opacity=".32" stroke-width="2.4"/>')
    s.append('<rect x="316" y="66" width="864" height="512" rx="38" fill="#1A1A24" stroke="#9F7BEA" stroke-opacity=".32" stroke-width="2.4"/>')
    s.append('<rect x="338" y="332" width="18" height="50" fill="#1A1A24"/>')
    cols = [372, 576, 780, 984]; rows = [120, 336]
    selected = {(372,120),(780,120),(576,336)}
    for ry in rows:
        for cx in cols:
            oc = (cx,ry) in selected
            s.append(f'<rect x="{cx}" y="{ry}" width="170" height="170" rx="34" fill="#1C1C26" stroke="{"#FF6A35" if oc else "#9F7BEA"}" stroke-opacity="{.9 if oc else .26}" stroke-width="{4.2 if oc else 2.8}"/>')
    # semboller (hücre merkezleri: cx+85, cy+85)
    s.append('<rect x="432" y="180" width="50" height="50" fill="#C4A9F5"/>')                                          # dolu kare (372,120)
    s.append('<polygon points="' + poly([(865,163),(890,178),(890,207),(865,222),(840,207),(840,178)]) + '" fill="none" stroke="#9F7BEA" stroke-width="4" stroke-opacity=".55"/>')  # altıgen (780,120)
    s.append('<circle cx="661" cy="421" r="26" fill="none" stroke="#C4A9F5" stroke-width="8"/>')                        # halka (576,336)
    s.append('<circle cx="1069" cy="205" r="26" fill="#C4A9F5"/>')                                                      # dolu daire (984,120)
    s.append('<polygon points="' + poly([(457,395),(487,425),(457,455),(427,425)]) + '" fill="none" stroke="#9F7BEA" stroke-width="4" stroke-opacity=".55"/>')  # dörtgen (372,336)
    for cx in (840, 865, 890):
        s.append(f'<circle cx="{cx}" cy="421" r="8.5" fill="#9F7BEA" opacity=".5"/>')                                   # üç nokta (780,336)
    # CV kartı — küçük, sol-alt köşede kısmen kadraj dışı
    s.append('<rect x="-40" y="392" width="260" height="260" rx="24" fill="#161620" stroke="#9F7BEA" stroke-opacity=".26" stroke-width="2.4"/>')
    s.append('<circle cx="12" cy="440" r="17" fill="#48218E" stroke="#9F7BEA" stroke-opacity=".45" stroke-width="2.2"/>')
    s.append('<rect x="42" y="430" width="86" height="13" rx="6.5" fill="#C4A9F5" opacity=".7"/>')
    s.append('<rect x="42" y="451" width="58" height="10" rx="5" fill="#9F7BEA" opacity=".38"/>')
    for y, w, op in [(486,150,.46),(508,120,.4)]:
        s.append(f'<rect x="8" y="{y}" width="{w}" height="10" rx="5" fill="#7B5BC4" opacity="{op}"/>')
    s.append('<rect x="8" y="540" width="70" height="28" rx="14" fill="#48218E" stroke="#9F7BEA" stroke-opacity=".42" stroke-width="2.2"/>')
    s.append('<rect x="90" y="540" width="62" height="28" rx="14" fill="#48218E" stroke="#C4A9F5" stroke-opacity=".6" stroke-width="2.2"/>')
    s.append('<circle cx="212" cy="416" r="26" fill="#1C1C26" stroke="#9F7BEA" stroke-opacity=".85" stroke-width="3"/>')
    s.append('<path d="M212 404 V428 M200 416 H224" stroke="#C4A9F5" stroke-width="4" stroke-linecap="round"/>')
    # YENİ rozetleri
    for bx, by, base in [(462,100,126),(870,100,126),(666,316,342)]:
        s.append(f'<rect x="{bx}" y="{by}" width="78" height="35" rx="17.5" fill="#FF6A35"/>')
        s.append(f'<path d="{path_text("YENİ", bx, 78, base, 19, 1.1)}" fill="#0D0D16"/>')
    for x, y, r, op in [(70,90,3.5,.15),(1130,560,4,.12),(1120,80,2.6,.14)]:
        s.append(f'<circle cx="{x}" cy="{y}" r="{r}" fill="#9F7BEA" opacity="{op}"/>')
    return _svg(1200, 630, "\n".join(s))

# ==================== KART (640×360) — sadeleştirilmiş ====================
# CV kartı yok; pencere + 4 hücre (biri turuncu YENİ rozetli). Çizgiler oransal kalın.
def build_kart():
    s = []
    s.append('<rect x="0" y="0" width="640" height="360" rx="16" fill="#0D0D16"/>')
    s.append('<ellipse cx="360" cy="150" rx="260" ry="180" fill="#48218E" opacity=".08"/>')
    s.append('<rect x="70" y="40" width="530" height="300" rx="30" fill="#9F7BEA" opacity=".05"/>')
    s.append('<rect x="84" y="52" width="502" height="256" rx="26" fill="#1A1A24" stroke="#9F7BEA" stroke-opacity=".34" stroke-width="3"/>')
    # 2×2 ızgara — ÇAKIŞMASIZ: hücre 104, satır 68/188 (68+104=172 < 188), sütun 187/379
    cols = [187, 379]; rows = [68, 188]
    selected = {(187,68)}
    for ry in rows:
        for cx in cols:
            oc = (cx,ry) in selected
            s.append(f'<rect x="{cx}" y="{ry}" width="104" height="104" rx="24" fill="#1C1C26" stroke="{"#FF6A35" if oc else "#9F7BEA"}" stroke-opacity="{.9 if oc else .28}" stroke-width="{5 if oc else 3.4}"/>')
    # semboller (hücre merkezi cx+52, cy+52)
    s.append('<rect x="217" y="98" width="44" height="44" fill="#C4A9F5"/>')                                            # dolu kare (187,68) — YENİ
    s.append('<polygon points="' + poly([(431,96),(451,108),(451,132),(431,144),(411,132),(411,108)]) + '" fill="none" stroke="#9F7BEA" stroke-width="5" stroke-opacity=".55"/>')  # altıgen (379,68)
    s.append('<circle cx="239" cy="240" r="24" fill="none" stroke="#C4A9F5" stroke-width="9"/>')                        # halka (187,188)
    for cx in (409, 431, 453):
        s.append(f'<circle cx="{cx}" cy="240" r="7.5" fill="#9F7BEA" opacity=".5"/>')                                   # üç nokta (379,188)
    # tek YENİ rozeti (turuncu hücrenin üst kenarına taşar)
    s.append('<rect x="197" y="51" width="80" height="34" rx="17" fill="#FF6A35"/>')
    s.append(f'<path d="{path_text("YENİ", 197, 80, 76, 19, 1.1)}" fill="#0D0D16"/>')
    for x, y, r, op in [(50,50,2.6,.15),(590,310,3,.12)]:
        s.append(f'<circle cx="{x}" cy="{y}" r="{r}" fill="#9F7BEA" opacity="{op}"/>')
    return _svg(640, 360, "\n".join(s))

VERSIONS = {
    'main': ("2026-yetkinlikler-hero.svg", build_main),
    'og':   ("2026-yetkinlikler-hero-og.svg", build_og),
    'kart': ("2026-yetkinlikler-hero-kart.svg", build_kart),
}

def main():
    ap = argparse.ArgumentParser(description="Talevo 2026 yetkinlikler hero görsel üreteci (SVG).")
    ap.add_argument('--og', action='store_true')
    ap.add_argument('--kart', action='store_true')
    ap.add_argument('--hepsi', action='store_true')
    a = ap.parse_args()
    if a.hepsi:
        targets = ['main', 'og', 'kart']
    else:
        targets = []
        if a.og: targets.append('og')
        if a.kart: targets.append('kart')
        if not targets: targets = ['main']
    for key in targets:
        fname, builder = VERSIONS[key]
        svg = builder()
        with open(OUT + fname, 'w') as f:
            f.write(svg)
        print(f"  yazıldı: images/icgoruler/{fname}  ({len(svg)} byte)")
    print("NOT: WebP/JPG önizlemeleri ayrı adımda (Chrome headless + PIL) — bkz. arac/README.md")

if __name__ == '__main__':
    main()
