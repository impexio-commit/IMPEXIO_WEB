/* ============================================================
   cbm.js — CBM Calculation Logic
   IMPEXIO v2
   ============================================================ */

// ── State ─────────────────────────────────────────────────────
let cbmRecords = JSON.parse(localStorage.getItem('cbm_records') || '[]');
let editingId  = null;
let cbmRowCount = 0;
let cftRowCount = 0;

// ── Init ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Load session for topbar
  loadSess();
  populateTopbar();

  // Set today's date as default
  const dateEl = document.getElementById('f_cbmdate');
  if (dateEl) dateEl.value = today();

  // Set auto CBM No
  autoSetCbmNo();

  // Add default rows
  addCbmRow();
  addCftRow();

  // Render existing records
  renderRecords();
});

function today() {
  return new Date().toISOString().split('T')[0];
}

function autoSetCbmNo() {
  const el = document.getElementById('f_cbmno');
  if (el && !el.value) {
    const num = (cbmRecords.length + 1).toString().padStart(4, '0');
    el.value = `CBM/2026/${num}`;
  }
}

function populateTopbar() {
  const s = sess;
  if (!s.username) return;
  setEl('dtbUname', s.username);
  setEl('dtbRole',  s.role || 'Administrator');
  const av = document.getElementById('dtbAv');
  if (av) av.textContent = (s.username || 'A')[0].toUpperCase();

  const meta = document.getElementById('dtbMeta');
  if (meta && s.company && s.year) {
    meta.innerHTML = `
      <div class="dtb-chip">🏷️ <strong>${s.clientCode}</strong></div>
      <div class="dtb-chip">🏢 <strong>${s.company.name.split(' ').slice(0,3).join(' ')}</strong></div>
      <div class="dtb-chip">📅 <strong>FY ${s.year.label}</strong></div>`;
  }
}

function setEl(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function doLogout() {
  if (confirm('Logout from IMPEXIO?')) {
    sessionStorage.removeItem('impexio');
    window.location.href = 'index.html';
  }
}

// ── Modal ─────────────────────────────────────────────────────
function openModal(id = null) {
  editingId = id;
  const overlay = document.getElementById('modalOverlay');

  if (id !== null) {
    const rec = cbmRecords.find(r => r.id === id);
    if (rec) loadFormData(rec);
  } else {
    clearForm(false);
    autoSetCbmNo();
  }

  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

function closeModalOutside(e) {
  if (e.target.id === 'modalOverlay') closeModal();
}

// ── Form Clear ────────────────────────────────────────────────
function clearForm(resetId = true) {
  const ids = ['f_company','f_branch','f_location','f_daybook','f_cbmno',
                'f_cbmdate','f_listno','f_exporter','f_remarks',
                'f_preparedby','f_signatory',
                'c20_cbm','c20_mt','c20_qty',
                'c40gp_cbm','c40gp_mt','c40gp_qty',
                'c40hq_cbm','c40hq_mt','c40hq_qty',
                'lcl_cbm','lcl_mt','lcl_qty'];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });

  document.getElementById('f_cbmdate').value = today();
  calcContainerTotal();

  // Reset calc rows
  document.getElementById('cbmRows').innerHTML = '';
  document.getElementById('cftRows').innerHTML = '';
  cbmRowCount = 0;
  cftRowCount = 0;
  addCbmRow();
  addCftRow();

  calcAllTotals();

  if (resetId) {
    editingId = null;
    autoSetCbmNo();
  }
}

// ── Container Totals ──────────────────────────────────────────
function calcContainerTotal() {
  const rows = [
    { cbm: 'c20_cbm',   mt: 'c20_mt',   qty: 'c20_qty'   },
    { cbm: 'c40gp_cbm', mt: 'c40gp_mt', qty: 'c40gp_qty' },
    { cbm: 'c40hq_cbm', mt: 'c40hq_mt', qty: 'c40hq_qty' },
    { cbm: 'lcl_cbm',   mt: 'lcl_mt',   qty: 'lcl_qty'   }
  ];

  let tCbm = 0, tMt = 0, tQty = 0;
  rows.forEach(r => {
    tCbm += parseFloat(val(r.cbm)) || 0;
    tMt  += parseFloat(val(r.mt))  || 0;
    tQty += parseInt(val(r.qty))   || 0;
  });

  setEl('tot_cbm', tCbm.toFixed(3));
  setEl('tot_mt',  tMt.toFixed(3));
  setEl('tot_qty', tQty.toString());
}

