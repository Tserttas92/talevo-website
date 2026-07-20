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
          if (buf.length <= 3 * 1024 * 1024) {
            attachments.push({
              '@odata.type': '#microsoft.graph.fileAttachment',
              name: fileName(cvUrl, fileRes, d),
              contentType: fileRes.headers.get('content-type') || 'application/octet-stream',
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

// CV dosya adını content-disposition / content-type / URL'den türet
function fileName(url, res, d) {
  const cd = res.headers.get('content-disposition') || '';
  const m = cd.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
  if (m && m[1]) { try { return decodeURIComponent(m[1]); } catch (_) { return m[1]; } }
  const ct = res.headers.get('content-type') || '';
  let ext = '';
  if (/pdf/i.test(ct)) ext = '.pdf';
  else if (/word|docx|officedocument/i.test(ct)) ext = '.docx';
  else { const u = String(url).match(/\.(pdf|docx?|)(?:$|\?)/i); if (u && u[1]) ext = '.' + u[1].toLowerCase(); }
  const base = ('ozgecmis-' + (d.first_name || '') + '-' + (d.last_name || '')).trim().replace(/\s+/g, '-').replace(/-+$/,'') || 'ozgecmis';
  return base + ext;
}

async function safeText(res) { try { return (await res.text()).slice(0, 300); } catch (_) { return ''; } }
