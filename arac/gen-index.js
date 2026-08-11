'use strict';
/* ============================================================
   TALEVO ANA SAYFA üreteci (kalıcı — arac/gen-index.js)
   _kaynak/master-v1.html (gövde/CSS/JS) + MEVCUT index.html'in <head>'i (SEO/favicon/font)
   → self-contained kök index.html.

   HEAD STRATEJİSİ: Head kaynağı MEVCUT commit'li index.html'in kendisidir (bayat bir yedek
   dosyası KULLANILMAZ). Gerekçe: (1) ayrı yedek dosya bayatlayıp SEO'yu geri alabiliyordu
   (Aşama 3a'da yaşandı) — bu dosya kaldırıldı; (2) head her zaman = güncel yayındaki head;
   (3) SEO/head değişikliği doğrudan index.html'e yapılır (yerleşik iş akışı), üretim korur.

   GÜVENLİK: Yazmadan ÖNCE head bütünlüğü + font sayısı + boyut sapması denetlenir; biri
   bozuksa DOSYA YAZILMAZ, hata verilir.
   ============================================================ */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const P = f => path.join(ROOT, f);

const MARK = 'TALEVO — master-v1';            // site CSS <style> bloğunun benzersiz işareti
const INDEX = P('index.html');
const MASTER = P('_kaynak/master-v1.html');

// --- kaynakları oku ---
const curIndex = fs.readFileSync(INDEX, 'utf8');   // head kaynağı = MEVCUT index.html (kendisi)
const master   = fs.readFileSync(MASTER, 'utf8');
const prevSize = Buffer.byteLength(curIndex);

// --- head'i MEVCUT index.html'den al: <head> → site <style>'ına kadar (SEO+favicon+font @font-face) ---
const hOpen = curIndex.indexOf('<head>') + '<head>'.length;
const hMark = curIndex.indexOf(MARK);
const hStyleOpen = curIndex.lastIndexOf('<style>', hMark);
if (hOpen < 6 || hMark < 0 || hStyleOpen < 0) { console.error('HATA: index.html head sınırları bulunamadı (bozuk kaynak?)'); process.exit(1); }
const headPreserve = curIndex.substring(hOpen, hStyleOpen);

// --- gövde: master-v1'in site <style>'ından dosya sonuna ---
const mMark = master.indexOf(MARK);
const mStyleOpen = master.lastIndexOf('<style>', mMark);
if (mMark < 0 || mStyleOpen < 0) { console.error('HATA: master-v1 site <style> bulunamadı'); process.exit(1); }
const bodyPart = master.substring(mStyleOpen);

// --- görselleri base64 göm (master-v1 ../images/ yollarını) ---
const dataURI = f => 'data:image/svg+xml;base64,' + fs.readFileSync(P('images/' + f)).toString('base64');
let out = '<!DOCTYPE html>\n<html lang="tr">\n<head>' + headPreserve + bodyPart;
const before = { logo: (out.match(/\.\.\/images\/talevo-logo-white\.svg/g) || []).length, iskur: (out.match(/\.\.\/images\/iskur-logo\.svg/g) || []).length };
out = out.split('../images/talevo-logo-white.svg').join(dataURI('talevo-logo-white.svg'));
out = out.split('../images/iskur-logo.svg').join(dataURI('iskur-logo.svg'));
const remainingRel = (out.match(/\.\.\/images\//g) || []).length;

// ===================== GÜVENLİK KONTROLLERİ (yazmadan ÖNCE) =====================
const fontCount = (out.match(/@font-face/g) || []).length;
const newSize = Buffer.byteLength(out);
const sizeDeltaPct = Math.abs(newSize - prevSize) / prevSize * 100;
const checks = [
  ['head <title>',           /<title>[^<]+<\/title>/.test(headPreserve)],
  ['head canonical',         /rel="canonical"/.test(headPreserve)],
  ['head og: etiketleri',    /property="og:title"/.test(headPreserve) && /property="og:image"/.test(headPreserve)],
  ['head JSON-LD',           /application\/ld\+json/.test(headPreserve)],
  ['@font-face = 8',         fontCount === 8],
  ['relative ref kalmadı',   remainingRel === 0],
  ['boyut sapması ≤ %10',    sizeDeltaPct <= 10],
];
const failed = checks.filter(c => !c[1]);
if (failed.length) {
  console.error('✗ GÜVENLİK KONTROLÜ BAŞARISIZ — DOSYA YAZILMADI:');
  failed.forEach(c => console.error('   - ' + c[0]));
  console.error('   (@font-face=' + fontCount + ', boyut sapması=%' + sizeDeltaPct.toFixed(1) + ')');
  process.exit(2);
}

fs.writeFileSync(INDEX, out);
console.log('✓ index.html üretildi (' + Math.round(newSize/1024) + ' KB, boyut sapması %' + sizeDeltaPct.toFixed(2) + ')');
console.log('  görsel gömüldü: logo×' + before.logo + ' iskur×' + before.iskur + ' | @font-face=' + fontCount + ' | relative ref=' + remainingRel);
console.log('  güvenlik kontrolleri: ' + checks.length + '/' + checks.length + ' GEÇTİ');