function val(id) {
  return document.getElementById(id)?.value || '';
}

// ── CBM Rows ──────────────────────────────────────────────────
function addCbmRow() {
  const n = ++cbmRowCount;
  const tbody = document.getElementById('cbmRows');
  const tr = document.createElement('tr');
  tr.id = `cbmRow_${n}`;
  tr.innerHTML = `
    <td><input type="text" class="cbm-cell-input" style="text-align:left;min-width:120px;" id="cbm_desc_${n}" placeholder="Item / Product"/></td>
    <td><input type="number" class="cbm-cell-input" id="cbm_l_${n}" placeholder="0.00" step="0.01" oninput="calcCbmRow(${n})"/></td>
    <td><input type="number" class="cbm-cell-input" id="cbm_w_${n}" placeholder="0.00" step="0.01" oninput="calcCbmRow(${n})"/></td>
    <td><input type="number" class="cbm-cell-input" id="cbm_h_${n}" placeholder="0.00" step="0.01" oninput="calcCbmRow(${n})"/></td>
    <td><input type="number" class="cbm-cell-input" id="cbm_boxes_${n}" placeholder="1" min="1" oninput="calcCbmRow(${n})"/></td>
    <td>
      <div style="display:flex;align-items:center;gap:0.4rem;">
        <span class="cbm-cell-input" id="cbm_res_${n}" style="background:var(--ivory2);border:none;display:block;min-width:90px;font-family:var(--font-mono);font-size:0.82rem;padding:0.42rem 0.6rem;border-radius:6px;text-align:right;color:var(--navy);">0.000</span>
        <button class="cbm-row-del" onclick="delCbmRow(${n})" title="Delete row">✕</button>
      </div>
    </td>`;
  tbody.appendChild(tr);
}

function delCbmRow(n) {
  const row = document.getElementById(`cbmRow_${n}`);
  if (row) row.remove();
  calcCbmTotals();
}

function calcCbmRow(n) {
  const l = parseFloat(document.getElementById(`cbm_l_${n}`)?.value) || 0;
  const w = parseFloat(document.getElementById(`cbm_w_${n}`)?.value) || 0;
  const h = parseFloat(document.getElementById(`cbm_h_${n}`)?.value) || 0;
  const b = parseInt(document.getElementById(`cbm_boxes_${n}`)?.value) || 1;
  const res = (l * w * h * b) / 1000000;
  const resEl = document.getElementById(`cbm_res_${n}`);
  if (resEl) resEl.textContent = res.toFixed(6).replace(/\.?0+$/, '') || '0.000';
  calcCbmTotals();
}

function calcCbmTotals() {
  let total = 0, boxes = 0;
  const rows = document.getElementById('cbmRows').querySelectorAll('tr');
  rows.forEach(tr => {
    const id = tr.id.replace('cbmRow_','');
    const l = parseFloat(document.getElementById(`cbm_l_${id}`)?.value) || 0;
    const w = parseFloat(document.getElementById(`cbm_w_${id}`)?.value) || 0;
    const h = parseFloat(document.getElementById(`cbm_h_${id}`)?.value) || 0;
    const b = parseInt(document.getElementById(`cbm_boxes_${id}`)?.value) || 0;
    total += (l * w * h * b) / 1000000;
    boxes += b;
  });
  setEl('cbm_total_result', total.toFixed(6).replace(/\.?0+$/, '') + ' CBM' || '0.000 CBM');
  setEl('cbm_total_boxes', boxes.toString());
  updateSummary();
}

