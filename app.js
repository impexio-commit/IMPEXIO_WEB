/* ============================================================
   IMPEXIO v2 — app.js
   ============================================================ */

// ── Data ─────────────────────────────────────────────────────
const CLIENT_CODE = 'Demo001';

const USERS = [
  { username: 'Admin', password: 'Admin', role: 'Administrator' }
];

const COMPANIES = [
  {
    id: 'C001',
    name: 'Impexio Trade Solutions Pvt. Ltd.',
    address: '401, Trade Tower, GIFT City, Gandhinagar',
    gst: '24AABCI1234A1Z5',
    version: 'v1.0 Professional'
  },
  {
    id: 'C002',
    name: 'Global Exim Enterprises',
    address: '12, Export House, Ashram Road, Ahmedabad',
    gst: '24BBCGE5678B2Y6',
    version: 'v1.0 Standard'
  }
];

const YEARS = [
  { id: 'Y1', label: '2025-26', start: '01 Apr 2025', end: '31 Mar 2026' },
  { id: 'Y2', label: '2024-25', start: '01 Apr 2024', end: '31 Mar 2025' },
  { id: 'Y3', label: '2023-24', start: '01 Apr 2023', end: '31 Mar 2024' }
];

// ── Session ───────────────────────────────────────────────────
const sess = {
  clientCode: null, username: null, role: null,
  company: null, year: null
};

function saveSess() { sessionStorage.setItem('impexio', JSON.stringify(sess)); }
function loadSess() {
  const s = sessionStorage.getItem('impexio');
  if (s) Object.assign(sess, JSON.parse(s));
}
function page() {
  const p = location.pathname;
  if (p.includes('login')) return 'login';
  if (p.includes('main'))  return 'main';
  return 'index';
}

// ── Navbar ────────────────────────────────────────────────────
window.addEventListener('scroll', () => {
  const n = document.getElementById('navbar');
  if (n) n.classList.toggle('scrolled', scrollY > 20);
});

function toggleDD(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const isOpen = el.classList.contains('open');
  document.querySelectorAll('.nav-item.open').forEach(i => i.classList.remove('open'));
  if (!isOpen) el.classList.add('open');
}

document.addEventListener('click', e => {
  if (!e.target.closest('.nav-item')) {
    document.querySelectorAll('.nav-item.open').forEach(i => i.classList.remove('open'));
  }
});

function toggleMob() {
  const m = document.getElementById('navMob');
  const h = document.getElementById('ham');
  if (!m) return;
  const o = m.classList.toggle('open');
  if (h) h.classList.toggle('open', o);
}

function toggleMobDD(id, btn) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.toggle('open');
}

function gotoLogin() { window.location.href = 'login.html'; }

// ── Scroll Animations ─────────────────────────────────────────
function initScrollAnim() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.style.opacity = '1';
        e.target.style.transform = 'translateY(0)';
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.feat-card, .mod-card').forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(28px)';
    el.style.transition = `opacity 0.5s ${i * 0.06}s ease, transform 0.5s ${i * 0.06}s ease`;
    obs.observe(el);
  });
}

function animateCounters() {
  document.querySelectorAll('[data-target]').forEach(el => {
    const target = parseInt(el.dataset.target);
    const suffix = el.dataset.suffix || '';
    let cur = 0;
    const step = target / 40;
    const t = setInterval(() => {
      cur = Math.min(cur + step, target);
      el.textContent = Math.round(cur) + suffix;
      if (cur >= target) clearInterval(t);
    }, 30);
  });
}

// ── Shake ─────────────────────────────────────────────────────
(function () {
  const s = document.createElement('style');
  s.textContent = '@keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-8px)}40%{transform:translateX(8px)}60%{transform:translateX(-5px)}80%{transform:translateX(5px)}}';
  document.head.appendChild(s);
})();

function shake(el) {
  if (!el) return;
  el.style.animation = 'none';
  void el.offsetHeight;
  el.style.animation = 'shake 0.4s ease';
}

// ── Login Steps ───────────────────────────────────────────────
let curStep = 0;

function goToStep(n) {
  document.querySelectorAll('.login-step').forEach(s => s.classList.remove('active'));
  const el = document.getElementById('step' + n);
  if (el) el.classList.add('active');

  for (let i = 0; i < 4; i++) {
    const d = document.getElementById('dot' + i);
    if (!d) continue;
    d.classList.remove('active', 'done');
    if (i < n) d.classList.add('done');
    if (i === n) d.classList.add('active');
  }
  curStep = n;
}

function showErr(step, msg) {
  const box = document.getElementById('err' + step);
  const txt = document.getElementById('err' + step + 'msg');
  if (!box) return;
  if (msg && txt) txt.textContent = msg;
  box.classList.add('show');
  setTimeout(() => box.classList.remove('show'), 4000);
}

function verifyClient() {
  const val = (document.getElementById('clientCode')?.value || '').trim();
  if (!val) { showErr(0, 'Please enter your client code.'); return; }
  if (val !== CLIENT_CODE) {
    showErr(0, `Client code "${val}" not found. Try Demo001.`);
    shake(document.getElementById('clientCode'));
    return;
  }
  sess.clientCode = val;
  goToStep(1);
}

function verifyLogin() {
  const u = (document.getElementById('username')?.value || '').trim();
  const p = document.getElementById('password')?.value || '';
  if (!u || !p) { showErr(1, 'Please enter username and password.'); return; }
  const match = USERS.find(x => x.username === u && x.password === p);
  if (!match) {
    showErr(1, 'Invalid credentials. Try Admin / Admin.');
    shake(document.getElementById('password'));
    document.getElementById('password').value = '';
    return;
  }
  sess.username = match.username;
  sess.role = match.role;
  buildCompanies();
  goToStep(2);
}

