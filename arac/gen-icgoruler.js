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
const md = require('./md.js');
const ROOT = path.resolve(__dirname, '..');
const P = f => path.join(ROOT, f);

const DEMO = process.argv.includes('--demo');
const PREVIEW = process.argv.includes('--onizleme');   // taslakları da makale olarak render et (index.onizleme.html)
const DATA_FILE = DEMO ? 'icerik/icgoruler.demo.json' : 'icerik/icgoruler.json';
const OUT_FILE  = DEMO ? 'icgoruler/index.demo.html' : 'icgoruler/index.html';

// Faz 2: makale sayfaları ARTIK üretiliyor → yayında kartlar gerçek link (/icgoruler/<slug>).
const ARTICLES_LIVE = true;

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
    return '<a class="ig-read ig-stretch" href="/icgoruler/'+esc(r.slug)+'/">Yazıyı oku'
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
  // Kart kapağı: kart için özel kırpma-güvenli görsel (kapakKart, 16:9). Yoksa ANA hero'ya düş.
  return '<img src="'+esc(r.kapakKart || r.kapak)+'" alt="'+esc(r.kapakAlt)+'" width="'+w+'" height="'+h+'" loading="lazy" decoding="async">';
}
function featuredHTML(r){
  if(!r) return '';
  return '<section class="ig-featured" aria-labelledby="ig-featured-h">'
    + '<div class="wrap"><p class="chapter">Öne çıkan</p>'
    + '<article class="ig-featured-card" data-cat="'+esc(r.kategori)+'">'
    + '<div class="ig-featured-cover">'+coverImg(r,1200,675)+'</div>'
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
  + '<p class="ig-lead">İşe alımın, yeteneğin ve çalışma hayatının dönüşümünü; veri, teknoloji ve insan odağında ele alıyoruz. Uygulanabilir rehberler, araştırma özetleri ve saha içgörüleri bir arada.</p>'
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
const DESC = 'İşe alımın, yeteneğin ve çalışma hayatının dönüşümü üzerine uygulanabilir rehberler, araştırma özetleri ve saha içgörüleri.';
let head = partial('head-base.html')
  .replace('{{TITLE}}', esc(TITLE))
  .replace(/\{\{DESCRIPTION\}\}/g, esc(DESC))
  .replace('{{CANONICAL}}', HUB_URL)
  .replace('{{ROBOTS}}', hasContent ? 'index,follow' : 'noindex,follow')  // içeriksizken noindex (ince içerik sinyali verme)
  .replace('{{OG_TYPE}}', 'website')
  .replace('{{OG_URL}}', HUB_URL)
  .replace(/\{\{OG_TITLE\}\}/g, esc(TITLE))
  .replace(/\{\{OG_DESC\}\}/g, esc(DESC))
  .replace(/\{\{OG_IMAGE\}\}/g, OG_IMAGE)
  .replace('{{OG_IMAGE_ALT}}', esc('Talevo İçgörüler'))
  .replace('{{JSONLD}}', jsonldTag)
  .replace('{{EXTRA_HEAD}}', '');

// ---- sayfa JS parçaları (CSP script-src 'unsafe-inline' izinli); drawer HEM hub HEM makale kullanır ----
const DRAWER_JS = [
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
'  }'
].join('\n');

const FILTER_JS = [
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
'    /* Makale rozetinden gelen ?kategori=<slug> → ilgili filtreyi seçili aç */',
'    try{var qp=new URLSearchParams(location.search).get("kategori");',
'      if(qp&&btns.some(function(b){return b.getAttribute("data-filter")===qp;}))apply(qp);}catch(e){}',
'  }'
].join('\n');

// NOT: İçindekiler <details open> olarak render edilir ve durumu JS ile DEĞİŞTİRİLMEZ
// (yükleme sonrası open→closed geçişi CLS yaratırdı). Masaüstü: CSS sticky sidebar + summary pointer-events:none.
// Mobil: native <details> açılır/kapanır (varsayılan açık). Böylece CLS 0, JS'siz de erişilebilir.
const ARTICLE_JS = [
'  /* ---- Okuma ilerleme çubuğu (position:fixed → layout kaymaz) ---- */',
'  var pb=document.querySelector(".read-progress span");',
'  if(pb){var el=document.documentElement;',
'    var upd=function(){var max=el.scrollHeight-el.clientHeight;var p=max>0?el.scrollTop/max:0;pb.style.width=(Math.max(0,Math.min(1,p))*100).toFixed(1)+"%";};',
'    document.addEventListener("scroll",upd,{passive:true});window.addEventListener("resize",upd,{passive:true});upd();}',
'  /* ---- Paylaş: bağlantıyı kopyala (clipboard → execCommand → seçilebilir metin) ---- */',
'  [].forEach.call(document.querySelectorAll(".share-copy"),function(btn){',
'    btn.addEventListener("click",function(){',
'      var url=btn.getAttribute("data-copy-url");',
'      var group=btn.closest(".article-share");var status=group?group.querySelector(".share-status"):null;',
'      var lbl=btn.querySelector(".share-copy-label");',
'      function done(){ if(lbl){if(!lbl.getAttribute("data-orig"))lbl.setAttribute("data-orig",lbl.textContent);lbl.textContent="Kopyalandı";}',
'        if(status){status.classList.add("sr-only");status.textContent="Bağlantı kopyalandı.";}',
'        setTimeout(function(){if(lbl&&lbl.getAttribute("data-orig"))lbl.textContent=lbl.getAttribute("data-orig");if(status)status.textContent="";},2000); }',
'      function showText(){ if(status){status.classList.remove("sr-only");status.textContent=url;} }',
'      function legacy(){ try{var ta=document.createElement("textarea");ta.value=url;ta.setAttribute("readonly","");ta.style.position="absolute";ta.style.left="-9999px";',
'        document.body.appendChild(ta);ta.select();var ok=document.execCommand("copy");document.body.removeChild(ta);ok?done():showText();}catch(e){showText();} }',
'      if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(url).then(done,legacy);}else{legacy();}',
'    });',
'  });'
].join('\n');

const wrapScript = body => '<script>\n(function(){\n  "use strict";\n' + body + '\n})();\n</' + 'script>';
const pageScript = wrapScript(DRAWER_JS + '\n' + FILTER_JS);   // hub

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

// ============================================================
//  MAKALE SAYFALARI (Faz 2) — icgoruler/<slug>/index.html
//  Gövde: icerik/makaleler/<slug>.md (md.js ile ayrıştırılır)
//  Yayında kayıtlar → index.html. --onizleme ile taslaklar → index.onizleme.html (gitignore).
// ============================================================
function jsonLdSafe(obj){ return JSON.stringify(obj).replace(/</g, '\\u003c'); }

function tocHTML(headings){
  if(headings.length < 4) return '';   // 4'ten az H2 → içindekiler render EDİLMEZ
  return '<details class="toc" open>'
    + '<summary>İçindekiler</summary>'
    + '<nav aria-label="Makale içindekiler"><ol>'
    + headings.map(h => '<li><a href="#' + h.id + '">' + esc(h.text) + '</a></li>').join('')
    + '</ol></nav></details>';
}
function extractCta(raw){
  const m = /:::cta[ \t]+([^\n]+)\n([\s\S]*?)\n:::/.exec(raw);
  if(!m) return { raw, ctaHtml: '' };
  const bodyHtml = md.parse(m[2].trim()).html;
  const ctaHtml = '<aside class="md-cta">'
    + '<h2 class="md-cta-title">' + md.inline(m[1].trim()) + '</h2>'
    + bodyHtml
    + '<div class="article-cta-actions"><a class="btn-primary" href="/iletisim">İletişime Geç</a></div>'
    + '</aside>';
  return { raw: raw.replace(m[0], '').replace(/\n{3,}/g, '\n\n'), ctaHtml };
}
function relatedHTML(r){
  // ilgili override YOKSA aynı kategoriden en yeni 2 (kendisi hariç). 2'den az aday → bölüm YOK.
  let cands = (Array.isArray(r.ilgili) && r.ilgili.length)
    ? r.ilgili.map(s => yayinda.find(x => x.slug === s)).filter(Boolean)
    : yayinda.filter(x => x.kategori === r.kategori);
  cands = cands.filter(x => x.slug !== r.slug).slice(0, 2);
  if(cands.length < 2) return '';
  return '<section class="article-related" aria-labelledby="rel-h"><div class="wrap">'
    + '<p class="chapter">İlgili içerikler</p><h2 id="rel-h" class="sr-only">İlgili içerikler</h2>'
    + '<div class="ig-grid">' + cands.map(cardHTML).join('') + '</div></div></section>';
}

// ---- Paylaşım kutusu (saf bağlantı, 3. taraf script YOK; X/Twitter YOK) ----
const _SHARE_ICONS = {
  linkedin: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
  whatsapp: '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>',
  eposta:   '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  kopya:    '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>'
};
const _svgIcon = n => '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + _SHARE_ICONS[n] + '</svg>';
function shareBox(r, canonical, variant){
  const enc = encodeURIComponent;
  const utm = ch => canonical + '?utm_source=' + ch + '&utm_medium=paylasim';   // canonical sonda '/' → '/?utm...'
  const li = 'https://www.linkedin.com/sharing/share-offsite/?url=' + enc(utm('linkedin'));
  const wa = 'https://wa.me/?text=' + enc(r.baslik + ' ' + utm('whatsapp'));
  const ma = 'mailto:?subject=' + enc(r.baslik) + '&body=' + enc((r.ozet || '') + '\n\n' + utm('eposta'));
  const big = variant === 'end';
  const cls = 'share-btn' + (big ? ' share-btn-lg' : '');
  const lbl = (t, txt) => big ? '<span>' + txt + '</span>' : '';   // uç sürümde görünür metin
  const ext = (href, key, aria, txt) =>
    '<a class="' + cls + '" href="' + esc(href) + '" target="_blank" rel="noopener noreferrer" aria-label="' + esc(aria) + '"'
      + (big ? '' : ' title="' + esc(aria) + '"') + '>' + _svgIcon(key) + lbl(key, txt) + '</a>';
  const copyBtn =
    '<button class="' + cls + ' share-copy" type="button" data-copy-url="' + esc(canonical) + '" aria-label="Bağlantıyı kopyala"'
      + (big ? '' : ' title="Bağlantıyı kopyala"') + '>' + _svgIcon('kopya')
      + (big ? '<span class="share-copy-label">Bağlantıyı kopyala</span>' : '') + '</button>';
  return '<div class="article-share' + (big ? ' article-share-end-row' : ' article-share-top') + '" role="group" aria-label="Bu yazıyı paylaş">'
    + (big ? '' : '<span class="share-inline-label" aria-hidden="true">Paylaş</span>')
    + ext(li, 'linkedin', "LinkedIn'de paylaş", 'LinkedIn')
    + ext(wa, 'whatsapp', "WhatsApp'ta paylaş", 'WhatsApp')
    + ext(ma, 'eposta', 'E-posta ile paylaş', 'E-posta')
    + copyBtn
    + '<span class="share-status sr-only" role="status" aria-live="polite"></span>'
    + '</div>';
}

function buildArticle(r, isPreview){
  const mdPath = P('icerik/makaleler/' + r.slug + '.md');
  let raw;
  try { raw = fs.readFileSync(mdPath, 'utf8'); }
  catch(e){ throw new Error(r.slug + ': gövde .md bulunamadı (' + mdPath + ')'); }

  const cta = extractCta(raw);
  const parsed = md.parse(cta.raw);                 // hata olursa throw → dosya YAZILMAZ
  const bodyHtml = parsed.html;
  const toc = tocHTML(parsed.headings);

  const canonical = SITE + '/icgoruler/' + r.slug + '/';   // sondaki '/' — Netlify 301 sıçramasını önler
  const ogImage = SITE + (r.kapakOgJpg || r.kapakOg || r.kapak);   // og:image WebP değil JPG (platform uyumu)
  const d = fmtDateTR(r.tarih);
  const seoTitle = (r.seoBaslik || r.baslik) + ' | Talevo';

  const artLd = {
    '@context':'https://schema.org','@type':'Article',
    headline: r.baslik, description: r.metaAciklama || r.ozet,
    image: ogImage, datePublished: r.tarih, dateModified: r.tarih,
    author:{'@type':'Organization', name:'Talevo', url: SITE + '/'},
    publisher:{'@type':'Organization', name:'Talevo',
      logo:{'@type':'ImageObject', url: SITE + '/images/talevo-logo-white.svg'}},
    mainEntityOfPage:{'@type':'WebPage','@id': canonical},
    inLanguage:'tr-TR'
  };
  const crumbLd = {
    '@context':'https://schema.org','@type':'BreadcrumbList',
    itemListElement:[
      {'@type':'ListItem', position:1, name:'Ana Sayfa', item: SITE + '/'},
      {'@type':'ListItem', position:2, name:'İçgörüler', item: SITE + '/icgoruler'},
      {'@type':'ListItem', position:3, name: r.baslik, item: canonical}
    ]
  };
  const jsonldTags = '<script type="application/ld+json">' + jsonLdSafe(artLd) + '</' + 'script>\n'
    + '<script type="application/ld+json">' + jsonLdSafe(crumbLd) + '</' + 'script>';
  const extraHead = '<meta property="og:image:width" content="1200">\n'
    + '<meta property="og:image:height" content="630">\n'
    + '<meta property="article:published_time" content="' + esc(r.tarih) + '">\n'
    + '<meta property="article:section" content="' + esc(catLabel(r.kategori)) + '">';

  const head = partial('head-base.html')
    .replace('{{TITLE}}', esc(seoTitle))
    .replace(/\{\{DESCRIPTION\}\}/g, esc(r.metaAciklama || r.ozet))
    .replace('{{CANONICAL}}', canonical)
    .replace('{{ROBOTS}}', isPreview ? 'noindex,nofollow' : 'index,follow')
    .replace('{{OG_TYPE}}', 'article')
    .replace('{{OG_URL}}', canonical)
    .replace(/\{\{OG_TITLE\}\}/g, esc(r.seoBaslik || r.baslik))
    .replace(/\{\{OG_DESC\}\}/g, esc(r.metaAciklama || r.ozet))
    .replace(/\{\{OG_IMAGE\}\}/g, ogImage)
    .replace('{{OG_IMAGE_ALT}}', esc(r.kapakAlt || r.baslik))
    .replace('{{JSONLD}}', jsonldTags)
    .replace('{{EXTRA_HEAD}}', extraHead);

  const header = '<header class="article-head"><div class="wrap">'
    + '<a class="ig-cat article-catlink" data-cat="' + esc(r.kategori) + '" href="/icgoruler?kategori=' + esc(r.kategori) + '">' + esc(catLabel(r.kategori)) + '</a>'
    + '<h1>' + esc(r.baslik) + '</h1>'
    + '<p class="article-sub">' + esc(r.altBaslik || '') + '</p>'
    + '<div class="article-meta ig-meta"><time datetime="' + esc(d.machine) + '">' + esc(d.human) + '</time>'
    + '<span aria-hidden="true">·</span><span>' + esc(r.okumaSuresi) + ' dk okuma</span></div>'
    + shareBox(r, canonical, 'top')
    + '</div></header>';
  const hero = '<div class="wrap"><figure class="article-hero">'
    + '<img src="' + esc(r.kapak) + '" alt="' + esc(r.kapakAlt || '') + '" width="1600" height="900" decoding="async" fetchpriority="high">'
    + '</figure></div>';
  const summary = '<div class="article-summary" role="doc-abstract"><p>' + esc(r.ozet) + '</p></div>';
  const layout = '<div class="wrap"><div class="article-layout' + (toc ? '' : ' no-toc') + '">'
    + summary + toc + '<div class="article-body">' + bodyHtml + '</div></div></div>';
  const ctaSection = cta.ctaHtml ? '<div class="wrap"><section class="article-cta">' + cta.ctaHtml + '</section></div>' : '';
  const shareEnd = '<section class="article-share-end" aria-labelledby="share-h"><div class="wrap">'
    + '<h2 id="share-h" class="share-heading">Bu yazıyı paylaş</h2>' + shareBox(r, canonical, 'end') + '</div></section>';
  const related = relatedHTML(r);

  const mainArticle = '<main id="ig-main" class="article"><article>'
    + header + hero + layout + ctaSection + shareEnd + related + '</article></main>';

  const pageHtml = '<!DOCTYPE html>\n<html lang="tr">\n<head>\n' + head + '\n</head>\n<body>\n'
    + '<div class="read-progress" aria-hidden="true"><span></span></div>\n'
    + partial('nav.html') + '\n'
    + mainArticle + '\n'
    + partial('footer.html') + '\n'
    + partial('drawer.html') + '\n'
    + wrapScript(DRAWER_JS + '\n' + ARTICLE_JS) + '\n'
    + '</body>\n</html>\n';

  const outRel = 'icgoruler/' + r.slug + '/' + (isPreview ? 'index.onizleme.html' : 'index.html');
  fs.mkdirSync(path.dirname(P(outRel)), { recursive: true });
  fs.writeFileSync(P(outRel), pageHtml);
  return { outRel, bytes: pageHtml.length, toc: !!toc, related: !!related, h2: parsed.headings.length };
}

// Demo modunda makale üretilmez (demo kayıtlarının .md'si yok — hub görselleştirme amaçlı).
const articleReports = [];
if(!DEMO){
  const drafts = records.filter(r => r && r.durum === 'taslak' && r.slug);
  try {
    yayinda.forEach(r => { if(r.slug) articleReports.push(Object.assign({ slug:r.slug, preview:false }, buildArticle(r, false))); });
    if(PREVIEW) drafts.forEach(r => articleReports.push(Object.assign({ slug:r.slug, preview:true }, buildArticle(r, true))));
  } catch(e){
    console.error('✗ MAKALE ÜRETİLEMEDİ — hiçbir makale dosyası yazılmadı: ' + e.message);
    process.exit(3);
  }
}

// ---- sitemap.xml: TÜM /icgoruler* (hub + makaleler) bloklarını idempotent yönet ----
// Verilen entries dizisini yazar; mevcut /icgoruler ve /icgoruler/<slug> bloklarını önce SİLER.
// Root '/' satırına ve XML yapısına DOKUNMAZ.
function updateSitemap(entries){
  const SM = P('sitemap.xml');
  let xml;
  try { xml = fs.readFileSync(SM, 'utf8'); }
  catch(e){ console.warn('⚠️  sitemap.xml okunamadı, atlanıyor: ' + e.message); return { changed:false, count:0 }; }
  // hub VE makale bloklarını kaldır (idempotency): /icgoruler ve /icgoruler/<slug>
  const rx = /[ \t]*<url>\s*<loc>https:\/\/talevo\.com\.tr\/icgoruler(?:\/[^<]*)?<\/loc>[\s\S]*?<\/url>\s*\n?/g;
  let out = xml.replace(rx, '');
  const blocks = entries.map(e => '  <url>\n'
    + '    <loc>' + e.loc + '</loc>\n'
    + '    <lastmod>' + e.lastmod + '</lastmod>\n'
    + '    <changefreq>' + e.changefreq + '</changefreq>\n'
    + '    <priority>' + e.priority + '</priority>\n'
    + '  </url>\n').join('');
  if(blocks) out = out.replace(/([ \t]*)<\/urlset>/, blocks + '$1</urlset>');
  const changed = out !== xml;
  if(changed) fs.writeFileSync(SM, out);
  return { changed, count: entries.length };
}

// Yayında hub (varsa) + yayında her makale. Taslak/önizleme sitemap'e GİRMEZ.
const newestDate = yayinda.length ? yayinda[0].tarih : null;   // yayinda tarih DESC sıralı → [0] en yeni
const smEntries = [];
if(hasContent) smEntries.push({ loc: HUB_URL, lastmod: newestDate, changefreq:'weekly', priority:'0.8' });
if(!DEMO) yayinda.forEach(r => { if(r.slug) smEntries.push({ loc: SITE + '/icgoruler/' + r.slug + '/', lastmod: r.tarih, changefreq:'monthly', priority:'0.7' }); });
const sm = updateSitemap(smEntries);

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
  + ' | sitemap /icgoruler* blok: ' + sm.count
  + (sm.changed ? ' [sitemap.xml güncellendi]' : ' [sitemap.xml değişmedi]'));
if(!DEMO){
  if(articleReports.length){
    articleReports.forEach(a => console.log('  makale: ' + a.outRel + ' (' + Math.round(a.bytes/1024) + ' KB, H2×' + a.h2
      + ', içindekiler=' + (a.toc?'var':'yok') + ', ilgili=' + (a.related?'var':'yok') + (a.preview?', ÖNİZLEME/taslak':'') + ')'));
  } else {
    console.log('  makale: (yayında makale yok' + (PREVIEW ? '; --onizleme ile taslak da bulunamadı' : '; taslakları görmek için --onizleme') + ')');
  }
}
if(DEMO) console.log('  NOT: DEMO çalıştırması sitemap.xml\'i değiştirebilir → COMMIT ÖNCESİ prod modu (--demo\'suz) SON çalıştırın.');
console.log('⚠️  master-v1.html nav → partials/nav.html Aşama 3\'te senkronlanacak (şimdilik bilinçli kopya).');
