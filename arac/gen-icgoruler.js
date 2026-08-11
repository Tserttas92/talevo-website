'use strict';
/* ============================================================
   TALEVO İÇGÖRÜLER — hub üreteci (düz Node, bağımlılık YOK)
   Kullanım:
     node _kaynak/gen-icgoruler.js          → icgoruler.json → icgoruler/index.html
     node _kaynak/gen-icgoruler.js --demo    → icgoruler.demo.json → icgoruler/index.demo.html
   Kurallar:
     - durum:"taslak" ÇIKTIYA GİRMEZ
     - oneCikan:true olan İLK kayıt "öne çıkan"; kalanlar kart ızgarası
     - Yayında kayıt yoksa: boş durum; ızgara ve filtreler HİÇ render edilmez
     - Yalnız içerik BULUNAN kategorilerin filtre butonu (yanında sayı)
     - Kart HTML'i STATİK basılır (runtime fetch YOK)
     - Faz 1: makale sayfası yok → "Yazıyı oku" pasif "Yakında" (aria-disabled), ölü link YOK
   ============================================================ */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const P = f => path.join(ROOT, f);

const DEMO = process.argv.includes('--demo');
const DATA_FILE = DEMO ? 'icerik/icgoruler.demo.json' : 'icerik/icgoruler.json';
const OUT_FILE  = DEMO ? 'icgoruler/index.demo.html' : 'icgoruler/index.html';

// Faz 1: makale sayfaları henüz YOK → kartlar tıklanamaz ("Yakında"). Faz 2'de true yapılınca gerçek link.
const ARTICLES_LIVE = false;

const SITE = 'https://talevo.com.tr';
const HUB_URL = SITE + '/icgoruler';
const OG_IMAGE = SITE + '/images/og-image.png';

// ---- yardımcılar ----
const esc = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const partial = n => fs.readFileSync(P('arac/partials/' + n), 'utf8').trim();

const AYLAR = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
function fmtDateTR(iso){
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ''));
  if(!m) return { human: '', machine: '' };
  const y = +m[1], mo = +m[2], d = +m[3];
  return { human: d + ' ' + AYLAR[mo-1] + ' ' + y, machine: m[1]+'-'+m[2]+'-'+m[3] };
}
const KATEGORILER = {
  'isveren-rehberi':   'İşveren Rehberi',
  'kariyer-rehberi':   'Kariyer Rehberi',
  'arastirma-trendler':'Araştırma & Trendler'
};
const catLabel = c => KATEGORILER[c] || c;

// ---- veri ----
let records;
try { records = JSON.parse(fs.readFileSync(P(DATA_FILE), 'utf8')); }
catch(e){ console.error('HATA: ' + DATA_FILE + ' okunamadı/geçersiz JSON: ' + e.message); process.exit(1); }
if(!Array.isArray(records)){ console.error('HATA: ' + DATA_FILE + ' bir dizi olmalı.'); process.exit(1); }

// yalnız YAYINDA; taslak çıktıya girmez
const yayinda = records.filter(r => r && r.durum === 'yayinda');
// tarih (yeni→eski)
yayinda.sort((a,b) => String(b.tarih).localeCompare(String(a.tarih)));

const featured = yayinda.find(r => r.oneCikan === true) || null;
const gridItems = yayinda.filter(r => r !== featured);

// kategori sayıları — YALNIZ IZGARADAKİ kartlar (öne çıkan hariç; öne çıkan filtreden bağımsız,
// her zaman görünür). Böylece buton sayısı = filtreleyince görünen kart sayısı = aria-live duyurusu.
const catCount = {};
gridItems.forEach(r => { catCount[r.kategori] = (catCount[r.kategori]||0) + 1; });
const activeCats = Object.keys(KATEGORILER).filter(c => catCount[c] > 0);

