/* ============================================================
   IMPEXIO v3 — app.js
   JWT Auth + ClientCode Filter + Subscription Expiry Check
   ============================================================ */

const API_BASE = 'https://impexio.in/api';

const YEARS = [
  { id: 'Y1', label: '2025-26', start: '01 Apr 2025', end: '31 Mar 2026' },
  { id: 'Y2', label: '2024-25', start: '01 Apr 2024', end: '31 Mar 2025' },
  { id: 'Y3', label: '2023-24', start: '01 Apr 2023', end: '31 Mar 2024' }
];

let sess = null;

function loadSess() {
  try {
    const raw = sessionStorage.getItem('impexio');
    if (!raw) { redirectToLogin(); return; }
    sess = JSON.parse(raw);
    if (!sess || !sess.token) { redirectToLogin(); return; }
    if (sess.expiry && new Date(sess.expiry) < new Date()) {
      sessionStorage.removeItem('impexio');
      redirectToLogin(); return;
    }
    if (!sess.year && page() === 'main') {
      redirectToLogin(); return;
    }
  } catch(e) {
    redirectToLogin();
  }
}

function saveSess() {
  sessionStorage.setItem('impexio', JSON.stringify(sess));
}

function redirectToLogin() {
  window.location.href = 'login.html';
}

function getToken() {
  return sess?.token || '';
}

function getClientCode() {
  return sess?.clientCode || '';
}

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + getToken()
  };
}

function checkSubscription() {
  if (!sess) return;
  if (sess.role === 'Owner') return;
  if (!sess.subExpiry) return;
  const expiry = new Date(sess.subExpiry);
  const now    = new Date();
  if (expiry < now) {
    sessionStorage.removeItem('impexio');
    alert('Your subscription has expired. Please contact your administrator.');
    window.location.href = 'login.html';
    return;
  }
  const daysLeft = Math.ceil((expiry - now) / (1000*60*60*24));
  if (daysLeft <= 7) {
    const toast = document.getElementById('toast');
    const icon  = document.getElementById('toastIcon');
    const msg   = document.getElementById('toastMsg');
    if (toast) {
      if (icon) icon.textContent = '';
      if (msg)  msg.textContent  = `Subscription expires in ${daysLeft} day${daysLeft===1?'':'s'}!`;
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 6000);
    }
  }
}

function page() {
  const p = location.pathname;
  if (p.includes('login')) return 'login';
  if (p.includes('main'))  return 'main';
  return 'index';
}

window.addEventListener('scroll', () => {
  const n = document.getElementById('navbar');
  if (n) n.classList.toggle('scrolled', scrollY > 20);
});

function toggleDD(id, event) {
  if (event) event.stopPropagation();
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
    el.style.transition = `opacity 0.5s ${i*0.06}s ease, transform 0.5s ${i*0.06}s ease`;
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

let curStep  = 0;
let loginSess = {};

function goToStep(n) {
  document.querySelectorAll('.login-step').forEach(s => s.classList.remove('active'));
  const el = document.getElementById('step' + n);
  if (el) el.classList.add('active');
  for (let i = 0; i < 4; i++) {
    const d = document.getElementById('dot' + i);
    if (!d) continue;
    d.classList.remove('active','done');
    if (i < n)  d.classList.add('done');
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
  loginSess.clientCode = val;
  goToStep(1);
}

async function verifyLogin() {
  const email    = (document.getElementById('username')?.value || '').trim();
  const password = document.getElementById('password')?.value || '';

  if (!email || !password) {
    showErr(1, 'Please enter your email and password.');
    return;
  }

  const btn = document.querySelector('#step1 .btn-step');
  if (btn) { btn.textContent = 'Signing in...'; btn.disabled = true; }

  try {
    const res  = await fetch(`${API_BASE}/auth/login.php`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email, password })
    });

    const json = await res.json();

    if (json.success) {
      const data = json.data;

      loginSess = {
        token:       data.token,
        username:    data.fullName,
        email:       data.email,
        role:        data.role,
        clientCode:  data.clientCode  || loginSess.clientCode || '',
        companyName: data.companyName || '',
        expiry:      data.expiry,
        subExpiry:   data.subExpiry   || null
      };

      if (data.role === 'Owner') {
        sessionStorage.setItem('impexio', JSON.stringify(loginSess));
        localStorage.setItem('impexio_admin', JSON.stringify({ ...loginSess, fullName: data.fullName }));
        window.location.href = 'admin/admin-dashboard.html';
        return;
      }

      buildCompanies(data.companyName);
      goToStep(2);

    } else {
      showErr(1, json.message || 'Invalid credentials.');
      shake(document.getElementById('password'));
      if (document.getElementById('password')) document.getElementById('password').value = '';
    }

  } catch(err) {
    showErr(1, 'Cannot connect to server. Please try again.');
  } finally {
    if (btn) { btn.textContent = 'Login →'; btn.disabled = false; }
  }
}

