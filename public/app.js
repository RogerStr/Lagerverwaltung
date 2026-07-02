/* ============================================================
   Gemeinsame Helfer für alle Seiten der Lagerverwaltung.
   Kommuniziert per REST-API mit dem Server (Go-Version, ohne Node.js).
   ============================================================ */

// ---------- API-Helfer ----------
async function api(path, opts) {
  const res = await fetch('/api' + path, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  let data = null;
  try { data = await res.json(); } catch {}
  if (!res.ok) throw new Error(data?.error || ('Fehler ' + res.status));
  return data;
}

// ---------- Formatierung / Escaping ----------
function esc(s) { return (s ?? '').toString().replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
function fmtPreis(p) { return (p == null || p === '') ? '–' : Number(p).toFixed(2); }
function fmtCHF(p) { return Number(p || 0).toFixed(2) + ' CHF'; }
function fmtDatum(s) { return s ? new Date(s).toLocaleDateString('de-CH') : '–'; }
function fmtDatumZeit(s) { return s ? new Date(s).toLocaleString('de-CH', { dateStyle: 'short', timeStyle: 'short' }) : '–'; }

// ---------- Toast ----------
function toast(msg, isErr) {
  const t = document.getElementById('toast');
  if (!t) { if (isErr) alert(msg); return; }
  t.textContent = msg; t.className = 'show' + (isErr ? ' err' : '');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.className = '', isErr ? 4000 : 2400);
}

// ---------- Modal-Helfer ----------
function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }
document.addEventListener('click', e => {
  if (e.target.classList && e.target.classList.contains('modal-backdrop')) e.target.classList.remove('open');
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') document.querySelectorAll('.modal-backdrop.open').forEach(m => m.classList.remove('open'));
});

// ---------- Navigation ----------
function renderNav(active) {
  const seiten = [
    { key: 'lager',     href: 'index.html',     label: '📦 Lager' },
    { key: 'verkauf',   href: 'verkauf.html',   label: '🧾 Neuer Verkauf' },
    { key: 'verkaeufe', href: 'verkaeufe.html', label: '📋 Verkäufe' },
    { key: 'adressen',  href: 'adressen.html',  label: '👤 Adressen' },
  ];
  const links = seiten.map(s => `<a href="${s.href}" class="${s.key === active ? 'active' : ''}">${s.label}</a>`).join('');
  document.getElementById('nav').innerHTML = `
    <span class="brand">Lagerverwaltung</span>
    ${links}
    <span class="spacer"></span>
    <span class="navinfo"><span class="dot" id="statusDot"></span><span id="statusText">verbinde…</span></span>`;
}
function setStatus(ok) {
  const dot = document.getElementById('statusDot'); const txt = document.getElementById('statusText');
  if (dot) dot.className = 'dot' + (ok ? ' on' : '');
  if (txt) txt.textContent = ok ? 'lager.sqlite' : 'getrennt';
}
