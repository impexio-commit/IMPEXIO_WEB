/* ============================================================
   fob.js — Container Expenses FOB — Step Wizard
   IMPEXIO v2
   ============================================================ */

const EXPENSE_ITEMS = [
  { key: 'docs_stuffing',     label: 'Docs Stuffing',              group: true },
  { key: 'thc_docs',          label: 'THC & Docs' },
  { key: 'bl',                label: 'B/L' },
  { key: 'shipping_bill',     label: 'Shipping Bill' },
  { key: 'edi',               label: 'EDI' },
  { key: 'agency',            label: 'Agency' },
  { key: 'on_wheel',          label: 'On Wheel' },
  { key: 'customs_expense',   label: 'Customs Expense' },
  { key: 'cert_of_origin',    label: 'Certificate of Origine ( If )' },
  { key: 'transport_hazara',  label: 'Transportation For Hazara' },
  { key: 'insurance',         label: 'Insurance at Actual' },
  { key: 'first_time_export', label: 'First Time Export Reg.' },
  { key: 'fumigation',        label: 'Fumigation Charges' },
  { key: 'seal_charges',      label: 'Seal Charges' },
  { key: 'weighment',         label: 'Weighment Charges' },
  { key: 'miscellaneous',     label: 'Miscellaneous' },
];

const COLS = ['20', '40', '40hq', 'lcl'];

let fobRecords = JSON.parse(localStorage.getItem('fob_records') || '[]');
let editingId  = null;
let currentStep = 1;

// ── Init ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadSess();
  populateTopbar();
  setTodayDate();
  autoSetFobNo();
  buildChargesTable();
  renderRecords();
  goToStep(1);
});

function setTodayDate() {
  const el = document.getElementById('f_fobdate');
  if (el && !el.value) el.value = new Date().toISOString().split('T')[0];
}

function autoSetFobNo() {
  const el = document.getElementById('f_fobno');
  if (el && !el.value) {
    const num = String(fobRecords.length + 1).padStart(4, '0');
    el.value = `FOB/2026/${num}`;
  }
}

