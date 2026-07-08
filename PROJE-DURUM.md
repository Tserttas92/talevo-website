# Talevo Website — Durum ve Plan
Son güncelleme: 9 Temmuz 2026

## Proje Bilgileri
- Canlı site: talevo.com.tr (Netlify, otomatik yayın: main branch'e push = canlıya çıkar)
- Repo: github.com/Tserttas92/talevo-website
- Yapı: statik HTML/CSS/JS. index.html (tek sayfalık ana site) + kariyer.html (CRM'e yönlendirme köprüsü)
- DİKKAT: ~/talevo-flow klasörü FARKLI bir projedir, bu siteyle ilgisi yoktur.

## Büyük Hedef
Siteyi "teknoloji entegre edilmiş işe alım şirketi" konumlandırmasının yüzü haline getirmek. Sıra: (1) teknik zemin temizliği → (2) kavramsal/konumlandırma netleşmesi → (3) benchmark → (4) tasarım/içerik yenileme.

## Teknik Denetim Yapıldı (8 Temmuz) — Öncelik Sırası

### Paket 1 — TAMAMLANDI VE CANLIDA ✅
Commit 6ce9453 push edildi, Netlify yayınladı. Push engelleri çözüldü: collaborator (ortak çalışan) yetkisi alındı, Personal Access Token (kişisel erişim anahtarı) oluşturuldu ve Mac Keychain'e kaydedildi — artık push şifre sormuyor.
- [x] netlify.toml'daki /css/* ve /js/* immutable önbellek başlıkları kaldırıldı (yenileme öncesi ŞART'tı, yoksa eski ziyaretçiler bozuk site görürdü)
- [x] sitemap.xml + robots.txt oluşturuldu
- [x] canonical etiketi eklendi (https://talevo.com.tr/)
- [x] Open Graph + Twitter Card etiketleri eklendi (og:image için talevo-logo.png'den 1200x630 og-image.png üretildi)
- [x] JSON-LD Organization şeması eklendi

### Paket 2 — KISMEN TAMAMLANDI 🟡

**TAMAMLANDI VE CANLIDA ✅ (ölü dosya silme):**
Commit 5f7576a push edildi, 843 satır ölü kod temizlendi. Silinenler: js/kariyer.js, css/kariyer.css, kariyer.html.
Canlıda doğrulandı: talevo.com.tr/kariyer hâlâ CRM'e yönlendiriyor — yönlendirme netlify.toml'da yaşadığı için dosya silme yönlendirmeyi bozmadı.

**KALAN İŞ (style.css cerrahi temizliği):**
style.css'teki 43 kullanılmayan sınıf temizlenecek. Bu daha riskli/uzun bir iş çünkü ölü kurallar canlı kuralların arasına sıkışmış (örn. .hero-badge, .hero-visual canlı hero kurallarının arasında) ve mobil (media query) bloklarında tekrar ediyor (satır ~1484-1501, 1593).
- SİLİNECEK ölü sınıflar: hv-* (tüm eski aday penceresi), what-*, services + services-grid, svc-block* + svc-tag, sv-* (c'siz: sv-talent/sv-executive/sv-assessment/sv-design), ayrıca sadece bunlara bağlı red/green/yellow ve status-yes/wait/no.
- KORUNACAK canlı sınıflar (benzer isimli, KARIŞTIRMA): svc-section, svc-grid, svc-card, svc-num, svc-pill, svc-arr, svc-head, svc-h2, svc-lead, svc-card-footer.
- Claude Code'un detaylı sınıf-bazlı analizi mevcut; silme kural bloğu bazında cerrahi yapılmalı, toplu bul-değiştir YAPILMAMALI.

**talevo-logo.png kararı — SİLİNMEDİ, TUTULDU:**
JSON-LD şemasında Google'ın beklediği kurumsal (kare) logo olarak duruyor; og-image afişi bu iş için uygun değil. Boyut optimizasyonu (295 KB) yenilemeye bırakıldı.

### Yenileme sırasında çözülecekler (şimdi dokunma, not):
- og-image.png marka kalitesinde değil; tasarım yenilemesinde markanın yeni görünümüyle uyumlu hale getirilecek
- --muted (#8A8F9A) ve #999 kontrast düşük (WCAG AA altı)
- Başlık hiyerarşisi: h2'den h4'e atlayan bölümler var
- Sekmelerde aria-controls/tabpanel/klavye desteği eksik
- prefers-reduced-motion yok
- Netlify formu için Türkçe teşekkür sayfası (action="/tesekkurler")
- Honeypot alanı type="hidden" yerine CSS ile gizlenmiş görünür input olmalı
- "İşe Alım Üzerine" 3 makale linki href="#" — ya gerçek içerik ya bölüm kaldırılacak
- main.js: hero kartlarında CSS float animasyonu inline parallax transform'unu eziyor — tek transform kaynağına indirilecek
- Favicon: SVG data-URI yetersiz, favicon.ico/PNG + apple-touch-icon eklenecek

### Şimdilik yapılmayacak (bilinçli erteleme):
- WebP dönüşümü, font self-hosting, CSP başlığı, minify

## Açık Maddeler
- [~] Paket 2 — ölü dosya silme bitti; style.css cerrahi temizliği KALDI (bkz. Paket 2)
- [ ] Kavramsal/konumlandırma dokümanı bulunacak ve sohbete getirilecek (şu an elde yok)
- [ ] Mobilde hero kartları kontrolü: telefondan talevo.com.tr'ye bakılacak, kartlar taşıyor mu?
- [ ] Benchmark çalışması yapılacak (teknoloji odaklı işe alım şirketi siteleri)
- [x] Site sahibi ilk git add/commit/push pratiğini yaptı (Paket 1 gönderiminde öğrendi)

## Sıradaki Oturum
İki seçenekten biriyle başlanabilir:
- (a) style.css cerrahi temizliğini yapıp Paket 2'yi bitir, VEYA
- (b) Talevo'nun konumlandırmasını konuş.
Önemli: Tasarım yenilemesine geçmeden önce konumlandırma netleşmeli.

## Çalışma Şekli
Strateji ve planlama Claude.ai sohbetinde, uygulama bu klasörde Claude Code ile yapılıyor. Commit/push adımlarını site sahibi elle yapıyor (öğrenme amaçlı).