// ── CFT Rows ──────────────────────────────────────────────────
function addCftRow() {
  const n = ++cftRowCount;
  const tbody = document.getElementById('cftRows');
  const tr = document.createElement('tr');
  tr.id = `cftRow_${n}`;
  tr.innerHTML = `
    <td><input type="text" class="cbm-cell-input" style="text-align:left;min-width:120px;" id="cft_desc_${n}" placeholder="Item / Product"/></td>
    <td><input type="number" class="cbm-cell-input" id="cft_l_${n}" placeholder="0.00" step="0.01" oninput="calcCftRow(${n})"/></td>
    <td><input type="number" class="cbm-cell-input" id="cft_w_${n}" placeholder="0.00" step="0.01" oninput="calcCftRow(${n})"/></td>
    <td><input type="number" class="cbm-cell-input" id="cft_h_${n}" placeholder="0.00" step="0.01" oninput="calcCftRow(${n})"/></td>
    <td><input type="number" class="cbm-cell-input" id="cft_boxes_${n}" placeholder="1" min="1" oninput="calcCftRow(${n})"/></td>
    <td>
      <div style="display:flex;align-items:center;gap:0.4rem;">
        <span class="cbm-cell-input" id="cft_res_${n}" style="background:var(--ivory2);border:none;display:block;min-width:90px;font-family:var(--font-mono);font-size:0.82rem;padding:0.42rem 0.6rem;border-radius:6px;text-align:right;color:var(--navy);">0.000</span>
        <button class="cbm-row-del" onclick="delCftRow(${n})" title="Delete row">✕</button>
      </div>
    </td>`;
  tbody.appendChild(tr);
}

function delCftRow(n) {
  const row = document.getElementById(`cftRow_${n}`);
  if (row) row.remove();
  calcCftTotals();
}

function calcCftRow(n) {
  const l = parseFloat(document.getElementById(`cft_l_${n}`)?.value) || 0;
  const w = parseFloat(document.getElementById(`cft_w_${n}`)?.value) || 0;
  const h = parseFloat(document.getElementById(`cft_h_${n}`)?.value) || 0;
  const b = parseInt(document.getElementById(`cft_boxes_${n}`)?.value) || 1;
  const res = (l * w * h * b) / 1728;
  const resEl = document.getElementById(`cft_res_${n}`);
  if (resEl) resEl.textContent = res.toFixed(4).replace(/\.?0+$/, '') || '0.000';
  calcCftTotals();
}

function calcCftTotals() {
  let total = 0, boxes = 0;
  const rows = document.getElementById('cftRows').querySelectorAll('tr');
  rows.forEach(tr => {
    const id = tr.id.replace('cftRow_','');
    const l = parseFloat(document.getElementById(`cft_l_${id}`)?.value) || 0;
    const w = parseFloat(document.getElementById(`cft_w_${id}`)?.value) || 0;
    const h = parseFloat(document.getElementById(`cft_h_${id}`)?.value) || 0;
    const b = parseInt(document.getElementById(`cft_boxes_${id}`)?.value) || 0;
    total += (l * w * h * b) / 1728;
    boxes += b;
  });
  setEl('cft_total_result', total.toFixed(4).replace(/\.?0+$/, '') + ' CFT' || '0.000 CFT');
  setEl('cft_total_boxes', boxes.toString());
  updateSummary();
}

function calcAllTotals() { calcCbmTotals(); calcCftTotals(); calcContainerTotal(); }

// ── Summary ───────────────────────────────────────────────────
function updateSummary() {
  const cbmText = document.getElementById('cbm_total_result')?.textContent || '0';
  const cftText = document.getElementById('cft_total_result')?.textContent || '0';
  const cbmVal  = parseFloat(cbmText) || 0;
  const cftVal  = parseFloat(cftText) || 0;
  const cbmBoxes = document.getElementById('cbm_total_boxes')?.textContent || '0';
  const cftBoxes = document.getElementById('cft_total_boxes')?.textContent || '0';

  setEl('sum_cbm',      cbmVal.toFixed(6) + ' CBM');
  setEl('sum_cft',      cftVal.toFixed(4) + ' CFT');
  setEl('sum_cbm2cft',  (cbmVal * 35.3147).toFixed(4) + ' CFT');
  setEl('sum_cft2cbm',  (cftVal * 0.028317).toFixed(6) + ' CBM');
  setEl('sum_boxes_cbm', cbmBoxes);
  setEl('sum_boxes_cft', cftBoxes);
}