function populateTopbar() {
  const s = sess || {};
  setText('dtbUname', s.username || 'Admin');
  setText('dtbRole',  s.role     || 'Administrator');
  const av = document.getElementById('dtbAv');
  if (av) av.textContent = (s.username || 'A')[0].toUpperCase();
  const meta = document.getElementById('dtbMeta');
  if (meta && s.company && s.year) {
    meta.innerHTML = `
      <div class="dtb-chip">🏷️ <strong>${s.clientCode || ''}</strong></div>
      <div class="dtb-chip">🏢 <strong>${(s.company.name||'').split(' ').slice(0,3).join(' ')}</strong></div>
      <div class="dtb-chip">📅 <strong>FY ${s.year?.label || ''}</strong></div>`;
  }
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function doLogout() {
  if (confirm('Logout from IMPEXIO?')) {
    sessionStorage.removeItem('impexio');
    window.location.href = 'index.html';
  }
}

function gv(id) { return document.getElementById(id)?.value || ''; }

// ── Step Navigation ───────────────────────────────────────────
function goToStep(n) {
  // Validate before going forward
  if (n > currentStep && n === 2) {
    if (!gv('f_company').trim()) { showToast('⚠️', 'Please enter Company Name first.'); return; }
    if (!gv('f_fobno').trim())   { showToast('⚠️', 'Please enter FOB Ref. No. first.'); return; }
    if (!gv('f_fobdate'))        { showToast('⚠️', 'Please select FOB Date first.'); return; }
  }

  currentStep = n;

  // Show/hide steps
  [1, 2, 3].forEach(i => {
    const el = document.getElementById(`step_${i}`);
    if (el) { el.classList.toggle('hidden', i !== n); }
  });

  // Update progress indicators
  [1, 2, 3].forEach(i => {
    const dot = document.getElementById(`pstep_${i}`);
    if (!dot) return;
    dot.classList.remove('active', 'done');
    if (i === n)  dot.classList.add('active');
    if (i < n)    dot.classList.add('done');
  });

  // Update connectors
  document.querySelectorAll('.fpb-connector').forEach((c, idx) => {
    c.classList.toggle('done', idx + 1 < n);
  });

  // Update subtitle
  const subs = { 1: 'Step 1 of 3 — Document Info', 2: 'Step 2 of 3 — Charges Entry', 3: 'Step 3 of 3 — Remarks & Summary' };
  setText('formSub', subs[n] || '');

  // Sync info strips
  updateInfoStrips();

  // Update summary on step 3
  if (n === 3) updateSummaryCard();
}

function nextStep(from) { goToStep(from + 1); }
function prevStep(from) { goToStep(from - 1); }

function updateInfoStrips() {
  const company = gv('f_company') || '—';
  const fobno   = gv('f_fobno')   || '—';
  const date    = gv('f_fobdate') ? fmtDate(gv('f_fobdate')) : '—';

  [[2,'strip2'],[3,'strip3']].forEach(([step, prefix]) => {
    setText(`${prefix}_company`, company);
    setText(`${prefix}_fobno`,   fobno);
    setText(`${prefix}_date`,    date);
  });
}

// ── Build Charges Table ───────────────────────────────────────
function buildChargesTable() {
  const tbody = document.getElementById('chargesBody');
  tbody.innerHTML = '';
  EXPENSE_ITEMS.forEach(item => {
    const tr = document.createElement('tr');
    if (item.group) {
      tr.className = 'fob-group-row';
      tr.innerHTML = `<td class="fob-group-label" colspan="5">${item.label}</td>`;
    } else {
      tr.id = `row_${item.key}`;
      tr.innerHTML = `
        <td>${item.label}</td>
        <td><input type="number" class="fob-ci" id="e_${item.key}_20"   placeholder="0" min="0" oninput="calcTotals()"/></td>
        <td><input type="number" class="fob-ci" id="e_${item.key}_40"   placeholder="0" min="0" oninput="calcTotals()"/></td>
        <td><input type="number" class="fob-ci" id="e_${item.key}_40hq" placeholder="0" min="0" oninput="calcTotals()"/></td>
        <td><input type="number" class="fob-ci" id="e_${item.key}_lcl"  placeholder="0" min="0" oninput="calcTotals()"/></td>`;
    }
    tbody.appendChild(tr);
  });
}

// ── Calculate ─────────────────────────────────────────────────
function calcTotals() {
  const totals = { '20': 0, '40': 0, '40hq': 0, 'lcl': 0 };
  EXPENSE_ITEMS.filter(i => !i.group).forEach(item => {
    COLS.forEach(col => {
      totals[col] += parseFloat(document.getElementById(`e_${item.key}_${col}`)?.value) || 0;
    });
  });
  COLS.forEach(col => setText(`tot_${col}`, fmtNum(totals[col])));
  calcPerCbm(totals);
  if (currentStep === 3) updateSummaryCard();
  return totals;
}

function calcPerCbm(totals = null) {
  if (!totals) totals = calcTotals();
  COLS.forEach(col => {
    const cbm = parseFloat(gv(`cbm_${col}`)) || 0;
    const pc  = cbm > 0 ? (totals[col] / cbm) : 0;
    setText(`pc_${col}`, fmtNum(pc));
  });
}

function updateSummaryCard() {
  const totals = {};
  COLS.forEach(col => {
    totals[col] = 0;
    EXPENSE_ITEMS.filter(i => !i.group).forEach(item => {
      totals[col] += parseFloat(document.getElementById(`e_${item.key}_${col}`)?.value) || 0;
    });
  });
  setText('sum_20',    `₹ ${fmtNum(totals['20'])}`);
  setText('sum_40',    `₹ ${fmtNum(totals['40'])}`);
  setText('sum_40hq',  `₹ ${fmtNum(totals['40hq'])}`);
  setText('sum_lcl',   `₹ ${fmtNum(totals['lcl'])}`);

  const cbm20  = parseFloat(gv('cbm_20'))   || 0;
  const cbm40  = parseFloat(gv('cbm_40'))   || 0;
  const pc20   = cbm20 > 0 ? totals['20'] / cbm20 : 0;
  const pc40   = cbm40 > 0 ? totals['40'] / cbm40 : 0;
  setText('sum_pc20', `₹ ${fmtNum(pc20)}`);
  setText('sum_pc40', `₹ ${fmtNum(pc40)}`);
}

function fmtNum(n) {
  if (!n || n === 0) return '0';
  return Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

// ── New / Clear ───────────────────────────────────────────────
function newEntry() {
  clearForm();
  editingId = null;
  setText('formTitle', 'New FOB Entry');
  goToStep(1);
  document.querySelectorAll('.fl-card').forEach(c => c.classList.remove('active'));
}

function clearForm() {
  ['f_company','f_pol','f_fobno','f_fobdate','f_remarks','f_preparedby','f_signatory',
   'cbm_20','cbm_40','cbm_40hq','cbm_lcl'
  ].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });

  EXPENSE_ITEMS.filter(i => !i.group).forEach(item => {
    COLS.forEach(col => {
      const el = document.getElementById(`e_${item.key}_${col}`);
      if (el) el.value = '';
    });
  });
  setTodayDate();
  calcTotals();
  autoSetFobNo();
}

