/*
 * Netlify "submission-created" olay fonksiyonu
 * ---------------------------------------------
 * Aday başvuru formu (name="aday-basvuru") gönderildiğinde tetiklenir.
 * CV dosyasını Netlify'ın sakladığı URL'den indirir ve Microsoft Graph API
 * ile CV'yi EK yaparak e-posta gönderir (info@talevo.com.tr → info@talevo.com.tr).
 *
 * İşveren formu (name="contact") ATLANIR — bu fonksiyon yalnız aday başvurusu içindir.
 *
 * GEREKLİ ORTAM DEĞİŞKENLERİ (Netlify panelinde tanımlanır — DEĞERLER KODA YAZILMAZ):
 *   GRAPH_TENANT_ID       Microsoft Entra kiracı (tenant) kimliği
 *   GRAPH_CLIENT_ID       App registration (uygulama) kimliği
 *   GRAPH_CLIENT_SECRET   App registration client secret
 *   MAIL_SENDER  (ops.)   Gönderen kutu — varsayılan: info@talevo.com.tr
 *   MAIL_TO      (ops.)   Alıcı adres — varsayılan: info@talevo.com.tr
 *
 * NOT: Bu fonksiyon başarısız olsa bile başvuru Netlify Forms panelinde CV linkiyle
 *      kayıtlı kalır — SESSİZ KAYIP OLMAZ. Fonksiyon yalnızca "CV'yi ek yapıp mail atma"
 *      katmanıdır. Node 18+ gerekir (global fetch/Buffer/URLSearchParams; ek bağımlılık yok).
 */

'use strict';

