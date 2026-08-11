'use strict';
/* ============================================================
   TALEVO — küçük Markdown ayrıştırıcı (bağımlılık YOK)
   Desteklenen alt küme (fazlası GEREKMİYOR):
     ## H2 · ### H3 · paragraf · **kalın** · *italik* · [bağlantı](url)
     - / * madde listesi · 1. numaralı liste · > alıntı
     | tablo | (başlık + --- ayırıcı + satırlar)
     :::istatistik  ·  :::kutu BAŞLIK  ·  :::cta BAŞLIK
   Güvenlik: tüm içerik metni HTML-escape edilir; dış bağlantılara rel="noopener"
   (target YOK); yalnız http(s)/ /  # / mailto url'lerine izin (javascript: engellenir).
   Dışa verir: parse(md) -> { html, headings:[{id,text}] (yalnız H2, Kaynakça hariç) }
             + esc, inline yardımcıları.
   ============================================================ */

function esc(s){
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Türkçe sadeleştirme + slug (başlık id'leri)
function slugify(t){
  const map = {'ç':'c','ğ':'g','ı':'i','ö':'o','ş':'s','ü':'u','Ç':'c','Ğ':'g','İ':'i','I':'i','Ö':'o','Ş':'s','Ü':'u'};
  return String(t).replace(/[çğıöşüÇĞİIÖŞÜ]/g, m => map[m] || m)
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'bolum';
}

// satır içi: escape SONRA bağlantı → kalın → italik
function inline(text){
  let t = esc(text);
  // [metin](url)
  t = t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (m, txt, url) => {
    url = url.trim();
    if(!/^(https?:\/\/|\/|#|mailto:)/i.test(url)) return txt;   // güvensiz url → yalnız metin
    const ext = /^https?:\/\//i.test(url);                       // dış bağlantı
    return '<a href="' + url + '"' + (ext ? ' rel="noopener"' : '') + '>' + txt + '</a>';
  });
  t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');      // **kalın**
  t = t.replace(/\*([^*]+)\*/g, '<em>$1</em>');                  // *italik*
  return t;
}

// kutu/cta gövdesi: boş-satırla ayrılmış paragraflar
function paragraphs(lines){
  const chunks = []; let cur = [];
  lines.forEach(l => { if(/^\s*$/.test(l)){ if(cur.length){chunks.push(cur);cur=[];} } else cur.push(l); });
  if(cur.length) chunks.push(cur);
  return chunks.map(c => '<p>' + inline(c.join(' ')) + '</p>').join('');
}

function renderFence(kind, title, buf){
  if(kind === 'istatistik'){
    const items = buf.filter(l => l.trim()).map(l => {
      const idx = l.indexOf('|');
      const val = (idx >= 0 ? l.slice(0, idx) : l).trim();
      const desc = (idx >= 0 ? l.slice(idx + 1) : '').trim();
      return '<div class="stat" role="listitem">'
        + '<span class="stat-val">' + inline(val) + '</span>'
        + '<span class="stat-desc">' + inline(desc) + '</span></div>';
    });
    return '<div class="md-stats" role="list">' + items.join('') + '</div>';
  }
  if(kind === 'kutu'){
    return '<aside class="md-box">'
      + (title ? '<p class="md-box-title">' + inline(title) + '</p>' : '')
      + paragraphs(buf) + '</aside>';
  }
  if(kind === 'cta'){
    return '<aside class="md-cta">'
      + (title ? '<h2 class="md-cta-title">' + inline(title) + '</h2>' : '')
      + paragraphs(buf) + '</aside>';
  }
  // bilinmeyen konteyner → kutu gibi davran (güvenli varsayılan)
  return '<aside class="md-box">' + paragraphs(buf) + '</aside>';
}

function renderTable(tbl){
  const parse = l => l.replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|').map(c => c.trim());
  const rows = tbl.map(parse);
  if(rows.length < 2) return '';   // en az başlık + ayırıcı
  const header = rows[0];
  // 2. satır ayırıcı (---) ise atla; değilse tüm satırları gövde say
  const isSep = rows[1].every(c => /^:?-{2,}:?$/.test(c.replace(/\s/g,'')) || c === '');
  const body = rows.slice(isSep ? 2 : 1);
  const thead = '<thead><tr>' + header.map(h => '<th scope="col">' + inline(h) + '</th>').join('') + '</tr></thead>';
  const tbody = '<tbody>' + body.map(r =>
    '<tr>' + r.map(c => '<td>' + inline(c) + '</td>').join('') + '</tr>').join('') + '</tbody>';
  return '<div class="table-scroll" role="region" aria-label="Tablo — yatay kaydırılabilir" tabindex="0">'
    + '<table>' + thead + tbody + '</table></div>';
}

function parse(md){
  if(typeof md !== 'string') throw new Error('md.parse: girdi metin değil');
  const lines = md.replace(/\r\n?/g, '\n').split('\n');
  const out = [], headings = [], used = new Set();
  let inRefs = false;
  function headingId(text){
    let base = slugify(text), id = base, n = 2;
    while(used.has(id)){ id = base + '-' + n; n++; }
    used.add(id); return id;
  }
  let i = 0;
  while(i < lines.length){
    const line = lines[i];
    if(/^\s*$/.test(line)){ i++; continue; }

    // konteyner :::isim [BAŞLIK]
    let mf = /^:::([a-zA-ZçğıöşüÇĞİÖŞÜ]+)[ \t]*(.*)$/.exec(line);
    if(mf){
      const kind = mf[1].toLowerCase(), title = mf[2].trim(), buf = [];
      i++;
      while(i < lines.length && !/^:::\s*$/.test(lines[i])){ buf.push(lines[i]); i++; }
      if(i >= lines.length) throw new Error('Kapatılmamış ":::" bloğu (' + kind + ')');
      i++;   // kapanış ::: atla
      out.push(renderFence(kind, title, buf));
      continue;
    }

    // başlık ## / ###
    let mh = /^(#{2,3})[ \t]+(.*)$/.exec(line);
    if(mh){
      const level = mh[1].length, text = mh[2].trim(), id = headingId(text);
      const isRefs = /^kaynak(ça|ca)$/i.test(text);
      if(isRefs && !inRefs){ out.push('<section class="article-refs">'); inRefs = true; }
      out.push('<h' + level + ' id="' + id + '">' + inline(text) + '</h' + level + '>');
      if(level === 2 && !isRefs) headings.push({ id, text });   // Kaynakça ToC DIŞINDA
      i++; continue;
    }

    // tablo
    if(/^\s*\|/.test(line)){
      const tbl = [];
      while(i < lines.length && /^\s*\|/.test(lines[i])){ tbl.push(lines[i]); i++; }
      out.push(renderTable(tbl)); continue;
    }

    // alıntı >
    if(/^>\s?/.test(line)){
      const buf = [];
      while(i < lines.length && /^>\s?/.test(lines[i])){ buf.push(lines[i].replace(/^>\s?/, '')); i++; }
      out.push('<blockquote>' + inline(buf.join(' ')) + '</blockquote>'); continue;
    }

    // madde listesi - / *
    if(/^[-*][ \t]+/.test(line)){
      const items = [];
      while(i < lines.length && /^[-*][ \t]+/.test(lines[i])){ items.push(lines[i].replace(/^[-*][ \t]+/, '')); i++; }
      out.push('<ul>' + items.map(it => '<li>' + inline(it) + '</li>').join('') + '</ul>'); continue;
    }

    // numaralı liste 1.
    if(/^\d+\.[ \t]+/.test(line)){
      const items = [];
      while(i < lines.length && /^\d+\.[ \t]+/.test(lines[i])){ items.push(lines[i].replace(/^\d+\.[ \t]+/, '')); i++; }
      out.push('<ol>' + items.map(it => '<li>' + inline(it) + '</li>').join('') + '</ol>'); continue;
    }

    // paragraf
    const buf = [];
    while(i < lines.length && !/^\s*$/.test(lines[i]) &&
          !/^(#{2,3}[ \t]|:::|\s*\||>\s?|[-*][ \t]|\d+\.[ \t])/.test(lines[i])){
      buf.push(lines[i]); i++;
    }
    out.push('<p>' + inline(buf.join(' ')) + '</p>');
  }
  if(inRefs) out.push('</section>');
  return { html: out.join('\n'), headings };
}

module.exports = { parse, inline, esc, slugify };