function buildCompanies(companyName) {
  const list = document.getElementById('compList');
  if (!list) return;

  const companies = [{
    id:      'C001',
    name:    companyName || loginSess.companyName || 'My Company',
    address: '',
    gst:     ''
  }];

  list.innerHTML = '';
  companies.forEach((c, i) => {
    const card = document.createElement('div');
    card.className = 'sel-card' + (i === 0 ? ' chosen' : '');
    card.dataset.id   = c.id;
    card.dataset.name = c.name;
    card.innerHTML = `
      <div class="sel-head">
        <div class="sel-name">🏢 ${c.name}</div>
        <div class="sel-check">✓</div>
      </div>
      <div class="sel-tags">
        <span class="sel-tag">Client: ${loginSess.clientCode}</span>
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
  loginSess.company = {
    id:   sel.dataset.id,
    name: sel.dataset.name || loginSess.companyName
  };
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
  const year = YEARS.find(y => y.id === sel.dataset.id);
  loginSess.year = year;

  sessionStorage.setItem('impexio', JSON.stringify(loginSess));
  localStorage.setItem('impexio_admin', JSON.stringify({ ...loginSess, fullName: loginSess.username }));

  const shell = document.querySelector('.login-shell');
  if (shell) {
    shell.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
    shell.style.opacity    = '0';
    shell.style.transform  = 'scale(0.98)';
    setTimeout(() => { window.location.href = 'main.html'; }, 400);
  } else {
    window.location.href = 'main.html';
  }
}

function goBack(from) { goToStep(from - 1); }

document.addEventListener('keydown', e => {
  if (e.key !== 'Enter') return;
  if (curStep === 0) verifyClient();
  else if (curStep === 1) verifyLogin();
  else if (curStep === 2) pickCompany();
  else if (curStep === 3) pickYear();
});

function initDash() {
  loadSess();
  if (!sess) return;
  checkSubscription();
  const c = sess.company;
  const y = sess.year;
  set('ds-client',  sess.clientCode  || '—');
  set('ds-company', c ? c.name : sess.companyName || '—');
  set('ds-year',    y ? `FY ${y.label}` : '—');
  set('ds-user',    sess.username || '—');
  set('ds-role',    sess.role     || '—');
  set('dtbUname', sess.username || 'User');
  set('dtbRole',  sess.role     || 'Customer');
  const av = document.getElementById('dtbAv');
  if (av && sess.username) av.textContent = sess.username[0].toUpperCase();
  const meta = document.getElementById('dtbMeta');
  if (meta) {
    meta.innerHTML = `
      <div class="dtb-chip">🏷️ <strong>${sess.clientCode || '—'}</strong></div>
      <div class="dtb-chip">🏢 <strong>${c ? c.name.split(' ').slice(0,3).join(' ') : sess.companyName || '—'}</strong></div>
      <div class="dtb-chip">📅 <strong>${y ? 'FY '+y.label : '—'}</strong></div>`;
  }
  document.querySelectorAll('.m-tile').forEach((el, i) => {
    el.style.opacity   = '0';
    el.style.transform = 'translateY(18px)';
    el.style.transition = `opacity 0.4s ${i*0.04}s ease, transform 0.4s ${i*0.04}s ease`;
    requestAnimationFrame(() => {
      el.style.opacity   = '1';
      el.style.transform = 'translateY(0)';
    });
  });
}

function populateTopbar() {
  loadSess();
  if (!sess) return;
  checkSubscription();
  const c = sess.company;
  const y = sess.year;
  set('dtbUname', sess.username || 'User');
  set('dtbRole',  sess.role     || 'Customer');
  const av = document.getElementById('dtbAv');
  if (av && sess.username) av.textContent = sess.username[0].toUpperCase();
  const meta = document.getElementById('dtbMeta');
  if (meta) {
    meta.innerHTML = `
      <div class="dtb-chip">🏷️ <strong>${sess.clientCode || '—'}</strong></div>
      <div class="dtb-chip">🏢 <strong>${c ? c.name.split(' ').slice(0,3).join(' ') : sess.companyName || '—'}</strong></div>
      <div class="dtb-chip">📅 <strong>${y ? 'FY '+y.label : '—'}</strong></div>`;
  }
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
  if (icon) icon.textContent = '';
  if (msg)  msg.textContent  = `Opening: ${name}`;
  toast.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toast.classList.remove('show'), 3000);
}

function doLogout() {
  if (confirm('Logout from IMPEXIO?')) {
    sessionStorage.removeItem('impexio');
    localStorage.removeItem('impexio_admin');
    window.location.href = 'login.html';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const p = page();
  if (p === 'index') {
    setTimeout(animateCounters, 900);
    initScrollAnim();
  }
  if (p === 'login') {
    try {
      const raw = sessionStorage.getItem('impexio');
      if (raw) {
        const s = JSON.parse(raw);
        if (s?.token && s?.year && s?.expiry && new Date(s.expiry) > new Date()) {
          if (s.role === 'Owner') {
            window.location.href = 'admin/admin-dashboard.html'; return;
          } else {
            window.location.href = 'main.html'; return;
          }
        }
      }
    } catch(e) {}
    goToStep(0);
  }
  if (p === 'main') {
    initDash();
  }
});
