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

## 3. Sık sorulanlar
- **Hiç yayında içerik yoksa?** Sayfa "İlk içeriklerimiz çok yakında" boş durumunu
  gösterir, `noindex` olur ve sitemap'ten çıkarılır (ince içerik cezası almamak için).
- **Kategori filtreleri?** Yalnız **içeriği olan** kategorinin butonu görünür (yanında sayı).
- **Makale sayfaları (tek tek yazı sayfaları)?** Henüz yok — kartlarda "Yakında" yazar.
  Faz 2'de `arac/gen-icgoruler.js` içindeki `ARTICLES_LIVE = false` → `true` yapılıp
  makale üretimi eklenecek; kartlar o zaman tıklanabilir olur.

## 4. Dosya haritası (bu sistem)
- `icerik/icgoruler.json` — **üretim verisi** (yayın)
- `icerik/icgoruler.demo.json` — örnek veri (gitignore'da, yalnız yerel test)
- `arac/gen-icgoruler.js` — üreteç
- `arac/partials/` — ortak parçalar: `head-base.html` (meta+font+CSS), `nav.html`,
  `footer.html`, `drawer.html` (mobil menü)
- `fonts/*.woff2` — paylaşılan Manrope (400/700/800, latin+ext)
- `icgoruler/index.html` — **üretilen** hub (elle düzenleme; üreteç üzerine yazar)

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