// ── Save Record ───────────────────────────────────────────────
function saveRecord() {
  const company = document.getElementById('f_company')?.value.trim();
  const cbmno   = document.getElementById('f_cbmno')?.value.trim();
  const cbmdate = document.getElementById('f_cbmdate')?.value;

  if (!company) { alert('Please enter Company Name.'); document.getElementById('f_company').focus(); return; }
  if (!cbmno)   { alert('Please enter CBM No.'); document.getElementById('f_cbmno').focus(); return; }
  if (!cbmdate) { alert('Please select CBM Date.'); return; }

  const cbmVal = parseFloat(document.getElementById('cbm_total_result')?.textContent) || 0;
  const cftVal = parseFloat(document.getElementById('cft_total_result')?.textContent) || 0;

  // Container counts
  let containers = [];
  if (parseFloat(val('c20_cbm'))   > 0) containers.push("20'");
  if (parseFloat(val('c40gp_cbm')) > 0) containers.push("40'GP");
  if (parseFloat(val('c40hq_cbm')) > 0) containers.push("40'HQ");
  if (parseFloat(val('lcl_cbm'))   > 0) containers.push("LCL");

  const record = {
    id:         editingId ?? Date.now(),
    company:    company,
    branch:     val('f_branch'),
    location:   val('f_location'),
    daybook:    val('f_daybook'),
    cbmno:      cbmno,
    cbmdate:    cbmdate,
    listno:     val('f_listno'),
    exporter:   val('f_exporter'),
    remarks:    val('f_remarks'),
    preparedby: val('f_preparedby'),
    signatory:  val('f_signatory'),
    containers: containers.join(', ') || '—',
    totalCbm:   cbmVal,
    totalCft:   cftVal,
    cbm2cft:    cbmVal * 35.3147,
    cft2cbm:    cftVal * 0.028317,
    cbmBoxes:   document.getElementById('cbm_total_boxes')?.textContent || '0',
    cftBoxes:   document.getElementById('cft_total_boxes')?.textContent || '0',
    contDetail: {
      c20:   { cbm: val('c20_cbm'),   mt: val('c20_mt'),   qty: val('c20_qty')   },
      c40gp: { cbm: val('c40gp_cbm'), mt: val('c40gp_mt'), qty: val('c40gp_qty') },
      c40hq: { cbm: val('c40hq_cbm'), mt: val('c40hq_mt'), qty: val('c40hq_qty') },
      lcl:   { cbm: val('lcl_cbm'),   mt: val('lcl_mt'),   qty: val('lcl_qty')   },
    },
    cbmRows: getCbmRows(),
    cftRows: getCftRows()
  };

  if (editingId !== null) {
    const idx = cbmRecords.findIndex(r => r.id === editingId);
    if (idx > -1) cbmRecords[idx] = record;
  } else {
    cbmRecords.unshift(record);
  }

  localStorage.setItem('cbm_records', JSON.stringify(cbmRecords));
  renderRecords();
  showToastMsg('✅', `Record ${cbmno} saved successfully!`);
  closeModal();
}

function getCbmRows() {
  const rows = [];
  document.getElementById('cbmRows').querySelectorAll('tr').forEach(tr => {
    const id = tr.id.replace('cbmRow_','');
    rows.push({
      desc:  document.getElementById(`cbm_desc_${id}`)?.value || '',
      l:     document.getElementById(`cbm_l_${id}`)?.value || '',
      w:     document.getElementById(`cbm_w_${id}`)?.value || '',
      h:     document.getElementById(`cbm_h_${id}`)?.value || '',
      boxes: document.getElementById(`cbm_boxes_${id}`)?.value || '',
      res:   document.getElementById(`cbm_res_${id}`)?.textContent || '0.000'
    });
  });
  return rows;
}