// ---- kart parçaları ----
function readAffordance(r){
  if(ARTICLES_LIVE){
    // Faz 2: erişilebilir "stretched link" — başlık <a>, ::after ile tüm kart tıklanır (iç içe <a> YOK)
    return '<a class="ig-read ig-stretch" href="/icgoruler/'+esc(r.slug)+'">Yazıyı oku'
      + ' <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a>';
  }
  // Faz 1: makale yok → pasif "Yakında" (ölü href YOK, aria-disabled)
  return '<span class="ig-read is-soon" aria-disabled="true">Yakında</span>';
}
function metaRow(r){
  const d = fmtDateTR(r.tarih);
  return '<div class="ig-meta">'
    + '<span class="ig-cat" data-cat="'+esc(r.kategori)+'">'+esc(catLabel(r.kategori))+'</span>'
    + '<time datetime="'+esc(d.machine)+'">'+esc(d.human)+'</time>'
    + '<span aria-hidden="true">·</span><span>'+esc(r.okumaSuresi)+' dk okuma</span>'
    + '</div>';
}
function coverImg(r, w, h){
  return '<img src="'+esc(r.kapak)+'" alt="'+esc(r.kapakAlt)+'" width="'+w+'" height="'+h+'" loading="lazy" decoding="async">';
}
function featuredHTML(r){
  if(!r) return '';
  return '<section class="ig-featured" aria-labelledby="ig-featured-h">'
    + '<div class="wrap"><p class="chapter">Öne çıkan</p>'
    + '<article class="ig-featured-card" data-cat="'+esc(r.kategori)+'">'
    + '<div class="ig-featured-cover">'+coverImg(r,1200,750)+'</div>'
    + '<div class="ig-featured-body">'
    + metaRow(r)
    + '<h2 id="ig-featured-h">'+esc(r.baslik)+'</h2>'
    + '<p class="ig-featured-ozet">'+esc(r.ozet)+'</p>'
    + '<div>'+readAffordance(r)+'</div>'
    + '</div></article></div></section>';
}
function cardHTML(r){
  return '<article class="ig-card" data-cat="'+esc(r.kategori)+'">'
    + '<div class="ig-card-cover">'+coverImg(r,1200,675)+'</div>'
    + '<div class="ig-card-body">'
    + metaRow(r)
    + '<h3>'+esc(r.baslik)+'</h3>'
    + '<p class="ig-card-ozet">'+esc(r.ozet)+'</p>'
    + '<div class="ig-card-foot">'+readAffordance(r)+'</div>'
    + '</div></article>';
}
function filtersHTML(){
  if(!activeCats.length) return '';
  let btns = '<button class="ig-filter" type="button" data-filter="all" aria-pressed="true">Tümü'
    + ' <span class="ig-count">'+gridItems.length+'</span></button>';   // ızgara toplamı (öne çıkan hariç)
  activeCats.forEach(c => {
    btns += '<button class="ig-filter" type="button" data-filter="'+esc(c)+'" aria-pressed="false">'
      + esc(catLabel(c)) + ' <span class="ig-count">'+catCount[c]+'</span></button>';
  });
  // filterbar 'hidden' başlar; JS açar → JS kapalıyken ölü buton yok, tüm kartlar görünür
  return '<section class="ig-filters" aria-label="Kategori filtreleri">'
    + '<div class="wrap"><div class="ig-filterbar" role="group" aria-label="İçgörüleri kategoriye göre süz" hidden>'
    + btns + '</div>'
    + '<p class="sr-only" id="ig-filter-status" role="status" aria-live="polite"></p>'
    + '</div></section>';
}
function gridHTML(){
  if(!gridItems.length) return '';
  return '<section class="ig-grid-wrap" aria-label="İçgörüler"><div class="wrap">'
    + '<div class="ig-grid">' + gridItems.map(cardHTML).join('') + '</div>'
    + '</div></section>';
}
function emptyHTML(){
  return '<section class="ig-empty"><div class="wrap">'
    + '<div class="ig-empty-icon"><svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5h16v14H4z"/><path d="M4 9h16M9 5v14"/></svg></div>'
    + '<h2>İlk içeriklerimiz çok yakında</h2>'
    + '<p>İşin, yeteneğin ve işe alımın geleceğine dair rehberleri ve saha notlarını burada yayımlayacağız. Bir sorunuz varsa şimdiden bize yazabilirsiniz.</p>'
    + '<a class="btn-primary" href="/iletisim">İletişime geçin</a>'
    + '</div></section>';
}