// ── Save ──────────────────────────────────────────────────────
function saveRecord() {
  const company = gv('f_company').trim();
  const fobno   = gv('f_fobno').trim();
  const fobdate = gv('f_fobdate');
  if (!company) { showToast('⚠️', 'Please enter Company Name.'); goToStep(1); return; }
  if (!fobno)   { showToast('⚠️', 'Please enter FOB Ref. No.'); goToStep(1); return; }
  if (!fobdate) { showToast('⚠️', 'Please select FOB Date.');   goToStep(1); return; }

  const totals = {};
  COLS.forEach(col => {
    totals[col] = 0;
    EXPENSE_ITEMS.filter(i => !i.group).forEach(item => {
      totals[col] += parseFloat(gv(`e_${item.key}_${col}`)) || 0;
    });
  });

  const charges = {};
  EXPENSE_ITEMS.filter(i => !i.group).forEach(item => {
    charges[item.key] = {};
    COLS.forEach(col => { charges[item.key][col] = parseFloat(gv(`e_${item.key}_${col}`)) || 0; });
  });

  const cbms = {};
  COLS.forEach(col => { cbms[col] = parseFloat(gv(`cbm_${col}`)) || 0; });

  const rec = {
    id: editingId ?? Date.now(),
    company, pol: gv('f_pol'), fobno, fobdate,
    remarks: gv('f_remarks'), preparedby: gv('f_preparedby'), signatory: gv('f_signatory'),
    charges, cbms, totals,
  };

  if (editingId !== null) {
    const idx = fobRecords.findIndex(r => r.id === editingId);
    if (idx > -1) fobRecords[idx] = rec; else fobRecords.unshift(rec);
  } else {
    fobRecords.unshift(rec);
  }

  localStorage.setItem('fob_records', JSON.stringify(fobRecords));
  renderRecords();
  showToast('✅', `Record ${fobno} saved!`);
  editingId = rec.id;
  setText('formTitle', `Editing: ${fobno}`);
}

// ── Edit ──────────────────────────────────────────────────────
function editRecord(id) {
  const rec = fobRecords.find(r => r.id === id);
  if (!rec) return;
  editingId = id;
  setText('formTitle', `Editing: ${rec.fobno}`);

  const sv = (elId, v) => { const el = document.getElementById(elId); if (el) el.value = v || ''; };
  sv('f_company', rec.company); sv('f_pol', rec.pol);
  sv('f_fobno',   rec.fobno);   sv('f_fobdate', rec.fobdate);
  sv('f_remarks', rec.remarks); sv('f_preparedby', rec.preparedby);
  sv('f_signatory', rec.signatory);

  COLS.forEach(col => sv(`cbm_${col}`, rec.cbms?.[col]));
  EXPENSE_ITEMS.filter(i => !i.group).forEach(item => {
    COLS.forEach(col => sv(`e_${item.key}_${col}`, rec.charges?.[item.key]?.[col] || ''));
  });

  calcTotals();
  document.querySelectorAll('.fl-card').forEach(c => c.classList.remove('active'));
  document.getElementById(`fcard_${id}`)?.classList.add('active');
  goToStep(1);
}