function getCftRows() {
  const rows = [];
  document.getElementById('cftRows').querySelectorAll('tr').forEach(tr => {
    const id = tr.id.replace('cftRow_','');
    rows.push({
      desc:  document.getElementById(`cft_desc_${id}`)?.value || '',
      l:     document.getElementById(`cft_l_${id}`)?.value || '',
      w:     document.getElementById(`cft_w_${id}`)?.value || '',
      h:     document.getElementById(`cft_h_${id}`)?.value || '',
      boxes: document.getElementById(`cft_boxes_${id}`)?.value || '',
      res:   document.getElementById(`cft_res_${id}`)?.textContent || '0.000'
    });
  });
  return rows;
}

// ── Load Form Data (edit) ─────────────────────────────────────
function loadFormData(rec) {
  const setVal = (id, v) => { const el = document.getElementById(id); if (el) el.value = v || ''; };
  setVal('f_company',    rec.company);
  setVal('f_branch',     rec.branch);
  setVal('f_location',   rec.location);
  setVal('f_daybook',    rec.daybook);
  setVal('f_cbmno',      rec.cbmno);
  setVal('f_cbmdate',    rec.cbmdate);
  setVal('f_listno',     rec.listno);
  setVal('f_exporter',   rec.exporter);
  setVal('f_remarks',    rec.remarks);
  setVal('f_preparedby', rec.preparedby);
  setVal('f_signatory',  rec.signatory);

  const d = rec.contDetail || {};
  setVal('c20_cbm',   d.c20?.cbm);   setVal('c20_mt',   d.c20?.mt);   setVal('c20_qty',   d.c20?.qty);
  setVal('c40gp_cbm', d.c40gp?.cbm); setVal('c40gp_mt', d.c40gp?.mt); setVal('c40gp_qty', d.c40gp?.qty);
  setVal('c40hq_cbm', d.c40hq?.cbm); setVal('c40hq_mt', d.c40hq?.mt); setVal('c40hq_qty', d.c40hq?.qty);
  setVal('lcl_cbm',   d.lcl?.cbm);   setVal('lcl_mt',   d.lcl?.mt);   setVal('lcl_qty',   d.lcl?.qty);

  calcContainerTotal();

  // Reload CBM rows
  document.getElementById('cbmRows').innerHTML = '';
  cbmRowCount = 0;
  (rec.cbmRows || []).forEach(r => {
    addCbmRow();
    const n = cbmRowCount;
    const setV = (id, v) => { const el = document.getElementById(id); if (el) el.value = v || ''; };
    setV(`cbm_desc_${n}`, r.desc);
    setV(`cbm_l_${n}`, r.l);
    setV(`cbm_w_${n}`, r.w);
    setV(`cbm_h_${n}`, r.h);
    setV(`cbm_boxes_${n}`, r.boxes);
    calcCbmRow(n);
  });
  if (cbmRowCount === 0) addCbmRow();

  // Reload CFT rows
  document.getElementById('cftRows').innerHTML = '';
  cftRowCount = 0;
  (rec.cftRows || []).forEach(r => {
    addCftRow();
    const n = cftRowCount;
    const setV = (id, v) => { const el = document.getElementById(id); if (el) el.value = v || ''; };
    setV(`cft_desc_${n}`, r.desc);
    setV(`cft_l_${n}`, r.l);
    setV(`cft_w_${n}`, r.w);
    setV(`cft_h_${n}`, r.h);
    setV(`cft_boxes_${n}`, r.boxes);
    calcCftRow(n);
  });
  if (cftRowCount === 0) addCftRow();
}