// ---- sayfa gövdesi ----
const hasContent = yayinda.length > 0;
const heroHTML = '<section class="ig-hero"><div class="wrap">'
  + '<p class="chapter">Talevo İçgörüler</p>'
  + '<h1>İşin, yeteneğin ve işe alımın geleceğine dair içgörüler</h1>'
  + '<p class="ig-lead">Yüksek hacimli ve çok lokasyonlu işe alımı; insan uzmanlığı ile teknolojiyi birlikte tasarlama bakış açısıyla ele alıyoruz. Rehberler, çerçeveler ve saha notları bir arada.</p>'
  + '</div></section>';

const ctaHTML = '<section class="ig-cta"><div class="wrap">'
  + '<h2>Kurumunuzun işe alım yaklaşımını birlikte modelleyelim</h2>'
  + '<p>İlk rolünüzü nasıl kurgulayacağınızı 30 dakikalık bir tanışma görüşmesinde konuşalım.</p>'
  + '<a class="btn-primary" href="/iletisim">İletişime Geç</a>'
  + '</div></section>';

let mainInner;
if(hasContent){
  mainInner = heroHTML + featuredHTML(featured) + filtersHTML() + gridHTML() + ctaHTML;
} else {
  mainInner = heroHTML + emptyHTML() + ctaHTML;
}
const mainHTML = '<main id="ig-main">' + mainInner + '</main>';

// ---- JSON-LD: CollectionPage (makaleler Faz 2'de ItemList) ----
const jsonld = {
  '@context':'https://schema.org',
  '@type':'CollectionPage',
  'name':'Talevo İçgörüler',
  'description':'İşin, yeteneğin ve işe alımın geleceğine dair rehberler, çerçeveler ve saha notları.',
  'url': HUB_URL,
  'isPartOf': { '@type':'WebSite', 'name':'Talevo', 'url': SITE + '/' },
  'inLanguage':'tr-TR'
};
const jsonldTag = '<script type="application/ld+json">' + JSON.stringify(jsonld) + '</' + 'script>';

// ---- head-base placeholder doldurma ----
const TITLE = 'İçgörüler — İşe Alımın Geleceği | Talevo';
const DESC = 'Yüksek hacimli ve çok lokasyonlu işe alıma dair rehberler, çerçeveler ve saha notları. İnsan uzmanlığı ile teknolojiyi birlikte tasarlama bakışı.';
let head = partial('head-base.html')
  .replace('{{TITLE}}', esc(TITLE))
  .replace(/\{\{DESCRIPTION\}\}/g, esc(DESC))
  .replace('{{CANONICAL}}', HUB_URL)
  .replace('{{ROBOTS}}', hasContent ? 'index,follow' : 'noindex,follow')  // içeriksizken noindex (ince içerik sinyali verme)
  .replace('{{OG_URL}}', HUB_URL)
  .replace(/\{\{OG_TITLE\}\}/g, esc(TITLE))
  .replace(/\{\{OG_DESC\}\}/g, esc(DESC))
  .replace(/\{\{OG_IMAGE\}\}/g, OG_IMAGE)
  .replace('{{OG_IMAGE_ALT}}', esc('Talevo İçgörüler'))
  .replace('{{JSONLD}}', jsonldTag);

