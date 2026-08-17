# Talevo İçgörüler — İçerik Ekleme Kılavuzu

Bu klasör (`arac/`) İçgörüler hub'ını **üreten** araçları içerir. İçerik yazan
kişi, kod bilmeden bu kılavuzu izleyerek yeni içgörü ekleyebilir.

> Not: `index.html` (ana sayfa) ayrı bir sistemdir; bu araç ona **dokunmaz**.

## 1. Yeni bir içgörü nasıl eklenir?

### Adım 1 — Kapak görselini koy
- Görseli `images/icgoruler/` altına koy. Örn: `images/icgoruler/yeni-yazi.jpg`
- **Boyut: 1200 × 675 piksel (16:9 oranı).** Bu oran şart — kartlar sabit orana
  göre yerleşir, farklı oran boşluk/kırpılma yapar.
- Format: `.jpg` / `.png` / `.svg` olabilir. Gerçek dosya olmalı (base64 değil).
- Küçük tutmaya çalış (ideal < 150 KB) — sayfa hızını etkiler.

### Adım 2 — `icerik/icgoruler.json` dosyasına kaydı ekle
Dosya bir **liste** ([...]). Her içgörü bir `{...}` bloğudur. Alanlar:

| Alan | Anlamı | Örnek |
|---|---|---|
| `slug` | URL adı — küçük harf, boşluk yok, Türkçe karakter yok | `"yuksek-hacimli-ise-alim"` |
| `baslik` | Görünen başlık | `"Yüksek hacimli işe alımda…"` |
| `ozet` | Kart özeti (1–2 cümle) | `"Binlerce başvurunun…"` |
| `kategori` | Üç seçenekten biri | `"isveren-rehberi"` / `"kariyer-rehberi"` / `"arastirma-trendler"` |
| `kapak` | Adım 1'deki görselin yolu | `"/images/icgoruler/yeni-yazi.jpg"` |
| `kapakAlt` | Görselin sözlü tarifi (erişilebilirlik) | `"Aday akışını gösteren görsel"` |
| `tarih` | Yayın tarihi, `YYYY-AA-GG` | `"2026-09-14"` |
| `okumaSuresi` | Dakika (yalnız sayı) | `7` |
| `oneCikan` | En üstte "öne çıkan" mı? (`true`/`false`) | Yalnız **bir** kayıtta `true` yeterli |
| `durum` | `"yayinda"` yayımlar; `"taslak"` **çıktıya girmez** | `"yayinda"` |

**Kurallar:**
- Sonuç iddiası yazma (müşteri vakası, oran, süre kısaltma). Tasarım/yaklaşım dili kullan.
- `durum: "taslak"` yaparsan kayıt hazırlanır ama sitede **görünmez** (güvenle bekletebilirsin).
- `oneCikan: true` olan ilk yayında kayıt "Öne çıkan" alanına gider; kalanlar kart ızgarasına.

### Adım 3 — Üreteci çalıştır
```
node arac/gen-icgoruler.js
```
Bu komut `icgoruler/index.html`'i yeniden üretir ve gerekiyorsa `sitemap.xml` +
`robots` etiketini otomatik ayarlar (içerik varsa indekslenir, yoksa noindex).

### Adım 4 — Değişiklikleri yayına al (commit)
Şu dosyaları commit'le:
- `icgoruler/index.html` (üretilen hub)
- `icerik/icgoruler.json` (eklediğin veri)
- `images/icgoruler/<kapak dosyan>` (yeni görsel)
- `sitemap.xml` (değiştiyse)

Sonra `git push` → Netlify otomatik yayımlar. Sayfa: `https://talevo.com.tr/icgoruler`