const esc = (s) => String(s == null ? '' : s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const row = (k, v) => '<tr><td style="color:#6b6b76;padding:4px 12px 4px 0">' + esc(k) + '</td><td style="padding:4px 0"><strong>' + esc(v || '—') + '</strong></td></tr>';

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const payload = body.payload || {};

    // Yalnız aday başvuru formu
    if (payload.form_name !== 'aday-basvuru') {
      return { statusCode: 200, body: 'skip (form: ' + payload.form_name + ')' };
    }

    const d = payload.data || {};

    // --- CV dosya URL'ini bul ---
    let cvUrl = d.cv_file;
    if (Array.isArray(cvUrl)) cvUrl = cvUrl[0];
    if (!(typeof cvUrl === 'string' && /^https?:\/\//.test(cvUrl))) {
      // yedek: data içinde http(s) ile başlayan ilk değer
      cvUrl = Object.values(d).find((v) => typeof v === 'string' && /^https?:\/\//.test(v));
    }
    if (!cvUrl) {
      // ilk canlı testte gerçek payload şeklini loglardan görebilmek için:
      console.error('[aday-mail] CV URL bulunamadı. data anahtarları:', Object.keys(d).join(','), '| cv_file =', JSON.stringify(d.cv_file));
    }

    // --- Ortam değişkenleri ---
    const TENANT = process.env.GRAPH_TENANT_ID;
    const CLIENT = process.env.GRAPH_CLIENT_ID;
    const SECRET = process.env.GRAPH_CLIENT_SECRET;
    const SENDER = process.env.MAIL_SENDER || 'info@talevo.com.tr';
    const TO = process.env.MAIL_TO || 'info@talevo.com.tr';
    if (!TENANT || !CLIENT || !SECRET) {
      console.error('[aday-mail] Eksik ortam değişkeni (GRAPH_TENANT_ID / GRAPH_CLIENT_ID / GRAPH_CLIENT_SECRET).');
      return { statusCode: 500, body: 'missing env' };
    }

    // --- 1) CV'yi indir (≤3 MB ise ek yap) ---
    const attachments = [];
    if (cvUrl) {
      try {
        const fileRes = await fetch(cvUrl);
        if (fileRes.ok) {
          const buf = Buffer.from(await fileRes.arrayBuffer());
          // TEŞHİS: ilk gerçek gönderimde ek yapısını loglardan görebilmek için
          // (indirmenin content-type'ı çoğu zaman genel 'octet-stream' döner — bu yüzden
          //  türü asıl baytlardan / uzantıdan saptıyoruz, indirme başlığından DEĞİL).
          console.log(
            '[aday-mail] CV indi:',
            'bayt=' + buf.length,
            '| dl-content-type=' + (fileRes.headers.get('content-type') || '-'),
            '| dl-content-disposition=' + (fileRes.headers.get('content-disposition') || '-'),
            '| url-son=' + lastPathSegment(cvUrl),
            '| magic=' + (extFromMagic(buf) || '-')
          );
          if (buf.length <= 3 * 1024 * 1024) {
            const meta = attachmentMeta(cvUrl, fileRes, buf, d);
            console.log('[aday-mail] Ek adı=' + meta.name + ' | contentType=' + meta.contentType);
            attachments.push({
              '@odata.type': '#microsoft.graph.fileAttachment',
              name: meta.name,
              contentType: meta.contentType,
              contentBytes: buf.toString('base64'),
            });
          } else {
            console.error('[aday-mail] CV 3 MB üstü (' + buf.length + ' bayt) — ek yapılmadı, link gövdeye eklenecek.');
          }
        } else {
          console.error('[aday-mail] CV indirilemedi, HTTP', fileRes.status);
        }
      } catch (e) {
        console.error('[aday-mail] CV indirme hatası:', e && e.message);
      }
    }

    // --- 2) Graph access token (client credentials) ---
    const tokenRes = await fetch('https://login.microsoftonline.com/' + encodeURIComponent(TENANT) + '/oauth2/v2.0/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: CLIENT,
        client_secret: SECRET,
        scope: 'https://graph.microsoft.com/.default',
        grant_type: 'client_credentials',
      }).toString(),
    });
    if (!tokenRes.ok) {
      console.error('[aday-mail] Token alınamadı:', tokenRes.status, await safeText(tokenRes));
      return { statusCode: 502, body: 'token error' };
    }
    const token = (await tokenRes.json()).access_token;

    // --- 3) sendMail ---
    const adSoyad = ((d.first_name || '') + ' ' + (d.last_name || '')).trim() || 'Aday';
    const html =
      '<div style="font-family:Segoe UI,Arial,sans-serif;color:#1a1a22">' +
      '<h2 style="margin:0 0 12px">Yeni aday başvurusu</h2>' +
      '<table cellspacing="0" style="border-collapse:collapse;font-size:14px">' +
      row('Ad Soyad', adSoyad) +
      row('E-posta', d.email) +
      row('Telefon', d.phone) +
      row('KVKK onayı', d.kvkk_notice_acknowledged ? 'Onaylandı' : '—') +
      row('Mesaj', d.message) +
      (attachments.length ? '' : row('CV', cvUrl ? '<a href="' + esc(cvUrl) + '">CV linkini indir (ek eklenemedi)</a>' : '—')) +
      '</table>' +
      (attachments.length ? '<p style="color:#6b6b76;font-size:12px;margin-top:12px">Özgeçmiş bu e-postaya EK olarak iliştirilmiştir.</p>' : '') +
      '</div>';

    const message = {
      subject: 'Yeni aday başvurusu: ' + adSoyad,
      body: { contentType: 'HTML', content: html },
      toRecipients: [{ emailAddress: { address: TO } }],
      attachments,
    };
    if (d.email) message.replyTo = [{ emailAddress: { address: d.email } }];

    const mailRes = await fetch('https://graph.microsoft.com/v1.0/users/' + encodeURIComponent(SENDER) + '/sendMail', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, saveToSentItems: false }),
    });
    if (!mailRes.ok) {
      console.error('[aday-mail] sendMail hatası:', mailRes.status, await safeText(mailRes));
      return { statusCode: 502, body: 'sendmail error' };
    }

    console.log('[aday-mail] Gönderildi:', adSoyad, '| ek:', attachments.length ? 'CV var' : 'YOK (link gövdede)');
    return { statusCode: 200, body: 'ok' };
  } catch (e) {
    console.error('[aday-mail] Genel hata:', e && e.message);
    return { statusCode: 500, body: 'error' };
  }
};