// ---- sayfa JS (drawer + filtreler); CSP script-src 'unsafe-inline' izinli ----
const pageScript = [
'<script>',
'(function(){',
'  "use strict";',
'  /* ---- Mobil drawer (modal deseninden: overflow kilidi + inert + focus trap + ESC + odak dönüşü) ---- */',
'  var burger=document.getElementById("igBurger"), drawer=document.getElementById("igDrawer");',
'  if(burger&&drawer){',
'    var lastFocus=null;',
'    var getF=function(){return [].slice.call(drawer.querySelectorAll("a[href],button:not([disabled])")).filter(function(el){return el.offsetWidth||el.offsetHeight||el.getClientRects().length;});};',
'    function bgInert(on){[].slice.call(document.body.children).forEach(function(k){if(k!==drawer)k.inert=on;});}',
'    function openD(){lastFocus=(document.activeElement&&document.activeElement!==document.body)?document.activeElement:burger;drawer.hidden=false;drawer.classList.add("open");',
'      burger.setAttribute("aria-expanded","true");document.body.style.overflow="hidden";bgInert(true);',
'      requestAnimationFrame(function(){var f=getF();(f[0]||drawer).focus();});}',
'    function closeD(){if(drawer.hidden)return;drawer.classList.remove("open");drawer.hidden=true;',
'      burger.setAttribute("aria-expanded","false");document.body.style.overflow="";bgInert(false);',
'      (lastFocus||burger).focus();}',
'    burger.addEventListener("click",openD);',
'    [].slice.call(drawer.querySelectorAll("[data-drawer-close]")).forEach(function(el){el.addEventListener("click",closeD);});',
'    [].slice.call(drawer.querySelectorAll(".drawer-link,.drawer-cta")).forEach(function(el){el.addEventListener("click",closeD);});',
'    document.addEventListener("keydown",function(e){',
'      if(drawer.hidden)return;',
'      if(e.key==="Escape"){e.preventDefault();closeD();return;}',
'      if(e.key==="Tab"){var f=getF();if(!f.length)return;var first=f[0],last=f[f.length-1];',
'        if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}',
'        else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}',
'    });',
'  }',
'  /* ---- Kategori filtreleri (progressive enhancement: JS açar + wire eder) ---- */',
'  var bar=document.querySelector(".ig-filterbar");',
'  if(bar){',
'    bar.hidden=false;   // JS var → filtre çubuğunu göster (JS yoksa gizli kalır, tüm kartlar görünür)',
'    var cards=[].slice.call(document.querySelectorAll(".ig-card"));',
'    var status=document.getElementById("ig-filter-status");',
'    var btns=[].slice.call(bar.querySelectorAll(".ig-filter"));',
'    function apply(f){',
'      var shown=0;',
'      cards.forEach(function(c){var ok=(f==="all"||c.getAttribute("data-cat")===f);c.hidden=!ok;if(ok)shown++;});',
'      btns.forEach(function(b){b.setAttribute("aria-pressed", b.getAttribute("data-filter")===f?"true":"false");});',
'      if(status)status.textContent=shown+" içerik gösteriliyor.";',
'    }',
'    btns.forEach(function(b){b.addEventListener("click",function(){apply(b.getAttribute("data-filter"));});});',
'  }',
'})();',
'</'+'script>'
].join('\n');

// ---- birleştir ----
const html = '<!DOCTYPE html>\n<html lang="tr">\n<head>\n' + head + '\n</head>\n<body>\n'
  + partial('nav.html') + '\n'
  + mainHTML + '\n'
  + partial('footer.html') + '\n'
  + partial('drawer.html') + '\n'
  + pageScript + '\n'
  + '</body>\n</html>\n';

fs.mkdirSync(P('icgoruler'), { recursive: true });
fs.writeFileSync(P(OUT_FILE), html);