function buildCompanies() {
  const list = document.getElementById('compList');
  if (!list) return;
  list.innerHTML = '';
  COMPANIES.forEach((c, i) => {
    const card = document.createElement('div');
    card.className = 'sel-card' + (i === 0 ? ' chosen' : '');
    card.dataset.id = c.id;
    card.innerHTML = `
      <div class="sel-head">
        <div class="sel-name">🏢 ${c.name}</div>
        <div class="sel-check">✓</div>
      </div>
      <div class="sel-tags">
        <span class="sel-tag">📍 ${c.address.split(',')[0]}</span>
        <span class="sel-tag">GST: ${c.gst}</span>
        <span class="sel-tag">${c.version}</span>
      </div>`;
    card.addEventListener('click', () => {
      list.querySelectorAll('.sel-card').forEach(s => s.classList.remove('chosen'));
      card.classList.add('chosen');
    });
    list.appendChild(card);
  });
}

function pickCompany() {
  const sel = document.querySelector('#compList .sel-card.chosen');
  if (!sel) { alert('Please select a company.'); return; }
  sess.company = COMPANIES.find(c => c.id === sel.dataset.id);
  buildYears();
  goToStep(3);
}

function buildYears() {
  const list = document.getElementById('yearList');
  if (!list) return;
  list.innerHTML = '';
  YEARS.forEach((y, i) => {
    const card = document.createElement('div');
    card.className = 'sel-card' + (i === 0 ? ' chosen' : '');
    card.dataset.id = y.id;
    card.innerHTML = `
      <div class="sel-head">
        <div class="sel-name">📅 FY ${y.label}</div>
        <div class="sel-check">✓</div>
      </div>
      <div class="sel-tags">
        <span class="sel-tag">Start: ${y.start}</span>
        <span class="sel-tag">End: ${y.end}</span>
      </div>`;
    card.addEventListener('click', () => {
      list.querySelectorAll('.sel-card').forEach(s => s.classList.remove('chosen'));
      card.classList.add('chosen');
    });
    list.appendChild(card);
  });
}

function pickYear() {
  const sel = document.querySelector('#yearList .sel-card.chosen');
  if (!sel) { alert('Please select a year.'); return; }
  sess.year = YEARS.find(y => y.id === sel.dataset.id);
  saveSess();

  // Smooth exit
  const shell = document.querySelector('.login-shell');
  if (shell) {
    shell.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
    shell.style.opacity = '0';
    shell.style.transform = 'scale(0.98)';
    setTimeout(() => { window.location.href = 'main.html'; }, 400);
  } else {
    window.location.href = 'main.html';
  }
}

function goBack(from) { goToStep(from - 1); }

// Enter key support
document.addEventListener('keydown', e => {
  if (e.key !== 'Enter') return;
  if (curStep === 0) verifyClient();
  else if (curStep === 1) verifyLogin();
  else if (curStep === 2) pickCompany();
  else if (curStep === 3) pickYear();
});

// ── Dashboard ─────────────────────────────────────────────────
function initDash() {
  loadSess();
  if (!sess.username || !sess.year) {
    window.location.href = 'login.html';
    return;
  }

  const c = sess.company;
  const y = sess.year;

  set('ds-client',  sess.clientCode || '—');
  set('ds-company', c ? c.name.split(' ').slice(0,3).join(' ') : '—');
  set('ds-year',    y ? `FY ${y.label}` : '—');
  set('ds-user',    sess.username || '—');
  set('ds-role',    sess.role || '—');

  set('dtbUname', sess.username || 'Admin');
  set('dtbRole',  sess.role || 'Administrator');

  const av = document.getElementById('dtbAv');
  if (av && sess.username) av.textContent = sess.username[0].toUpperCase();

  // Meta chips
  const meta = document.getElementById('dtbMeta');
  if (meta && c && y) {
    meta.innerHTML = `
      <div class="dtb-chip">🏷️ <strong>${sess.clientCode}</strong></div>
      <div class="dtb-chip">🏢 <strong>${c.name.split(' ').slice(0,3).join(' ')}</strong></div>
      <div class="dtb-chip">📅 <strong>FY ${y.label}</strong></div>`;
  }

  // Stagger tiles
  document.querySelectorAll('.m-tile').forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(18px)';
    el.style.transition = `opacity 0.4s ${i * 0.04}s ease, transform 0.4s ${i * 0.04}s ease`;
    requestAnimationFrame(() => { el.style.opacity = '1'; el.style.transform = 'translateY(0)'; });
  });
}

function set(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function openMod(name) {
  const toast = document.getElementById('toast');
  const icon  = document.getElementById('toastIcon');
  const msg   = document.getElementById('toastMsg');
  if (!toast) return;
  if (icon) icon.textContent = '🚀';
  if (msg)  msg.textContent  = `Opening: ${name}`;
  toast.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toast.classList.remove('show'), 3000);
}

function doLogout() {
  if (confirm('Logout from IMPEXIO?')) {
    sessionStorage.removeItem('impexio');
    window.location.href = 'index.html';
  }
}

// ── Init ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const p = page();

  if (p === 'index') {
    setTimeout(animateCounters, 900);
    initScrollAnim();
  }

  if (p === 'login') {
    loadSess();
    if (sess.username && sess.year) { window.location.href = 'main.html'; return; }
  }

  if (p === 'main') {
    initDash();
  }
});
