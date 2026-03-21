/* ============================================================
   eq.js — Export Quotation Step Wizard
   IMPEXIO v2
   ============================================================ */

let eqRecords   = JSON.parse(localStorage.getItem('eq_records') || '[]');
let editingId   = null;
let currentStep = 1;
let rowCount    = 0;

// ── Init ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadSess();
  populateTopbar();
  setTodayDate();
  autoSetQuotNo();
  addRow(); addRow(); addRow(); addRow(); addRow(); // 5 rows default
  renderRecords();
  goToStep(1);
});

function setTodayDate() {
  const el = document.getElementById('f_date');
  if (el && !el.value) el.value = new Date().toISOString().split('T')[0];
}

function autoSetQuotNo() {
  const el = document.getElementById('f_quotno');
  if (el && !el.value) {
    const num = String(eqRecords.length + 1).padStart(4, '0');
    el.value = `EQ/2026/${num}`;
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
      <div class="dtb-chip">🏷️ <strong>${s.clientCode||''}</strong></div>
      <div class="dtb-chip">🏢 <strong>${(s.company.name||'').split(' ').slice(0,3).join(' ')}</strong></div>
      <div class="dtb-chip">📅 <strong>FY ${s.year?.label||''}</strong></div>`;
  }
}

function setText(id, val) { const el = document.getElementById(id); if (el) el.textContent = val; }
function doLogout() {
  if (confirm('Logout from IMPEXIO?')) { sessionStorage.removeItem('impexio'); window.location.href = 'index.html'; }
}
function gv(id) { return document.getElementById(id)?.value?.trim() || ''; }

// ── Step Navigation ───────────────────────────────────────────
function goToStep(n) {
  if (n > currentStep && n === 2) {
    if (!gv('f_quotno')) { showToast('⚠️', 'Please enter Quot. No. first.'); return; }
    if (!gv('f_date'))   { showToast('⚠️', 'Please select Date first.');     return; }
    if (!gv('f_buyer'))  { showToast('⚠️', 'Please enter Buyer name first.'); return; }
  }

  currentStep = n;

  [1,2,3].forEach(i => {
    document.getElementById(`step_${i}`)?.classList.toggle('hidden', i !== n);
  });
  [1,2,3].forEach(i => {
    const dot = document.getElementById(`pstep_${i}`);
    if (!dot) return;
    dot.classList.remove('active','done');
    if (i === n) dot.classList.add('active');
    if (i < n)   dot.classList.add('done');
  });
  document.querySelectorAll('.qpb-connector').forEach((c, idx) => {
    c.classList.toggle('done', idx + 1 < n);
  });

  const subs = {
    1: 'Step 1 of 3 — Header Info',
    2: 'Step 2 of 3 — Product Lines',
    3: 'Step 3 of 3 — Terms & Remarks'
  };
  setText('formSub', subs[n] || '');
  updateInfoStrips();
  if (n === 3) updateSummaryCard();
}

function nextStep(from) { goToStep(from + 1); }
function prevStep(from) { goToStep(from - 1); }

function updateInfoStrips() {
  const quotno  = gv('f_quotno')  || '—';
  const buyer   = gv('f_buyer')   || '—';
  const product = gv('f_product') || '—';
  const country = gv('f_country') || '—';
  const total   = document.getElementById('tot_amt')?.textContent || '0.00';

  setText('s2_quotno',  quotno);  setText('s2_buyer',   buyer);
  setText('s2_product', product); setText('s2_country', country);
  setText('s3_quotno',  quotno);  setText('s3_buyer',   buyer);
  setText('s3_total',   total);
}

// ── Product Rows ──────────────────────────────────────────────
function addRow() {
  rowCount++;
  const id = rowCount;
  const tbody = document.getElementById('productBody');
  const tr = document.createElement('tr');
  tr.id = `qrow_${id}`;
  tr.innerHTML = `
    <td style="display:flex;align-items:center;gap:0.3rem;">
      <button onclick="openEqProductPicker(${id})" title="Pick from Product Master" style="width:26px;height:26px;border-radius:6px;background:#0f2540;color:#fff;border:none;cursor:pointer;font-size:0.75rem;flex-shrink:0;display:flex;align-items:center;justify-content:center;">📦</button>
      <input type="text" class="qi-ci" id="r_desc_${id}" placeholder="Product description" style="flex:1;min-width:0;"/>
    </td>
    <td><input type="text"   class="qi-ci qi-ci-num" id="r_hs_${id}"   placeholder="HS Code"/></td>
    <td><input type="number" class="qi-ci qi-ci-num" id="r_qty_${id}"  placeholder="0"    step="0.01" min="0" oninput="calcRow(${id})"/></td>
    <td><input type="number" class="qi-ci qi-ci-num" id="r_rate_${id}" placeholder="0.00" step="0.01" min="0" oninput="calcRow(${id})"/></td>
    <td><span class="qi-ci-amt" id="r_amt_${id}">0.00</span></td>
    <td><button class="qi-del-btn" onclick="delRow(${id})">✕</button></td>`;
  tbody.appendChild(tr);
  attachEqProductAC(id);
}

function delRow(id) {
  const rows = document.getElementById('productBody').querySelectorAll('tr');
  if (rows.length <= 1) { showToast('⚠️', 'At least one product row is required.'); return; }
  document.getElementById(`qrow_${id}`)?.remove();
  calcTotals();
}

function calcRow(id) {
  const qty  = parseFloat(document.getElementById(`r_qty_${id}`)?.value)  || 0;
  const rate = parseFloat(document.getElementById(`r_rate_${id}`)?.value) || 0;
  const amt  = qty * rate;
  const el   = document.getElementById(`r_amt_${id}`);
  if (el) el.textContent = fmtAmt(amt);
  calcTotals();
}

function calcTotals() {
  const tbody = document.getElementById('productBody');
  const rows  = tbody.querySelectorAll('tr');
  let totalQty = 0, totalAmt = 0;

  rows.forEach(tr => {
    const id = tr.id.replace('qrow_','');
    totalQty += parseFloat(document.getElementById(`r_qty_${id}`)?.value) || 0;
    const amtEl = document.getElementById(`r_amt_${id}`);
    totalAmt += parseFloat(amtEl?.textContent?.replace(/,/g,'')) || 0;
  });

  setText('tot_qty', fmtNum(totalQty));
  setText('tot_amt', fmtAmt(totalAmt));
}

function updateSummaryCard() {
  calcTotals();
  setText('sum_qty',     document.getElementById('tot_qty')?.textContent || '0');
  setText('sum_amt',     document.getElementById('tot_amt')?.textContent || '0.00');
  setText('sum_buyer',   gv('f_buyer')   || '—');
  setText('sum_country', gv('f_country') || '—');
}

function fmtNum(n) {
  if (!n || n === 0) return '0';
  return Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 });
}
function fmtAmt(n) {
  return Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtDate(str) {
  if (!str) return '—';
  return new Date(str).toLocaleDateString('en-IN', { day:'2-digit', month:'2-digit', year:'numeric' }).replace(/\//g,' / ');
}

// ── Collect Rows ──────────────────────────────────────────────
function collectRows() {
  const tbody = document.getElementById('productBody');
  return Array.from(tbody.querySelectorAll('tr')).map(tr => {
    const id = tr.id.replace('qrow_','');
    return {
      desc: document.getElementById(`r_desc_${id}`)?.value || '',
      hs:   document.getElementById(`r_hs_${id}`)?.value   || '',
      qty:  parseFloat(document.getElementById(`r_qty_${id}`)?.value)  || 0,
      rate: parseFloat(document.getElementById(`r_rate_${id}`)?.value) || 0,
      amt:  document.getElementById(`r_amt_${id}`)?.textContent || '0.00',
    };
  }).filter(r => r.desc || r.qty || r.rate);
}

// ── New / Clear ───────────────────────────────────────────────
function newEntry() {
  clearForm();
  editingId = null;
  setText('formTitle', 'New Export Quotation');
  goToStep(1);
  document.querySelectorAll('.ql-card').forEach(c => c.classList.remove('active'));
}

function clearForm() {
  ['f_quotno','f_date','f_product','f_buyer','f_country',
   'f_pol','f_pod','f_incoterms','f_final_dest','f_delivery_time',
   'f_shipment_type','f_payment_terms','f_validity','f_packaging',
   'f_container_size','f_packed_dim','f_inner_pack','f_packed_weight',
   'f_master_pack','f_sample','f_special_inst','f_remarks',
   'f_preparedby','f_signatory'
  ].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });

  // restore default other_desc
  const od = document.getElementById('f_other_desc');
  if (od) od.value = '( Testing Charges, Inspection Charges and Special Packaging Charges will be extra as applicable )';

  setTodayDate();
  autoSetQuotNo();
  document.getElementById('productBody').innerHTML = '';
  rowCount = 0;
  addRow(); addRow(); addRow(); addRow(); addRow();
  calcTotals();
}

// ── Save ──────────────────────────────────────────────────────
function saveRecord() {
  const quotno = gv('f_quotno');
  const date   = gv('f_date');
  const buyer  = gv('f_buyer');
  if (!quotno) { showToast('⚠️','Please enter Quot. No.'); goToStep(1); return; }
  if (!date)   { showToast('⚠️','Please select Date.');    goToStep(1); return; }
  if (!buyer)  { showToast('⚠️','Please enter Buyer.');    goToStep(1); return; }

  calcTotals();
  const rows = collectRows();

  const rec = {
    id: editingId ?? Date.now(),
    quotno, date,
    product:     gv('f_product'),
    buyer,
    country:     gv('f_country'),
    pol:         gv('f_pol'),
    pod:         gv('f_pod'),
    incoterms:   gv('f_incoterms'),
    final_dest:  gv('f_final_dest'),
    delivery_time:   gv('f_delivery_time'),
    shipment_type:   gv('f_shipment_type'),
    payment_terms:   gv('f_payment_terms'),
    validity:        gv('f_validity'),
    packaging:       gv('f_packaging'),
    container_size:  gv('f_container_size'),
    packed_dim:      gv('f_packed_dim'),
    inner_pack:      gv('f_inner_pack'),
    packed_weight:   gv('f_packed_weight'),
    master_pack:     gv('f_master_pack'),
    sample:          gv('f_sample'),
    special_inst:    gv('f_special_inst'),
    other_desc:      gv('f_other_desc'),
    remarks:         gv('f_remarks'),
    preparedby:      gv('f_preparedby'),
    signatory:       gv('f_signatory'),
    rows,
    tot_qty: document.getElementById('tot_qty')?.textContent || '0',
    tot_amt: document.getElementById('tot_amt')?.textContent || '0.00',
  };

  if (editingId !== null) {
    const idx = eqRecords.findIndex(r => r.id === editingId);
    if (idx > -1) eqRecords[idx] = rec; else eqRecords.unshift(rec);
  } else {
    eqRecords.unshift(rec);
  }

  localStorage.setItem('eq_records', JSON.stringify(eqRecords));
  renderRecords();
  showToast('✅', `Quotation ${quotno} saved!`);
  editingId = rec.id;
  setText('formTitle', `Editing: ${quotno}`);
}

// ── Edit ──────────────────────────────────────────────────────
function editRecord(id) {
  const rec = eqRecords.find(r => r.id === id);
  if (!rec) return;
  editingId = id;
  setText('formTitle', `Editing: ${rec.quotno}`);

  const sv = (elId, v) => { const el = document.getElementById(elId); if (el) el.value = v || ''; };
  sv('f_quotno',   rec.quotno);   sv('f_date',    rec.date);
  sv('f_product',  rec.product);  sv('f_buyer',   rec.buyer);
  sv('f_country',  rec.country);
  sv('f_pol',      rec.pol);      sv('f_pod',     rec.pod);
  sv('f_incoterms',rec.incoterms);sv('f_final_dest',rec.final_dest);
  sv('f_delivery_time', rec.delivery_time);
  sv('f_shipment_type', rec.shipment_type);
  sv('f_payment_terms', rec.payment_terms);
  sv('f_validity',      rec.validity);
  sv('f_packaging',     rec.packaging);
  sv('f_container_size',rec.container_size);
  sv('f_packed_dim',    rec.packed_dim);
  sv('f_inner_pack',    rec.inner_pack);
  sv('f_packed_weight', rec.packed_weight);
  sv('f_master_pack',   rec.master_pack);
  sv('f_sample',        rec.sample);
  sv('f_special_inst',  rec.special_inst);
  sv('f_other_desc',    rec.other_desc || '( Testing Charges, Inspection Charges and Special Packaging Charges will be extra as applicable )');
  sv('f_remarks',       rec.remarks);
  sv('f_preparedby',    rec.preparedby);
  sv('f_signatory',     rec.signatory);

  // Restore rows
  document.getElementById('productBody').innerHTML = '';
  rowCount = 0;
  if (rec.rows && rec.rows.length > 0) {
    rec.rows.forEach(row => {
      addRow();
      const id2 = rowCount;
      const sv2 = (k, v) => { const el = document.getElementById(`r_${k}_${id2}`); if (el) el.value = v || ''; };
      sv2('desc', row.desc); sv2('hs', row.hs);
      sv2('qty',  row.qty);  sv2('rate', row.rate);
      calcRow(id2);
    });
    // fill to at least 5 rows
    while (rowCount < 5) { addRow(); }
  } else {
    addRow(); addRow(); addRow(); addRow(); addRow();
  }
  calcTotals();

  document.querySelectorAll('.ql-card').forEach(c => c.classList.remove('active'));
  document.getElementById(`eqcard_${id}`)?.classList.add('active');
  goToStep(1);
}

// ── Delete ────────────────────────────────────────────────────
function deleteRecord(id) {
  if (!confirm('Delete this Export Quotation?')) return;
  eqRecords = eqRecords.filter(r => r.id !== id);
  localStorage.setItem('eq_records', JSON.stringify(eqRecords));
  if (editingId === id) newEntry();
  renderRecords();
  showToast('🗑','Record deleted.');
}

// ── Render List ───────────────────────────────────────────────
function renderRecords(data = null) {
  const list  = document.getElementById('recordsList');
  const items = data || eqRecords;
  if (items.length === 0) {
    list.innerHTML = `
      <div class="ql-empty">
        <div style="font-size:1.6rem;opacity:0.35;">📋</div>
        <div class="ql-empty-txt">No records yet</div>
        <div class="ql-empty-sub">Click + New to begin</div>
      </div>`;
    return;
  }
  list.innerHTML = items.map(rec => `
    <div class="ql-card ${editingId===rec.id?'active':''}" id="eqcard_${rec.id}" onclick="editRecord(${rec.id})">
      <div class="ql-card-no">${rec.quotno}</div>
      <div class="ql-card-buyer">${rec.buyer||'—'}</div>
      <div class="ql-card-prod">${rec.product||'—'}</div>
      <div class="ql-card-row">
        <span class="ql-card-date">${fmtDate(rec.date)}</span>
        <span class="ql-card-val">${rec.tot_amt||'0.00'}</span>
      </div>
      <div class="ql-card-acts">
        <button class="ql-act edit" onclick="event.stopPropagation();editRecord(${rec.id})">✏️ Edit</button>
        <button class="ql-act prnt" onclick="event.stopPropagation();printById(${rec.id})">🖨 Print</button>
        <button class="ql-act del"  onclick="event.stopPropagation();deleteRecord(${rec.id})">🗑</button>
      </div>
    </div>`).join('');
}

function filterRecords() {
  const q = document.getElementById('searchInput')?.value.toLowerCase() || '';
  if (!q) { renderRecords(); return; }
  renderRecords(eqRecords.filter(r =>
    r.quotno?.toLowerCase().includes(q) ||
    r.buyer?.toLowerCase().includes(q)  ||
    r.product?.toLowerCase().includes(q)
  ));
}

// ── Print ─────────────────────────────────────────────────────
function printRecord() {
  calcTotals();
  doPrint({
    quotno: gv('f_quotno'), date: gv('f_date'),
    product: gv('f_product'), buyer: gv('f_buyer'), country: gv('f_country'),
    pol: gv('f_pol'), pod: gv('f_pod'),
    incoterms: gv('f_incoterms'), final_dest: gv('f_final_dest'),
    delivery_time: gv('f_delivery_time'), shipment_type: gv('f_shipment_type'),
    payment_terms: gv('f_payment_terms'), validity: gv('f_validity'),
    packaging: gv('f_packaging'), container_size: gv('f_container_size'),
    packed_dim: gv('f_packed_dim'), inner_pack: gv('f_inner_pack'),
    packed_weight: gv('f_packed_weight'), master_pack: gv('f_master_pack'),
    sample: gv('f_sample'), special_inst: gv('f_special_inst'),
    other_desc: gv('f_other_desc'), remarks: gv('f_remarks'),
    preparedby: gv('f_preparedby'), signatory: gv('f_signatory'),
    rows: collectRows(),
    tot_qty: document.getElementById('tot_qty')?.textContent || '0',
    tot_amt: document.getElementById('tot_amt')?.textContent || '0.00',
  });
}

function printById(id) {
  const rec = eqRecords.find(r => r.id === id);
  if (rec) doPrint(rec);
}

function doPrint(rec) {
  const client = sess?.clientCode || 'Demo001';

  const productRows = (rec.rows || []).map(r => `
    <tr>
      <td class="desc-td">${r.desc||''}</td>
      <td>${r.hs||''}</td>
      <td>${r.qty||''}</td>
      <td>${r.rate ? fmtAmt(r.rate) : ''}</td>
      <td>${r.amt||''}</td>
    </tr>`).join('');

  const emptyRows = Math.max(0, 12 - (rec.rows||[]).length);
  const padRows   = Array(emptyRows).fill('<tr><td>&nbsp;</td><td></td><td></td><td></td><td></td></tr>').join('');

  // Terms grid
  const termPairs = [
    ['Port of Loading',    rec.pol],
    ['Port of Discharge',  rec.pod],
    ['Inco Terms',         rec.incoterms],
    ['Final Destination',  rec.final_dest],
    ['Delivery Time',      rec.delivery_time],
    ['Shipment Type',      rec.shipment_type],
    ['Payment Terms',      rec.payment_terms],
    ['Quotation Validity', rec.validity],
    ['Packaging / Labeling',rec.packaging],
    ['Container Size',     rec.container_size],
    ['Packed Dimension',   rec.packed_dim],
    ['Total Inner Pack',   rec.inner_pack],
    ['Packed Weight',      rec.packed_weight],
    ['Total Master Pack',  rec.master_pack],
  ];
  const termsHTML = termPairs.map(([l,v]) => `
    <div class="qp-term-item">
      <span class="qp-term-lbl">${l}:</span>
      <span class="qp-term-val">${v||''}</span>
    </div>`).join('');

  document.getElementById('printArea').innerHTML = `
  <div class="qp-doc">
    <div class="qp-hdr">
      <div class="qp-hdr-title">IMPEXIO &mdash; EXPORT QUOTATION</div>
    </div>
    <div class="qp-teal-bar"></div>

    <div class="qp-meta">
      <div class="qp-meta-item"><span class="qp-meta-lbl">Quot. No.:&nbsp;</span><span class="qp-meta-val">${rec.quotno||''}</span></div>
      <div class="qp-meta-item"><span class="qp-meta-lbl">Date:&nbsp;</span><span class="qp-meta-val">${fmtDate(rec.date)}</span></div>
      <div class="qp-meta-item"><span class="qp-meta-lbl">Country:&nbsp;</span><span class="qp-meta-val">${rec.country||''}</span></div>
      <div class="qp-meta-item"><span class="qp-meta-lbl">Product:&nbsp;</span><span class="qp-meta-val">${rec.product||''}</span></div>
      <div class="qp-meta-item" style="grid-column:2/-1;"><span class="qp-meta-lbl">Buyer:&nbsp;</span><span class="qp-meta-val">${rec.buyer||''}</span></div>
    </div>

    <table class="qp-tbl">
      <thead>
        <tr>
          <th class="desc-th">Product Description</th>
          <th>HS Code</th>
          <th>Qty</th>
          <th>Rate CIF</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
        ${productRows}
        ${padRows}
        <tr class="qp-tot-row">
          <td colspan="2" style="text-align:right;font-size:8pt;letter-spacing:0.12em;">TOTAL</td>
          <td>${rec.tot_qty||'0'}</td>
          <td></td>
          <td class="qp-tot-gold">${rec.tot_amt||'0.00'}</td>
        </tr>
      </tbody>
    </table>

    <div class="qp-sec-hd">Other Details With Terms &amp; Conditions</div>
    <div class="qp-terms">${termsHTML}</div>

    <div class="qp-sample-box">
      <div class="qp-sample-row">
        <div class="qp-sample-item">
          <span class="qp-sample-lbl">Sample:</span>
          <span class="qp-sample-val">${rec.sample || '( Sample not yet approved )'}</span>
        </div>
        <div class="qp-sample-item">
          <span class="qp-sample-lbl">Special Instructions:</span>
          <span class="qp-sample-val">${rec.special_inst||''}</span>
        </div>
      </div>
      <div class="qp-other-desc">Other Desc.: ${rec.other_desc||''}</div>
    </div>

    ${rec.remarks ? `<div style="font-weight:700;font-size:7.5pt;background:#0f5c52;color:#fff;padding:3px 7px;margin-top:4px;">Remarks:</div><div class="qp-remarks">${rec.remarks}</div>` : `<div style="font-weight:700;font-size:7.5pt;background:#0f5c52;color:#fff;padding:3px 7px;margin-top:4px;">Remarks:</div><div class="qp-remarks">&nbsp;</div>`}

    <div class="qp-sigs">
      <div class="qp-sig"><div class="qp-sig-line">Prepared By: ${rec.preparedby||'__________________'}</div></div>
      <div class="qp-sig"><div class="qp-sig-line">For IMPEXIO / Authorised Signatory: ${rec.signatory||'__________________'}</div></div>
    </div>

    <div class="qp-bottom-bar"></div>
    <div class="qp-footer">IMPEXIO | Export-Import Document Portal | Client: ${client} | Export Quotation | Printed: ${new Date().toLocaleString('en-IN')}</div>
  </div>`;

  window.print();
}

// ── Toast ─────────────────────────────────────────────────────
function showToast(icon, msg) {
  let t = document.getElementById('eq-toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'eq-toast';
    t.style.cssText = `position:fixed;bottom:1.5rem;right:1.5rem;background:var(--teal,#0f5c52);color:#fff;padding:0.7rem 1.2rem;border-radius:10px;font-size:0.82rem;font-weight:600;display:flex;gap:0.5rem;align-items:center;box-shadow:0 8px 24px rgba(15,92,82,0.3);z-index:9999;opacity:0;transition:opacity 0.3s;pointer-events:none;border-left:3px solid var(--gold,#c9a84c);`;
    document.body.appendChild(t);
  }
  t.innerHTML = `<span>${icon}</span><span>${msg}</span>`;
  t.style.opacity = '1';
  clearTimeout(t._t);
  t._t = setTimeout(() => { t.style.opacity = '0'; }, 3000);
}

// ══════════════════════════════════════════════════════════════
//  EQ MASTER DATA SYSTEM
//  Masters: Buyer, Product, Port, Incoterms, Payment Terms, Signatory
//  + Autocomplete dropdown on field click
// ══════════════════════════════════════════════════════════════

const EQ_MASTER_CONFIG = {
  buyer: {
    label:'Buyer', icon:'🌍', key:'impexio_master_buyer',
    fields:[
      {id:'name',    label:'Buyer Name',     placeholder:'e.g. Euro Ceramics GmbH', req:true},
      {id:'company', label:'Company',        placeholder:'e.g. Euro Ceramics GmbH'},
      {id:'country', label:'Country',        placeholder:'e.g. Germany'},
      {id:'city',    label:'City',           placeholder:'e.g. Frankfurt'},
      {id:'contact', label:'Contact',        placeholder:'Phone / Email'},
    ],
    display: r => r.name,
    sub:     r => [r.city, r.country].filter(Boolean).join(', '),
    fill:    (r, tid) => {
      const el = document.getElementById(tid); if(el){el.value=r.name;el.dispatchEvent(new Event('input'));}
      const ce = document.getElementById('f_country'); if(ce && r.country){ce.value=r.country;ce.dispatchEvent(new Event('input'));}
    }
  },
  product: {
    label:'Product', icon:'📦', key:'impexio_master_product',
    fields:[
      {id:'name',   label:'Product Name',       placeholder:'e.g. Ceramic Floor Tiles', req:true},
      {id:'hscode', label:'HS Code',             placeholder:'e.g. 6907.21'},
      {id:'unit',   label:'Unit',                placeholder:'e.g. PCS / KGS / MTR'},
      {id:'rate',   label:'Default Rate CIF $',  placeholder:'e.g. 12.50'},
      {id:'desc',   label:'Additional Details',  placeholder:'Grade, finish, size etc.'},
    ],
    display: r => r.name,
    sub:     r => [r.hscode ? 'HS: '+r.hscode : '', r.unit].filter(Boolean).join(' · '),
    fill:    (r, rowId) => {
      const dEl = document.getElementById('r_desc_' + rowId);
      const hEl = document.getElementById('r_hs_'   + rowId);
      const rEl = document.getElementById('r_rate_' + rowId);
      if (dEl) { dEl.value = r.name || '';    dEl.dispatchEvent(new Event('input')); }
      if (hEl) { hEl.value = r.hscode || ''; }
      if (rEl && r.rate) { rEl.value = r.rate; rEl.dispatchEvent(new Event('input')); calcRow(rowId); }
      // also fill header product field if empty
      const pEl = document.getElementById('f_product');
      if (pEl && !pEl.value) { pEl.value = r.name; pEl.dispatchEvent(new Event('input')); }
    }
  },
  port: {
    label:'Port', icon:'⚓', key:'impexio_master_port',
    fields:[
      {id:'name',    label:'Port Name',  placeholder:'e.g. Mundra Port', req:true},
      {id:'code',    label:'Port Code',  placeholder:'e.g. INMUN'},
      {id:'state',   label:'State',      placeholder:'e.g. Gujarat'},
      {id:'country', label:'Country',    placeholder:'e.g. India'},
    ],
    display: r => r.name,
    sub:     r => [r.code, r.state].filter(Boolean).join(' · '),
    fill:    (r, tid) => { const el=document.getElementById(tid); if(el){el.value=r.name;el.dispatchEvent(new Event('input'));} }
  },
  incoterms: {
    label:'Incoterms', icon:'📜', key:'impexio_master_incoterms',
    fields:[
      {id:'term', label:'Incoterm',    placeholder:'e.g. CIF / FOB / EXW', req:true},
      {id:'desc', label:'Description', placeholder:'e.g. Cost Insurance Freight'},
    ],
    display: r => r.term,
    sub:     r => r.desc || '',
    fill:    (r, tid) => { const el=document.getElementById(tid); if(el){el.value=r.term;el.dispatchEvent(new Event('input'));} }
  },
  payterms: {
    label:'Payment Terms', icon:'💳', key:'impexio_master_payterms',
    fields:[
      {id:'term', label:'Payment Term', placeholder:'e.g. 30% Advance, 70% against BL', req:true},
      {id:'note', label:'Note',         placeholder:'Additional note'},
    ],
    display: r => r.term,
    sub:     r => r.note || '',
    fill:    (r, tid) => { const el=document.getElementById(tid); if(el){el.value=r.term;el.dispatchEvent(new Event('input'));} }
  },
  signatory: {
    label:'Signatory', icon:'✍️', key:'impexio_master_signatory',
    fields:[
      {id:'name',        label:'Full Name',    placeholder:'e.g. Rajesh Kumar Sharma', req:true},
      {id:'designation', label:'Designation',  placeholder:'e.g. Director / Manager'},
      {id:'department',  label:'Department',   placeholder:'e.g. Export Operations'},
    ],
    display: r => r.name,
    sub:     r => r.designation || '',
    fill:    (r, tid) => { const el=document.getElementById(tid); if(el){el.value=r.name;el.dispatchEvent(new Event('input'));} }
  }
};

// ── Storage ───────────────────────────────────────────────────
function getEqMaster(type) {
  try { return JSON.parse(localStorage.getItem(EQ_MASTER_CONFIG[type].key)||'[]'); } catch { return []; }
}
function setEqMaster(type, data) {
  localStorage.setItem(EQ_MASTER_CONFIG[type].key, JSON.stringify(data));
}

// ── State ─────────────────────────────────────────────────────
let eqMasterPickTarget = null;
let eqMasterEditType   = null;
let eqMasterEditIdx    = null;

// ── Open / Close ──────────────────────────────────────────────
function openEqMaster(tab, targetFieldId) {
  eqMasterPickTarget = targetFieldId || null;
  document.getElementById('eqMasterOverlay').classList.add('open');
  document.getElementById('eqMasterPanel').classList.add('open');
  switchEqMasterTab(tab || 'buyer');
}
function closeEqMaster() {
  document.getElementById('eqMasterOverlay').classList.remove('open');
  document.getElementById('eqMasterPanel').classList.remove('open');
  eqMasterPickTarget = null;
}

// ── Tab switch ────────────────────────────────────────────────
function switchEqMasterTab(type) {
  document.querySelectorAll('.eq-master-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.eq-master-sect').forEach(s => s.classList.remove('active'));
  const tab = document.getElementById('eqmt-' + type);
  const sec = document.getElementById('eqms-' + type);
  if (tab) tab.classList.add('active');
  if (sec) sec.classList.add('active');
  const cfg = EQ_MASTER_CONFIG[type];
  document.getElementById('eqMasterTitle').textContent = cfg.icon + ' ' + cfg.label + ' Master';
  renderEqMasterList(type);
}

// ── Render list ───────────────────────────────────────────────
function renderEqMasterList(type) {
  const cfg    = EQ_MASTER_CONFIG[type];
  const data   = getEqMaster(type);
  const listEl = document.getElementById('eqml-' + type);
  if (!listEl) return;
  if (!data.length) {
    listEl.innerHTML = `<div class="eq-master-empty"><div class="eq-master-empty-icon">${cfg.icon}</div><div class="eq-master-empty-txt">No ${cfg.label} records yet</div><div class="eq-master-empty-sub">Click "+ Add ${cfg.label}" to create your first record</div></div>`;
    return;
  }
  listEl.innerHTML = data.map((r, i) => `
    <div class="eq-master-item" onclick="pickEqMasterRecord('${type}',${i})">
      <div class="eq-master-item-icon">${cfg.icon}</div>
      <div style="flex:1;min-width:0;"><div class="eq-master-item-name">${cfg.display(r)}</div><div class="eq-master-item-sub">${cfg.sub(r)}</div></div>
      <div class="eq-master-item-acts" onclick="event.stopPropagation()">
        <button class="eq-mi-btn use"  onclick="pickEqMasterRecord('${type}',${i})">↗ Use</button>
        <button class="eq-mi-btn edit" onclick="openEqMasterForm('${type}',${i})">✏️</button>
        <button class="eq-mi-btn del"  onclick="deleteEqMaster('${type}',${i})">🗑</button>
      </div>
    </div>`).join('');
}

// ── Pick record ───────────────────────────────────────────────
function pickEqMasterRecord(type, idx) {
  const cfg  = EQ_MASTER_CONFIG[type];
  const data = getEqMaster(type);
  const r    = data[idx]; if (!r) return;
  if (type === 'product' && eqProductPickRowId !== null) {
    cfg.fill(r, eqProductPickRowId);
    showToast('📦', r.name + ' selected');
    closeEqMaster();
    return;
  }
  if (eqMasterPickTarget) {
    cfg.fill(r, eqMasterPickTarget);
    showToast('✅', cfg.label + ' selected: ' + cfg.display(r));
    closeEqMaster();
  }
}

// ── Add / Edit form ───────────────────────────────────────────
function openEqMasterForm(type, idx) {
  eqMasterEditType = type;
  eqMasterEditIdx  = (idx !== undefined && idx !== null) ? idx : null;
  const cfg  = EQ_MASTER_CONFIG[type];
  const data = getEqMaster(type);
  const rec  = eqMasterEditIdx !== null ? data[eqMasterEditIdx] : null;
  document.getElementById('eqMfTitle').textContent = rec ? `✏️ Edit ${cfg.label}` : `+ Add ${cfg.label}`;
  document.getElementById('eqMfBody').innerHTML = cfg.fields.map(f => `
    <div class="eq-mf-fg">
      <label class="eq-mf-lbl">${f.label}${f.req?' *':''}</label>
      <input class="eq-mf-inp" id="eqmf_${f.id}" type="text" placeholder="${f.placeholder}" value="${rec?(rec[f.id]||''):''}"/>
    </div>`).join('');
  document.getElementById('eqMfOverlay').classList.add('open');
  setTimeout(() => { const first=document.querySelector('#eqMfBody .eq-mf-inp'); if(first) first.focus(); }, 100);
}
function closeEqMasterForm() {
  document.getElementById('eqMfOverlay').classList.remove('open');
  eqMasterEditType = null; eqMasterEditIdx = null;
}
function saveEqMasterRecord() {
  const type = eqMasterEditType; if (!type) return;
  const cfg  = EQ_MASTER_CONFIG[type];
  const data = getEqMaster(type);
  const rec  = {}; let valid = true;
  cfg.fields.forEach(f => {
    const el = document.getElementById('eqmf_' + f.id);
    if (el) rec[f.id] = el.value.trim();
    if (f.req && !rec[f.id]) { valid=false; el?.classList.add('err'); } else el?.classList.remove('err');
  });
  if (!valid) { showToast('⚠️','Please fill all required fields!'); return; }
  if (eqMasterEditIdx !== null) { data[eqMasterEditIdx]=rec; } else { data.push(rec); }
  setEqMaster(type, data);
  closeEqMasterForm();
  renderEqMasterList(type);
  showToast('✅', cfg.label + ' saved!');
}
function deleteEqMaster(type, idx) {
  const cfg = EQ_MASTER_CONFIG[type];
  if (!confirm('Delete this ' + cfg.label + ' record?')) return;
  const data = getEqMaster(type); data.splice(idx,1);
  setEqMaster(type, data); renderEqMasterList(type);
  showToast('🗑', cfg.label + ' deleted.');
}

// ══════════════════════════════════════════════════════════════
//  PRODUCT ROW PICKER
// ══════════════════════════════════════════════════════════════
let eqProductPickRowId = null;

function openEqProductPicker(rowId) {
  eqProductPickRowId = rowId;
  openEqMaster('product', rowId);
}

// ══════════════════════════════════════════════════════════════
//  AUTOCOMPLETE DROPDOWN
// ══════════════════════════════════════════════════════════════
const EQ_FIELD_MAP = {
  'f_buyer':         { type:'buyer',     display:r=>r.name, sub:r=>[r.city,r.country].filter(Boolean).join(', ') },
  'f_product':       { type:'product',   display:r=>r.name, sub:r=>[r.hscode?'HS:'+r.hscode:'',r.unit].filter(Boolean).join(' · ') },
  'f_pol':           { type:'port',      display:r=>r.name, sub:r=>[r.code,r.state].filter(Boolean).join(' · ') },
  'f_pod':           { type:'port',      display:r=>r.name, sub:r=>[r.code,r.state].filter(Boolean).join(' · ') },
  'f_incoterms':     { type:'incoterms', display:r=>r.term, sub:r=>r.desc||'' },
  'f_payment_terms': { type:'payterms',  display:r=>r.term, sub:r=>r.note||'' },
  'f_preparedby':    { type:'signatory', display:r=>r.name, sub:r=>r.designation||'' },
  'f_signatory':     { type:'signatory', display:r=>r.name, sub:r=>r.designation||'' },
};

const eqAcDrop = document.getElementById('eqAcDropdown');
let eqAcField  = null;

function posEqAC(el) {
  const r = el.getBoundingClientRect();
  eqAcDrop.style.left  = r.left + 'px';
  eqAcDrop.style.top   = (r.bottom + 4) + 'px';
  eqAcDrop.style.width = Math.max(r.width, 260) + 'px';
}

function renderEqAC(fieldId, query) {
  const map  = EQ_FIELD_MAP[fieldId]; if (!map) return closeEqAC();
  const data = getEqMaster(map.type);  if (!data.length) return closeEqAC();
  const q    = (query||'').toLowerCase().trim();
  const filtered = q ? data.filter(r => map.display(r).toLowerCase().includes(q)) : data;
  if (!filtered.length) return closeEqAC();
  const cfg = EQ_MASTER_CONFIG[map.type];
  eqAcDrop.innerHTML = `
    <div style="padding:0.45rem 0.75rem;font-size:0.62rem;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#6b7fa3;border-bottom:1px solid #eef1f8;display:flex;align-items:center;justify-content:space-between;">
      <span>${cfg.icon} Saved ${cfg.label}</span><span style="color:#9aadcc;">${filtered.length} found</span>
    </div>
    ${filtered.map(r => {
      const idx=data.indexOf(r); const sub=map.sub(r);
      return `<div class="eq-ac-item" onmousedown="event.preventDefault();pickEqAC('${fieldId}',${idx})"
        style="padding:0.6rem 0.85rem;cursor:pointer;border-bottom:1px solid #f4f3ee;display:flex;align-items:center;gap:0.65rem;transition:background 0.15s;">
        <div style="width:28px;height:28px;border-radius:7px;background:#f0f2f8;display:flex;align-items:center;justify-content:center;font-size:0.85rem;flex-shrink:0;">${cfg.icon}</div>
        <div style="flex:1;min-width:0;"><div style="font-size:0.82rem;font-weight:600;color:#0f2540;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${map.display(r)}</div>${sub?`<div style="font-size:0.68rem;color:#6b7fa3;margin-top:0.1rem;">${sub}</div>`:''}</div>
        <div style="font-size:0.65rem;color:#c9a84c;font-weight:700;flex-shrink:0;">↗ Use</div>
      </div>`;
    }).join('')}`;
  eqAcDrop.querySelectorAll('.eq-ac-item').forEach(el => {
    el.addEventListener('mouseover', () => el.style.background='#f4f3ee');
    el.addEventListener('mouseout',  () => el.style.background='');
  });
  eqAcDrop.style.display = 'block';
  posEqAC(document.getElementById(fieldId));
}

function pickEqAC(fieldId, idx) {
  const map = EQ_FIELD_MAP[fieldId]; if (!map) return;
  const data = getEqMaster(map.type); const r=data[idx]; if (!r) return;
  EQ_MASTER_CONFIG[map.type].fill(r, fieldId);
  closeEqAC();
  showToast('✅', map.display(r) + ' selected');
}
function closeEqAC() { eqAcDrop.style.display='none'; eqAcField=null; }

// ── Product row autocomplete ──────────────────────────────────
function attachEqProductAC(rowId) {
  setTimeout(() => {
    const descEl = document.getElementById('r_desc_' + rowId);
    if (!descEl) return;
    descEl.addEventListener('focus', () => renderEqRowAC(rowId, descEl.value));
    descEl.addEventListener('click', () => renderEqRowAC(rowId, descEl.value));
    descEl.addEventListener('input', () => renderEqRowAC(rowId, descEl.value));
    descEl.addEventListener('keydown', e => {
      if (e.key==='Escape') { closeEqAC(); return; }
      if (eqAcDrop.style.display==='none') return;
      const items=eqAcDrop.querySelectorAll('.eq-row-ac-item');
      const active=eqAcDrop.querySelector('.eq-row-ac-item.ac-active');
      let idx=-1; items.forEach((it,i)=>{ if(it===active) idx=i; });
      if (e.key==='ArrowDown') { e.preventDefault(); const next=idx<items.length-1?idx+1:0; items.forEach(i=>{i.classList.remove('ac-active');i.style.background='';}); items[next].classList.add('ac-active'); items[next].style.background='#f4f3ee'; items[next].scrollIntoView({block:'nearest'}); }
      if (e.key==='ArrowUp')   { e.preventDefault(); const prev=idx>0?idx-1:items.length-1; items.forEach(i=>{i.classList.remove('ac-active');i.style.background='';}); items[prev].classList.add('ac-active'); items[prev].style.background='#f4f3ee'; items[prev].scrollIntoView({block:'nearest'}); }
      if (e.key==='Enter' && active) { e.preventDefault(); active.dispatchEvent(new MouseEvent('mousedown')); }
    });
  }, 50);
}

function renderEqRowAC(rowId, query) {
  const data = getEqMaster('product'); if (!data.length) return closeEqAC();
  const q = (query||'').toLowerCase().trim();
  const filtered = q ? data.filter(r => r.name.toLowerCase().includes(q)) : data;
  if (!filtered.length) return closeEqAC();
  eqAcDrop.innerHTML = `
    <div style="padding:0.45rem 0.75rem;font-size:0.62rem;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#6b7fa3;border-bottom:1px solid #eef1f8;display:flex;align-items:center;justify-content:space-between;">
      <span>📦 Saved Products</span><span style="color:#9aadcc;">${filtered.length} found</span>
    </div>
    ${filtered.map(r => {
      const idx=data.indexOf(r);
      const sub=[r.hscode?'HS:'+r.hscode:'',r.unit].filter(Boolean).join(' · ');
      return `<div class="eq-row-ac-item" onmousedown="event.preventDefault();pickEqRowProduct(${rowId},${idx})"
        style="padding:0.6rem 0.85rem;cursor:pointer;border-bottom:1px solid #f4f3ee;display:flex;align-items:center;gap:0.65rem;transition:background 0.15s;">
        <div style="width:28px;height:28px;border-radius:7px;background:#f0f2f8;display:flex;align-items:center;justify-content:center;font-size:0.85rem;flex-shrink:0;">📦</div>
        <div style="flex:1;min-width:0;"><div style="font-size:0.82rem;font-weight:600;color:#0f2540;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${r.name}</div>${sub?`<div style="font-size:0.68rem;color:#6b7fa3;margin-top:0.1rem;">${sub}</div>`:''}${r.rate?`<div style="font-size:0.68rem;color:#c9a84c;font-weight:700;">Rate CIF: $${r.rate}</div>`:''}</div>
        <div style="font-size:0.65rem;color:#c9a84c;font-weight:700;flex-shrink:0;">↗ Use</div>
      </div>`;
    }).join('')}`;
  eqAcDrop.querySelectorAll('.eq-row-ac-item').forEach(el => {
    el.addEventListener('mouseover', () => el.style.background='#f4f3ee');
    el.addEventListener('mouseout',  () => el.style.background='');
  });
  eqAcDrop.style.display = 'block';
  const descEl = document.getElementById('r_desc_' + rowId);
  if (descEl) posEqAC(descEl);
}

function pickEqRowProduct(rowId, idx) {
  const data = getEqMaster('product'); const r=data[idx]; if (!r) return;
  EQ_MASTER_CONFIG.product.fill(r, rowId);
  closeEqAC();
  showToast('📦', r.name + ' selected');
}

// ── Attach autocomplete to all header fields ──────────────────
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    Object.keys(EQ_FIELD_MAP).forEach(fieldId => {
      const el = document.getElementById(fieldId); if (!el) return;
      el.addEventListener('focus', () => { eqAcField=fieldId; renderEqAC(fieldId, el.value); });
      el.addEventListener('click', () => { eqAcField=fieldId; renderEqAC(fieldId, el.value); });
      el.addEventListener('input', () => { if(eqAcField===fieldId) renderEqAC(fieldId, el.value); });
      el.addEventListener('keydown', e => {
        if (e.key==='Escape') { closeEqAC(); return; }
        if (eqAcDrop.style.display==='none') return;
        const items=eqAcDrop.querySelectorAll('.eq-ac-item');
        const active=eqAcDrop.querySelector('.eq-ac-item.ac-active');
        let idx=-1; items.forEach((it,i)=>{ if(it===active) idx=i; });
        if (e.key==='ArrowDown') { e.preventDefault(); const next=idx<items.length-1?idx+1:0; items.forEach(i=>{i.classList.remove('ac-active');i.style.background='';}); items[next].classList.add('ac-active'); items[next].style.background='#f4f3ee'; items[next].scrollIntoView({block:'nearest'}); }
        if (e.key==='ArrowUp')   { e.preventDefault(); const prev=idx>0?idx-1:items.length-1; items.forEach(i=>{i.classList.remove('ac-active');i.style.background='';}); items[prev].classList.add('ac-active'); items[prev].style.background='#f4f3ee'; items[prev].scrollIntoView({block:'nearest'}); }
        if (e.key==='Enter' && active) { e.preventDefault(); active.dispatchEvent(new MouseEvent('mousedown')); }
      });
    });
    document.addEventListener('click', e => {
      if (!eqAcDrop.contains(e.target) && !Object.keys(EQ_FIELD_MAP).some(id => document.getElementById(id)===e.target)) closeEqAC();
    });
    window.addEventListener('scroll', () => { if(eqAcField && eqAcDrop.style.display!=='none') posEqAC(document.getElementById(eqAcField)); }, true);
    // Attach to initial 5 rows
    [1,2,3,4,5].forEach(id => attachEqProductAC(id));
  }, 300);
});