## 2. Yerel önizleme (isteğe bağlı, yayına gitmez)
6 örnek kayıtla dolu bir demo üretmek için:
```
node arac/gen-icgoruler.js --demo
```
→ `icgoruler/index.demo.html` üretir (bu dosya `.gitignore`'da, **asla yayına gitmez**).
⚠️ Demo çalıştırması `sitemap.xml`'i geçici değiştirebilir. **Commit'ten önce mutlaka
`--demo` olmadan bir kez daha çalıştır** ki sitemap gerçek içerik durumunu yansıtsın.

## 3. Makale (tek tek yazı) ekleme — Faz 2

Artık makale detay sayfaları üretiliyor (`ARTICLES_LIVE = true`). Bir makale iki parçadan oluşur:
**metadata JSON'da**, **gövde Markdown dosyasında**.

### Adım 1 — Gövdeyi yaz
`icerik/makaleler/<slug>.md` oluştur. Desteklenen Markdown (fazlası GEREKMİYOR):
- `## Başlık` (H2) · `### Alt başlık` (H3) · paragraf · `**kalın**` · `*italik*` · `[bağlantı](url)`
- `- madde` / `1. numaralı` liste · `> alıntı` · `| tablo |` (başlık satırı + `| --- |` ayırıcı + satırlar)
- Özel bloklar:
  ```
  :::istatistik
  %22 | Açıklama satırı        ← her satır bir kutu (2–4 satır)
  :::
  :::kutu BAŞLIK
  Metin…
  :::
  :::cta BAŞLIK
  Metin…                        ← makale sonunda iletişim CTA'sına dönüşür
  :::
  :::kartlar
  Başlık | Açıklama             ← her satır bir numaralı kart (2 sütun ızgara, başlık h3)
  :::
  :::oncesonra
  Önce | metin                  ← TAM 2 satır: sol düşük kontrast, sağ mor vurgu
  Sonra | metin                    (etiketler görünür; mobilde alt alta + ok)
  :::
  :::adimlar
  Gün aralığı | Adım başlığı | Açıklama   ← numaralı adım (masaüstü ızgara, mobil dikey timeline)
  :::
  ```
- `## Kaynakça` başlığı özel stille (kaynak listesi) render edilir.
- **H1 yazma** — H1, JSON'daki `baslik`'ten gelir (sayfada tek H1 olmalı).

### Adım 2 — JSON kaydını ekle (`icerik/icgoruler.json`)
Hub alanlarına (`slug/baslik/ozet/kategori/kapak/kapakAlt/tarih/okumaSuresi/oneCikan/durum`) ek olarak
makale için: `altBaslik`, `seoBaslik`, `metaAciklama`, `kapakOg` (1200×630 sosyal görsel),
`kapakKart` (kart kapağı — hub kartı), isteğe bağlı `ilgili: ["slug1","slug2"]` (ilgili içerik override).
`slug` ile `.md` dosya adı **aynı** olmalı.

### Adım 3 — Üret
```
node arac/gen-icgoruler.js              # yayında makaleleri → icgoruler/<slug>/index.html
node arac/gen-icgoruler.js --onizleme   # TASLAKLARI da → icgoruler/<slug>/index.onizleme.html
```
- `durum:"taslak"` kayıt **yayına GİRMEZ** (hub'da görünmez, `index.html` üretilmez, sitemap'e eklenmez).
  Şablonu görmek için `--onizleme` ile `index.onizleme.html` üret (bu dosya `.gitignore`'da, canlıya gitmez).
- Yayına almak: JSON'da `durum:"taslak"` → `"yayinda"` yap, üreteci `--onizleme`'siz çalıştır.
  Bu makale `icgoruler/<slug>/index.html` olur, hub kartı tıklanır, sitemap'e eklenir.
- **İçindekiler** H2'lerden otomatik (Kaynakça hariç; 4'ten az H2 varsa render edilmez).
- **İlgili içerikler** aynı kategoriden en yeni 2 yazı (2'den az aday → bölüm görünmez).

## 4. Sık sorulanlar
- **Hiç yayında içerik yoksa?** Sayfa "İlk içeriklerimiz çok yakında" boş durumunu
  gösterir, `noindex` olur ve sitemap'ten çıkarılır (ince içerik cezası almamak için).
- **Kategori filtreleri?** Yalnız **içeriği olan** kategorinin butonu görünür (yanında sayı).
  Makale kategori rozetine tıklayınca hub'a `?kategori=<slug>` ile gidilir ve o filtre seçili açılır.

## 5. Dosya haritası (bu sistem)
- `icerik/icgoruler.json` — **üretim verisi** (yayın) · `icerik/icgoruler.demo.json` — örnek (gitignore)
- `icerik/makaleler/<slug>.md` — **makale gövdesi** (Markdown)
- `arac/gen-icgoruler.js` — üreteç · `arac/md.js` — Markdown ayrıştırıcı (bağımlılık yok)
- `arac/partials/` — ortak parçalar: `head-base.html` (meta+font+CSS+makale şablonu stili), `nav.html`,
  `footer.html`, `drawer.html` (mobil menü)
- `fonts/*.woff2` — paylaşılan Manrope (400/700/800, latin+ext)
- `icgoruler/index.html` — **üretilen** hub · `icgoruler/<slug>/index.html` — **üretilen** makale
  (elle düzenleme; üreteç üzerine yazar)

---

# Makale Görselleri

Her makalenin **kendi** el yazımı SVG üreteci vardır (`arac/gen-gorsel-<konu>.py`). Görseldeki
yazı (yıl / "YENİ" vb.) **gömülü metin değil**, `fonts/manrope-800*.woff2`'den `<path>`'e çevrilir
(font bağımlılığı yok, `<text>` içermez). Her üreteç aynı arayüzü paylaşır:
`[--og] [--kart] [--hepsi]`, bayraksız = yalnız ANA sürüm; üçü de `images/icgoruler/` altına yazar.
**Bağımlılık:** `fonttools` + `brotli` (ZORUNLU); WebP/JPG önizleme için Chrome headless + PIL (aşağıda).

Mevcut üreteçler:
- `arac/gen-gorsel-2030.py` — "Mesleklerin 2030'a akışı" (dere yatağı, `2030-hero*`)
- `arac/gen-gorsel-2026-yetkinlikler.py` — "CV'ye yetkinlik ekleme" (yetkinlik penceresi + "YENİ"
  rozetleri, `2026-yetkinlikler-hero*`). Türkçe **İ** (U+0130) ana fontta yok → **ext**
  fonttan (`manrope-800-ext.woff2`, glif "Idotaccent") alınır; Y/E/N ana fonttan.

## gen-gorsel-2030.py

Görseldeki **"2030" yazısı**, `fonts/manrope-800.woff2`'den `<path>`'e çevrilmiştir.

```
python3 arac/gen-gorsel-2030.py            # yalnız ANA sürüm (2030-hero.svg, 1600×900)
python3 arac/gen-gorsel-2030.py --og       # OG sürümü (2030-hero-og.svg, 1200×630)
python3 arac/gen-gorsel-2030.py --kart      # KART sürümü (2030-hero-kart.svg, 640×360)
python3 arac/gen-gorsel-2030.py --hepsi     # üçü birden
```
**Ne üretir:** `images/icgoruler/` altına üç SVG (hero + og:image + hub kartı kapağı).
**Bağımlılık:** `fonttools` + `brotli` (ZORUNLU — `pip3 install --user fonttools brotli`).
Eksikse üreteç anlaşılır hatayla durur.

**WebP önizlemeleri** (bu ortamda SVG rasterize aracı yok → Chrome headless + PIL):
```
# her SVG'yi wrap'leyip Chrome ile PNG'ye çevir, sonra PIL ile WEBP q82:
#   Chrome headless --screenshot ile <w>×<h> PNG al → Pillow: im.save(x,"WEBP",quality=82)
# (Pillow: pip3 install --user pillow). Ayrıntılı komut geçmişi oturum kaydında.
```
SVG değişmediyse WebP'yi yeniden üretmeye gerek yok (dosyalar git'te).

**Başka bir yıl için** (ör. 2031): `gen-gorsel-2030.py` içindeki `path_2030()` çağrılarındaki
`"2030"` dizisini değiştir ve scripti **yeniden çalıştır** — "2030" path olduğu için elle
düzenlenemez. Konum/akıntı geometrisi onaylanmış mockup'tan birebir; değiştirme.

## gen-gorsel-2026-yetkinlikler.py
```
python3 arac/gen-gorsel-2026-yetkinlikler.py --hepsi   # 2026-yetkinlikler-hero{,-og,-kart}.svg
```
CV kartı + yetkinlik penceresi + 8 hücre; 3 hücre turuncu konturlu, üzerlerinde **"YENİ"** rozeti.
**Turuncu KURALI:** yalnız 3 rozet dolgusu + 3 hücre konturu (başka yerde turuncu yok). "YENİ"
metni path (`<text>` yok), İ ext fonttan. Geometri onaylanmış mockup'tan birebir; değiştirme.

## WebP / JPG önizlemeleri
Bu ortamda SVG rasterize aracı yok → **Chrome headless + PIL**:
```
# SVG'yi <w>×<h> boyutunda bir HTML'e sar, Chrome --headless --screenshot ile PNG al,
# sonra Pillow: im.convert("RGB").save(x,"WEBP",quality=82)  ve gerekiyorsa .save(y,"JPEG",quality=85)
# (Pillow: pip3 install --user pillow)
```
⚠️ **og:image için JPG üret** (`.jpg`, kalite ~85): bazı platformlar WebP og görselini işlemiyor.
Sitede WebP kalır, yalnız `og:image`/`kapakOgJpg` JPG'yi işaret eder. SVG değişmediyse yeniden
üretmeye gerek yok (dosyalar git'te).

---

# Ana Sayfa Üretimi (`arac/gen-index.js`)

Ana sayfa (`index.html`) `_kaynak/master-v1.html`'den üretilir. Bu ayrı bir sistemdir.

```
node arac/gen-index.js
```
**Ne üretir:** `_kaynak/master-v1.html`'in gövdesi (CSS/JS/HTML) + **mevcut `index.html`'in
`<head>`'i** (SEO/favicon/gömülü fontlar) → self-contained kök `index.html`. Görseller (logo,
İŞKUR) base64 gömülür.

**Nelere dikkat:**
- **Gövde değişikliği** (metin, bölüm, stil, script) → `_kaynak/master-v1.html`'i düzenle, sonra bu komutu çalıştır.
- **Head / SEO değişikliği** (title, description, canonical, og:, JSON-LD) → **doğrudan `index.html`'in
  `<head>`'ini düzenle**, sonra komutu çalıştır. Üreteç head'i mevcut `index.html`'den okur ve **korur**
  (master-v1'in head'i KULLANILMAZ). Bayat bir yedek dosyası kullanılmaz.
- Üreteç **yazmadan önce güvenlik denetimi** yapar: head'de title/canonical/og/JSON-LD var mı,
  `@font-face` 8 mi, çıktı boyutu bir öncekinden %10'dan fazla sapıyor mu. Biri bozuksa **dosya yazılmaz**, hata verir.
- Çalıştırdıktan sonra `git diff index.html` ile değişikliğin **yalnız beklenen bölge** olduğunu doğrula.

**Commit'lenecek:** `index.html` (+ değiştirdiysen `_kaynak/master-v1.html` gitignore'da kalır; yedek al).