// Uzantı → DOĞRU MIME tipi (Outlook'un eki tanıması bu tipe bağlıdır)
const MIME_BY_EXT = {
  '.pdf': 'application/pdf',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.doc': 'application/msword',
};

// EN GÜVENİLİR yöntem: dosyanın ilk baytlarından (magic bytes) gerçek türü sapta.
// Netlify indirme yanıtının content-type'ı ve URL'i çoğu zaman genel/uzantısızdır;
// baytlar ise dosyanın gerçek türünü kesin söyler.
function extFromMagic(buf) {
  if (!buf || buf.length < 4) return '';
  // "%PDF" → PDF
  if (buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46) return '.pdf';
  // "PK.." (ZIP) → OOXML; form yalnız pdf/doc/docx kabul ettiğinden = .docx
  if (buf[0] === 0x50 && buf[1] === 0x4b && (buf[2] === 0x03 || buf[2] === 0x05 || buf[2] === 0x07)) return '.docx';
  // OLE2 (eski Word .doc): D0 CF 11 E0
  if (buf[0] === 0xd0 && buf[1] === 0xcf && buf[2] === 0x11 && buf[3] === 0xe0) return '.doc';
  return '';
}

// URL'nin son yol parçası (dosya adı olabilir), sorgu/hash arındırılmış
function lastPathSegment(url) {
  try {
    const p = decodeURIComponent(String(url).split('?')[0].split('#')[0]);
    return p.substring(p.lastIndexOf('/') + 1) || '';
  } catch (_) { return ''; }
}

// Yalnız kabul edilen uzantılardan birini döndür (.pdf/.doc/.docx), yoksa ''
function knownExt(name) {
  const m = String(name || '').toLowerCase().match(/\.(pdf|docx|doc)(?:$|\?)/);
  return m ? '.' + m[1] : '';
}

// content-disposition başlığından orijinal dosya adını çıkar
function nameFromDisposition(res) {
  const cd = (res && res.headers.get('content-disposition')) || '';
  let m = cd.match(/filename\*=(?:UTF-8'')?([^;]+)/i);
  if (m && m[1]) { const v = m[1].trim().replace(/^"|"$/g, ''); try { return decodeURIComponent(v); } catch (_) { return v; } }
  m = cd.match(/filename="?([^";]+)"?/i);
  return m && m[1] ? m[1].trim() : '';
}

// Ek için doğru { name, contentType } üret.
// Uzantı önceliği: MAGIC BAYTLAR → orijinal ad uzantısı → indirme content-type → URL uzantısı.
// contentType HER ZAMAN saptanan uzantıdan türetilir (indirme başlığından değil).
function attachmentMeta(url, res, buf, d) {
  const orig = nameFromDisposition(res) || lastPathSegment(url);
  const dlCt = (res && res.headers.get('content-type')) || '';
  let extCt = '';
  if (/pdf/i.test(dlCt)) extCt = '.pdf';
  else if (/wordprocessingml|officedocument\.word/i.test(dlCt)) extCt = '.docx';
  else if (/msword/i.test(dlCt)) extCt = '.doc';

  const ext = extFromMagic(buf) || knownExt(orig) || extCt || knownExt(url) || '';
  const contentType = MIME_BY_EXT[ext] || 'application/octet-stream';

  // Ad tabanı: orijinal ad varsa onu (uzantısız) kullan, yoksa aday adından üret
  let base = '';
  if (orig) {
    const cleaned = orig.replace(/\.(pdf|docx|doc)$/i, '').replace(/[\\/:*?"<>|]+/g, ' ').trim();
    if (cleaned) base = cleaned;
  }
  if (!base) {
    base = ('ozgecmis-' + (d.first_name || '') + '-' + (d.last_name || '')).trim()
      .replace(/\s+/g, '-').replace(/-+$/, '') || 'ozgecmis';
  }
  return { name: base + ext, contentType };
}

async function safeText(res) { try { return (await res.text()).slice(0, 300); } catch (_) { return ''; } }