// ── Delete ────────────────────────────────────────────────────
function deleteRecord(id) {
  if (!confirm('Delete this FOB record?')) return;
  fobRecords = fobRecords.filter(r => r.id !== id);
  localStorage.setItem('fob_records', JSON.stringify(fobRecords));
  if (editingId === id) newEntry();
  renderRecords();
  showToast('🗑', 'Record deleted.');
}

// ── Render List ───────────────────────────────────────────────
function renderRecords(data = null) {
  const list  = document.getElementById('recordsList');
  const items = data || fobRecords;
  if (items.length === 0) {
    list.innerHTML = `
      <div class="fl-empty">
        <div style="font-size:1.6rem;opacity:0.35;">🚢</div>
        <div class="fl-empty-txt">No records yet</div>
        <div class="fl-empty-sub">Click + New to begin</div>
      </div>`;
    return;
  }
  list.innerHTML = items.map(rec => `
    <div class="fl-card ${editingId === rec.id ? 'active' : ''}" id="fcard_${rec.id}" onclick="editRecord(${rec.id})">
      <div class="fl-card-no">${rec.fobno}</div>
      <div class="fl-card-co">${rec.company}</div>
      <div class="fl-card-row">
        <span class="fl-card-date">${fmtDate(rec.fobdate)}</span>
        <span class="fl-card-val">₹${fmtNum(rec.totals?.['20'] || 0)}</span>
      </div>
      <div class="fl-card-acts">
        <button class="fl-act edit" onclick="event.stopPropagation();editRecord(${rec.id})">✏️ Edit</button>
        <button class="fl-act prnt" onclick="event.stopPropagation();printById(${rec.id})">🖨 Print</button>
        <button class="fl-act del"  onclick="event.stopPropagation();deleteRecord(${rec.id})">🗑</button>
      </div>
    </div>`).join('');
}

function filterRecords() {
  const q = document.getElementById('searchInput')?.value.toLowerCase() || '';
  if (!q) { renderRecords(); return; }
  renderRecords(fobRecords.filter(r =>
    r.fobno?.toLowerCase().includes(q) ||
    r.company?.toLowerCase().includes(q) ||
    r.pol?.toLowerCase().includes(q)
  ));
}

function fmtDate(str) {
  if (!str) return '—';
  return new Date(str).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
}

// ── Print ─────────────────────────────────────────────────────
function printRecord() {
  const cols = COLS;
  const totals = {};
  cols.forEach(col => {
    totals[col] = 0;
    EXPENSE_ITEMS.filter(i => !i.group).forEach(item => {
      totals[col] += parseFloat(gv(`e_${item.key}_${col}`)) || 0;
    });
  });
  const cbms = {};
  cols.forEach(col => { cbms[col] = parseFloat(gv(`cbm_${col}`)) || 0; });
  const charges = {};
  EXPENSE_ITEMS.filter(i => !i.group).forEach(item => {
    charges[item.key] = {};
    cols.forEach(col => { charges[item.key][col] = parseFloat(gv(`e_${item.key}_${col}`)) || 0; });
  });
  doPrint({
    company: gv('f_company'), pol: gv('f_pol'),
    fobno: gv('f_fobno'), fobdate: gv('f_fobdate'),
    remarks: gv('f_remarks'), preparedby: gv('f_preparedby'), signatory: gv('f_signatory'),
    charges, cbms, totals
  });
}

function printById(id) {
  const rec = fobRecords.find(r => r.id === id);
  if (rec) doPrint(rec);
}