// ---- sitemap.xml: /icgoruler bloğunu içerik durumuna göre idempotent yönet ----
// include=true → ekle/güncelle (lastmod=en yeni içerik); false → çıkar. '/' satırına DOKUNMAZ.
function updateSitemap(include, lastmod){
  const SM = P('sitemap.xml');
  let xml;
  try { xml = fs.readFileSync(SM, 'utf8'); }
  catch(e){ console.warn('⚠️  sitemap.xml okunamadı, atlanıyor: ' + e.message); return { changed:false, present:false }; }
  // mevcut /icgoruler <url> bloğunu (varsa) KALDIR — idempotency: iki kez çalışınca çift satır olmaz
  const rx = /[ \t]*<url>\s*<loc>https:\/\/talevo\.com\.tr\/icgoruler<\/loc>[\s\S]*?<\/url>\s*\n?/g;
  let out = xml.replace(rx, '');
  if(include){
    const block = '  <url>\n'
      + '    <loc>https://talevo.com.tr/icgoruler</loc>\n'
      + '    <lastmod>' + lastmod + '</lastmod>\n'
      + '    <changefreq>weekly</changefreq>\n'
      + '    <priority>0.8</priority>\n'
      + '  </url>\n';
    // </urlset>'ten HEMEN ÖNCE ekle ('/' satırı ve XML yapısı korunur)
    out = out.replace(/([ \t]*)<\/urlset>/, block + '$1</urlset>');
  }
  const changed = out !== xml;
  if(changed) fs.writeFileSync(SM, out);
  return { changed, present: include };
}

// Yalnız gerçek çıktı (prod/demo) sitemap'i bu çalıştırmanın içerik durumuna göre günceller.
const newestDate = yayinda.length ? yayinda[0].tarih : null;   // yayinda tarih DESC sıralı → [0] en yeni
const sm = updateSitemap(hasContent, newestDate);

// ---- master-v1 nav ↔ partials/nav.html ayrışma uyarısı (bilinçli kopya kontrolü) ----
try {
  const master = fs.readFileSync(P('_kaynak/master-v1.html'), 'utf8');
  const hasNavTwo = master.includes('nav-two') && master.includes('İletişime Geç');
  const partialHasCta = partial('nav.html').includes('İletişime Geç');
  if(hasNavTwo && !partialHasCta){
    console.warn('⚠️  UYARI: master-v1 nav ile partials/nav.html ayrıştı (CTA metni). Aşama 3 senkronunda gözden geçir.');
  }
} catch(e){}

// ---- özet ----
console.log((DEMO ? '[DEMO] ' : '[PROD] ') + DATA_FILE + ' → ' + OUT_FILE);
console.log('  toplam kayıt: ' + records.length + ' | yayında: ' + yayinda.length
  + ' | taslak (çıktıya girmedi): ' + records.filter(r=>r&&r.durum==='taslak').length);
console.log('  öne çıkan: ' + (featured ? featured.slug : '(yok)') + ' | ızgara: ' + gridItems.length);
console.log('  aktif kategori filtreleri: ' + (activeCats.length ? activeCats.map(c=>c+'('+catCount[c]+')').join(', ') : '(yok — boş durum)'));
console.log('  çıktı boyutu: ' + Math.round(html.length/1024) + ' KB | ARTICLES_LIVE=' + ARTICLES_LIVE);
console.log('  robots: ' + (hasContent ? 'index,follow' : 'noindex,follow (içerik yok)')
  + ' | sitemap /icgoruler: ' + (sm.present ? ('VAR (lastmod ' + newestDate + ')') : 'YOK')
  + (sm.changed ? ' [sitemap.xml güncellendi]' : ' [sitemap.xml değişmedi]'));
if(DEMO) console.log('  NOT: DEMO çalıştırması sitemap.xml\'i değiştirebilir → COMMIT ÖNCESİ prod modu (--demo\'suz) SON çalıştırın.');
console.log('⚠️  master-v1.html nav → partials/nav.html Aşama 3\'te senkronlanacak (şimdilik bilinçli kopya).');