// ── Render Records Table ──────────────────────────────────────
function renderRecords(list = null) {
  const data  = list || cbmRecords;
  const tbody = document.getElementById('recordsTbody');
  const empty = document.getElementById('emptyRow');
  tbody.innerHTML = '';

  if (data.length === 0) {
    tbody.innerHTML = `
      <tr class="cbm-empty-row">
        <td colspan="8">
          <div class="cbm-empty">
            <div class="cbm-empty-icon">📐</div>
            <div class="cbm-empty-text">No CBM records yet</div>
            <div class="cbm-empty-sub">Click "New CBM Entry" to create your first calculation</div>
          </div>
        </td>
      </tr>`;
    return;
  }

  data.forEach(rec => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${rec.cbmno}</strong></td>
      <td>${formatDate(rec.cbmdate)}</td>
      <td>${rec.company}</td>
      <td>${rec.branch || '—'}</td>
      <td><span style="font-family:var(--font-mono);font-weight:700;color:var(--navy);">${rec.totalCbm?.toFixed(4) || '0.0000'}</span></td>
      <td><span style="font-family:var(--font-mono);color:var(--text-mid);">${rec.totalCft?.toFixed(4) || '0.0000'}</span></td>
      <td><span style="font-size:0.78rem;color:var(--text-soft);">${rec.containers || '—'}</span></td>
      <td>
        <div class="cbm-action-btns">
          <button class="cbm-act-btn edit"   onclick="openModal(${rec.id})">✏️ Edit</button>
          <button class="cbm-act-btn print"  onclick="printById(${rec.id})">🖨 Print</button>
          <button class="cbm-act-btn delete" onclick="deleteRecord(${rec.id})">🗑 Delete</button>
        </div>
      </td>`;
    tbody.appendChild(tr);
  });
}

function filterRecords() {
  const q = document.getElementById('searchInput')?.value.toLowerCase() || '';
  if (!q) { renderRecords(); return; }
  const filtered = cbmRecords.filter(r =>
    r.cbmno?.toLowerCase().includes(q) ||
    r.company?.toLowerCase().includes(q) ||
    r.branch?.toLowerCase().includes(q) ||
    r.exporter?.toLowerCase().includes(q)
  );
  renderRecords(filtered);
}

function deleteRecord(id) {
  if (!confirm('Delete this CBM record? This cannot be undone.')) return;
  cbmRecords = cbmRecords.filter(r => r.id !== id);
  localStorage.setItem('cbm_records', JSON.stringify(cbmRecords));
  renderRecords();
  showToastMsg('🗑', 'Record deleted.');
}

function formatDate(str) {
  if (!str) return '—';
  const d = new Date(str);
  return d.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
}

// ── Print ─────────────────────────────────────────────────────
function printRecord() {
  // Build temp record from current form
  const tempRec = {
    company:    val('f_company'),
    branch:     val('f_branch'),
    location:   val('f_location'),
    daybook:    val('f_daybook'),
    cbmno:      val('f_cbmno'),
    cbmdate:    val('f_cbmdate'),
    listno:     val('f_listno'),
    exporter:   val('f_exporter'),
    remarks:    val('f_remarks'),
    preparedby: val('f_preparedby'),
    signatory:  val('f_signatory'),
    totalCbm:   parseFloat(document.getElementById('cbm_total_result')?.textContent) || 0,
    totalCft:   parseFloat(document.getElementById('cft_total_result')?.textContent) || 0,
    cbm2cft:    parseFloat(document.getElementById('sum_cbm2cft')?.textContent) || 0,
    cft2cbm:    parseFloat(document.getElementById('sum_cft2cbm')?.textContent) || 0,
    cbmBoxes:   document.getElementById('cbm_total_boxes')?.textContent || '0',
    cftBoxes:   document.getElementById('cft_total_boxes')?.textContent || '0',
    contDetail: {
      c20:   { cbm: val('c20_cbm'),   mt: val('c20_mt'),   qty: val('c20_qty')   },
      c40gp: { cbm: val('c40gp_cbm'), mt: val('c40gp_mt'), qty: val('c40gp_qty') },
      c40hq: { cbm: val('c40hq_cbm'), mt: val('c40hq_mt'), qty: val('c40hq_qty') },
      lcl:   { cbm: val('lcl_cbm'),   mt: val('lcl_mt'),   qty: val('lcl_qty')   },
    },
    cbmRows: getCbmRows(),
    cftRows: getCftRows()
  };
  doPrint(tempRec);
}

function printById(id) {
  const rec = cbmRecords.find(r => r.id === id);
  if (rec) doPrint(rec);
}

function doPrint(rec) {
  const printArea = document.getElementById('printArea');

  const contRows = [
    { label: "20' Container",   d: rec.contDetail?.c20 },
    { label: "40' GP Container",d: rec.contDetail?.c40gp },
    { label: "40' HQ Container",d: rec.contDetail?.c40hq },
    { label: "LCL Shipment",    d: rec.contDetail?.lcl }
  ];

  const totCbm = contRows.reduce((s,r) => s + (parseFloat(r.d?.cbm) || 0), 0);
  const totMt  = contRows.reduce((s,r) => s + (parseFloat(r.d?.mt)  || 0), 0);
  const totQty = contRows.reduce((s,r) => s + (parseInt(r.d?.qty)   || 0), 0);

  const contRowsHtml = contRows.map(r => `
    <tr>
      <td>${r.label}</td>
      <td style="text-align:right;">${parseFloat(r.d?.cbm || 0).toFixed(3)}</td>
      <td style="text-align:right;">${parseFloat(r.d?.mt  || 0).toFixed(3)}</td>
      <td style="text-align:right;">${parseInt(r.d?.qty   || 0)}</td>
    </tr>`).join('');

  const cbmCalcRows = (rec.cbmRows || []).map(r => `
    <tr>
      <td>${r.desc || '—'}</td>
      <td style="text-align:right;">${r.l || '—'}</td>
      <td style="text-align:right;">${r.w || '—'}</td>
      <td style="text-align:right;">${r.h || '—'}</td>
      <td style="text-align:right;">${r.boxes || '—'}</td>
      <td style="text-align:right;font-weight:700;">${r.res}</td>
    </tr>`).join('');

  const cftCalcRows = (rec.cftRows || []).map(r => `
    <tr>
      <td>${r.desc || '—'}</td>
      <td style="text-align:right;">${r.l || '—'}</td>
      <td style="text-align:right;">${r.w || '—'}</td>
      <td style="text-align:right;">${r.h || '—'}</td>
      <td style="text-align:right;">${r.boxes || '—'}</td>
      <td style="text-align:right;font-weight:700;">${r.res}</td>
    </tr>`).join('');

  const client = sess.clientCode || 'Demo001';
  const user   = sess.username   || 'Admin';

  printArea.innerHTML = `
  <div class="print-doc">

    <div class="print-header">
      <div class="print-header-title">IMPEXIO &mdash; CBM CALCULATION REPORT</div>
      <div class="print-header-sub">Export Import Document Management System &nbsp;|&nbsp; Client: ${client}</div>
    </div>

    <div class="print-meta-grid">
      <div class="print-meta-item"><span class="print-meta-label">Company:&nbsp;</span><span class="print-meta-val">${rec.company || ''}</span></div>
      <div class="print-meta-item"><span class="print-meta-label">Branch:&nbsp;</span><span class="print-meta-val">${rec.branch || ''}</span></div>
      <div class="print-meta-item"><span class="print-meta-label">CBM No:&nbsp;</span><span class="print-meta-val">${rec.cbmno || ''}</span></div>
      <div class="print-meta-item"><span class="print-meta-label">Location:&nbsp;</span><span class="print-meta-val">${rec.location || ''}</span></div>
      <div class="print-meta-item"><span class="print-meta-label">Day Book:&nbsp;</span><span class="print-meta-val">${rec.daybook || ''}</span></div>
      <div class="print-meta-item"><span class="print-meta-label">CBM Date:&nbsp;</span><span class="print-meta-val">${formatDate(rec.cbmdate)}</span></div>
      <div class="print-meta-item"><span class="print-meta-label">Exporter:&nbsp;</span><span class="print-meta-val">${rec.exporter || ''}</span></div>
      <div class="print-meta-item"><span class="print-meta-label">Listing No:&nbsp;</span><span class="print-meta-val">${rec.listno || ''}</span></div>
      <div class="print-meta-item"><span class="print-meta-label">Print User:&nbsp;</span><span class="print-meta-val">${user}</span></div>
    </div>

    <!-- Container Detail -->
    <div class="print-section-head">A. Container Detail Summary</div>
    <table class="print-table">
      <thead><tr><th>Container Type</th><th style="text-align:right;">CBM</th><th style="text-align:right;">MT</th><th style="text-align:right;">Product Qty</th></tr></thead>
      <tbody>
        ${contRowsHtml}
        <tr class="total-row">
          <td>TOTAL</td>
          <td style="text-align:right;">${totCbm.toFixed(3)}</td>
          <td style="text-align:right;">${totMt.toFixed(3)}</td>
          <td style="text-align:right;">${totQty}</td>
        </tr>
      </tbody>
    </table>

    <!-- CBM Calc -->
    <div class="print-section-head">B. CBM Calculation Detail &nbsp; (1 Inch = 2.54 Cm &nbsp;|&nbsp; CBM = L&times;W&times;H &divide; 1,000,000)</div>
    <table class="print-table">
      <thead><tr><th>Description</th><th style="text-align:right;">L (cm)</th><th style="text-align:right;">W (cm)</th><th style="text-align:right;">H (cm)</th><th style="text-align:right;">Boxes</th><th style="text-align:right;">CBM</th></tr></thead>
      <tbody>
        ${cbmCalcRows}
        <tr class="total-row">
          <td colspan="4">Total CBM</td>
          <td style="text-align:right;">${rec.cbmBoxes || 0}</td>
          <td style="text-align:right;">${parseFloat(rec.totalCbm || 0).toFixed(6)} CBM</td>
        </tr>
      </tbody>
    </table>

    <!-- CFT Calc -->
    <div class="print-section-head">C. CFT Calculation Detail &nbsp; (CFT = L&times;W&times;H &divide; 1,728)</div>
    <table class="print-table">
      <thead><tr><th>Description</th><th style="text-align:right;">L (inch)</th><th style="text-align:right;">W (inch)</th><th style="text-align:right;">H (inch)</th><th style="text-align:right;">Boxes</th><th style="text-align:right;">CFT</th></tr></thead>
      <tbody>
        ${cftCalcRows}
        <tr class="total-row">
          <td colspan="4">Total CFT</td>
          <td style="text-align:right;">${rec.cftBoxes || 0}</td>
          <td style="text-align:right;">${parseFloat(rec.totalCft || 0).toFixed(4)} CFT</td>
        </tr>
      </tbody>
    </table>

    <!-- Summary -->
    <div class="print-section-head">D. Calculation Summary</div>
    <div class="print-summary-grid">
      <div class="print-summary-item"><span class="print-summary-label">Total CBM</span><span class="print-summary-val">${parseFloat(rec.totalCbm || 0).toFixed(6)} CBM</span></div>
      <div class="print-summary-item"><span class="print-summary-label">Total CFT</span><span class="print-summary-val">${parseFloat(rec.totalCft || 0).toFixed(4)} CFT</span></div>
      <div class="print-summary-item"><span class="print-summary-label">CBM → CFT Conversion</span><span class="print-summary-val">${parseFloat(rec.cbm2cft || 0).toFixed(4)} CFT</span></div>
      <div class="print-summary-item"><span class="print-summary-label">CFT → CBM Conversion</span><span class="print-summary-val">${parseFloat(rec.cft2cbm || 0).toFixed(6)} CBM</span></div>
      <div class="print-summary-item"><span class="print-summary-label">Total Boxes (CBM)</span><span class="print-summary-val">${rec.cbmBoxes || 0}</span></div>
      <div class="print-summary-item"><span class="print-summary-label">Total Boxes (CFT)</span><span class="print-summary-val">${rec.cftBoxes || 0}</span></div>
    </div>

    <!-- Remarks -->
    <div class="print-section-head">E. Remarks</div>
    <div class="print-remarks">${rec.remarks || '&nbsp;'}</div>

    <!-- Signatories -->
    <div class="print-signatories">
      <div class="print-sig-item">
        <div class="print-sig-line">Prepared By: ${rec.preparedby || '__________________'}</div>
      </div>
      <div class="print-sig-item">
        <div class="print-sig-line">Authorised Signatory: ${rec.signatory || '__________________'}</div>
      </div>
    </div>

    <div class="print-footer">
      IMPEXIO | Export-Import Document Portal | Client: ${client} | Printed: ${new Date().toLocaleString('en-IN')}
    </div>
  </div>`;

  window.print();
}

// ── Toast ─────────────────────────────────────────────────────
function showToastMsg(icon, msg) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    document.body.appendChild(toast);
  }
  toast.innerHTML = `<span>${icon}</span><span>${msg}</span>`;
  toast.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toast.classList.remove('show'), 3000);
}