function doPrint(rec) {
  const client = sess?.clientCode || 'Demo001';
  const user   = sess?.username   || 'Admin';
  const colLabels = ["20' Container","40' Container","40' HQ Container","LCL / Per CBM"];

  const itemRows = EXPENSE_ITEMS.map(item => {
    if (item.group) {
      return `<tr class="grp-row"><td class="desc-td" colspan="5" style="background:#e8f0fb;color:#0f2540;font-weight:700;font-size:7.5pt;text-transform:uppercase;letter-spacing:0.08em;">${item.label}</td></tr>`;
    }
    const cells = COLS.map(col => {
      const v = rec.charges?.[item.key]?.[col] || 0;
      return `<td>${v > 0 ? fmtNum(v) : ''}</td>`;
    }).join('');
    return `<tr><td class="desc-td">${item.label}</td>${cells}</tr>`;
  }).join('');

  const totCells = COLS.map(col => `<td>${fmtNum(rec.totals?.[col] || 0)}</td>`).join('');
  const cbmCells = COLS.map(col => `<td>${rec.cbms?.[col] ? fmtNum(rec.cbms[col]) : '—'}</td>`).join('');
  const pcCells  = COLS.map(col => {
    const cbm = rec.cbms?.[col] || 0;
    const tot = rec.totals?.[col] || 0;
    return `<td>${fmtNum(cbm > 0 ? tot / cbm : 0)}</td>`;
  }).join('');

  document.getElementById('printArea').innerHTML = `
  <div class="print-doc">
    <div class="print-hdr">
      <div class="print-hdr-title">IMPEXIO &mdash; CONTAINER EXPENSES FOB &nbsp;|&nbsp; PRINTOUT</div>
      <div class="print-hdr-sub">Export Import Document Management System &nbsp;|&nbsp; Client: ${client}</div>
    </div>
    <div class="print-meta">
      <div class="print-meta-item"><span class="print-meta-lbl">Company:&nbsp;</span><span class="print-meta-val">${rec.company||''}</span></div>
      <div class="print-meta-item"><span class="print-meta-lbl">FOB Ref. No.:&nbsp;</span><span class="print-meta-val">${rec.fobno||''}</span></div>
      <div class="print-meta-item"><span class="print-meta-lbl">Port of Loading:&nbsp;</span><span class="print-meta-val">${rec.pol||''}</span></div>
      <div class="print-meta-item"><span class="print-meta-lbl">FOB Date:&nbsp;</span><span class="print-meta-val">${fmtDate(rec.fobdate)}</span></div>
    </div>
    <div class="print-sec-hd">Docs Stuffing — Charges INR</div>
    <table class="ptbl">
      <thead>
        <tr>
          <th class="desc-th" rowspan="2">Expense Item</th>
          <th colspan="2">Charges INR</th>
          <th colspan="2">Charges INR</th>
        </tr>
        <tr>${colLabels.map(l=>`<th>${l}</th>`).join('')}</tr>
      </thead>
      <tbody>
        ${itemRows}
        <tr class="tot-row"><td class="desc-td">Total Expenses</td>${totCells}</tr>
        <tr class="cbm-row"><td class="desc-td">CBM</td>${cbmCells}</tr>
        <tr class="pc-row"><td class="desc-td">Per CBM Cost</td>${pcCells}</tr>
      </tbody>
    </table>
    <div class="print-sec-hd">Remarks</div>
    <div class="print-remarks">${rec.remarks||'&nbsp;'}</div>
    <div class="print-sigs">
      <div class="print-sig"><div class="print-sig-line">Prepared By: ${rec.preparedby||'__________________'}</div></div>
      <div class="print-sig"><div class="print-sig-line">Authorised Signatory: ${rec.signatory||'__________________'}</div></div>
    </div>
    <div class="print-footer">IMPEXIO | Export-Import Document Portal | Client: ${client} | Printed: ${new Date().toLocaleString('en-IN')}</div>
  </div>`;
  window.print();
}

// ── Toast ─────────────────────────────────────────────────────
function showToast(icon, msg) {
  let t = document.getElementById('fob-toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'fob-toast';
    t.style.cssText = `position:fixed;bottom:1.5rem;right:1.5rem;background:var(--navy);color:#fff;padding:0.7rem 1.2rem;border-radius:10px;font-size:0.82rem;font-weight:600;display:flex;gap:0.5rem;align-items:center;box-shadow:0 8px 24px rgba(15,37,64,0.3);z-index:9999;opacity:0;transition:opacity 0.3s;pointer-events:none;border-left:3px solid var(--gold);`;
    document.body.appendChild(t);
  }
  t.innerHTML = `<span>${icon}</span><span>${msg}</span>`;
  t.style.opacity = '1';
  clearTimeout(t._t);
  t._t = setTimeout(() => { t.style.opacity = '0'; }, 3000);
}
