/* ============================================================
   pi.js — Export Proforma Invoice Step Wizard
   IMPEXIO v2
   ============================================================ */

let piRecords   = JSON.parse(localStorage.getItem('pi_records') || '[]');
let editingId   = null;
let currentStep = 1;
let rowCount    = 0;

// ── Init ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadSess();
  populateTopbar();
  setTodayDate();
  autoSetPiNo();
  addRow(); addRow(); addRow(); // start with 3 empty rows
  renderRecords();
  goToStep(1);
});

function setTodayDate() {
  const el = document.getElementById('f_date');
  if (el && !el.value) el.value = new Date().toISOString().split('T')[0];
}

function autoSetPiNo() {
  const el = document.getElementById('f_pino');
  if (el && !el.value) {
    const num = String(piRecords.length + 1).padStart(4, '0');
    el.value = `PI/2026/${num}`;
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
function gn(id) { return parseFloat(document.getElementById(id)?.value) || 0; }

// ── Step Navigation ───────────────────────────────────────────
function goToStep(n) {
  if (n > currentStep && n === 2) {
    if (!gv('f_pino')) { showToast('⚠️', 'Please enter PI No. first.'); return; }
    if (!gv('f_date')) { showToast('⚠️', 'Please select Date first.');  return; }
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

  document.querySelectorAll('.ppb-connector').forEach((c, idx) => {
    c.classList.toggle('done', idx + 1 < n);
  });

  const subs = {
    1: 'Step 1 of 3 — Header Info',
    2: 'Step 2 of 3 — Product Lines',
    3: 'Step 3 of 3 — Remarks & Auth'
  };
  setText('formSub', subs[n] || '');
  updateInfoStrips();
  if (n === 3) updateSummaryCard();
}

function nextStep(from) { goToStep(from + 1); }
function prevStep(from) { goToStep(from - 1); }

function updateInfoStrips() {
  const pino  = gv('f_pino') || '—';
  const date  = gv('f_date') ? fmtDate(gv('f_date')) : '—';
  const buyer = gv('f_buy_name') || gv('f_exp_name') || '—';

  [[2,'s2'],[3,'s3']].forEach(([,p]) => {
    setText(`${p}_pino`,  pino);
    setText(`${p}_date`,  date);
    setText(`${p}_buyer`, buyer);
  });
}

// ── Product Rows ──────────────────────────────────────────────
function addRow() {
  rowCount++;
  const id = rowCount;
  const tbody = document.getElementById('productBody');
  const tr = document.createElement('tr');
  tr.id = `prow_${id}`;
  tr.innerHTML = `
    <td style="display:flex;align-items:center;gap:0.3rem;">
      <button class="pi-prod-pick-btn" onclick="openPiProductPicker(${id})" title="Pick from Product Master" style="width:26px;height:26px;border-radius:6px;background:var(--navy);color:#fff;border:none;cursor:pointer;font-size:0.75rem;flex-shrink:0;display:flex;align-items:center;justify-content:center;">📦</button>
      <input type="text" class="pi-ci" id="r_desc_${id}" placeholder="Product description" oninput="" style="flex:1;min-width:0;"/>
    </td>
    <td><input type="text"   class="pi-ci pi-ci-num" id="r_hs_${id}"   placeholder="HS Code"/></td>
    <td><input type="number" class="pi-ci pi-ci-num" id="r_qty_${id}"  placeholder="0" step="0.01" min="0" oninput="calcRow(${id})"/></td>
    <td><input type="number" class="pi-ci pi-ci-num" id="r_box_${id}"  placeholder="0" step="1"    min="0" oninput="calcTotals()"/></td>
    <td><input type="number" class="pi-ci pi-ci-num" id="r_rate_${id}" placeholder="0.00" step="0.01" min="0" oninput="calcRow(${id})"/></td>
    <td><span class="pi-ci-amt" id="r_amt_${id}">0.00</span></td>
    <td><button class="pi-del-btn" onclick="delRow(${id})">✕</button></td>`;
  tbody.appendChild(tr);

  // Attach autocomplete to desc and hs fields
  attachPiProductAC(id);
}

function delRow(id) {
  const rows = document.getElementById('productBody').querySelectorAll('tr');
  if (rows.length <= 1) { showToast('⚠️', 'At least one product row is required.'); return; }
  document.getElementById(`prow_${id}`)?.remove();
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
  let totalQty = 0, totalBox = 0, totalAmt = 0;

  rows.forEach(tr => {
    const id = tr.id.replace('prow_','');
    totalQty += parseFloat(document.getElementById(`r_qty_${id}`)?.value) || 0;
    totalBox += parseFloat(document.getElementById(`r_box_${id}`)?.value) || 0;
    const amtEl = document.getElementById(`r_amt_${id}`);
    totalAmt += parseFloat(amtEl?.textContent?.replace(/,/g,'')) || 0;
  });

  setText('tot_qty',  fmtNum(totalQty));
  setText('tot_box',  fmtNum(totalBox));
  setText('tot_amt',  fmtAmt(totalAmt));
  setText('amt_words', numToWords(totalAmt));
}

function updateSummaryCard() {
  calcTotals();
  setText('sum_qty',   document.getElementById('tot_qty')?.textContent || '0');
  setText('sum_box',   document.getElementById('tot_box')?.textContent || '0');
  setText('sum_amt',   document.getElementById('tot_amt')?.textContent || '0.00');
  setText('sum_wt',    gv('f_netgross_wt') || '—');
  setText('sum_cbm',   gv('f_total_cbm')   || '—');
  setText('sum_words', document.getElementById('amt_words')?.textContent || '—');
}

// ── Number to Words ───────────────────────────────────────────
function numToWords(n) {
  if (!n || n === 0) return 'Zero';
  const ones = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine',
    'Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
  const tens = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];

  function convert(num) {
    if (num === 0) return '';
    if (num < 20) return ones[num] + ' ';
    if (num < 100) return tens[Math.floor(num/10)] + (num%10 ? ' '+ones[num%10] : '') + ' ';
    if (num < 1000) return ones[Math.floor(num/100)] + ' Hundred ' + convert(num%100);
    if (num < 100000) return convert(Math.floor(num/1000)) + 'Thousand ' + convert(num%1000);
    if (num < 10000000) return convert(Math.floor(num/100000)) + 'Lakh ' + convert(num%100000);
    return convert(Math.floor(num/10000000)) + 'Crore ' + convert(num%10000000);
  }

  const intPart  = Math.floor(n);
  const decPart  = Math.round((n - intPart) * 100);
  let result = convert(intPart).trim();
  if (decPart > 0) result += ' and ' + convert(decPart).trim() + ' Cents';
  return result + ' Only';
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

// ── Collect Row Data ──────────────────────────────────────────
function collectRows() {
  const tbody = document.getElementById('productBody');
  const rows  = tbody.querySelectorAll('tr');
  const data  = [];
  rows.forEach(tr => {
    const id = tr.id.replace('prow_','');
    data.push({
      desc: document.getElementById(`r_desc_${id}`)?.value || '',
      hs:   document.getElementById(`r_hs_${id}`)?.value   || '',
      qty:  parseFloat(document.getElementById(`r_qty_${id}`)?.value)  || 0,
      box:  parseFloat(document.getElementById(`r_box_${id}`)?.value)  || 0,
      rate: parseFloat(document.getElementById(`r_rate_${id}`)?.value) || 0,
      amt:  document.getElementById(`r_amt_${id}`)?.textContent || '0.00',
    });
  });
  return data.filter(r => r.desc || r.qty || r.rate);
}

// ── New / Clear ───────────────────────────────────────────────
function newEntry() {
  clearForm();
  editingId = null;
  setText('formTitle', 'New Proforma Invoice');
  goToStep(1);
  document.querySelectorAll('.pl-card').forEach(c => c.classList.remove('active'));
}

function clearForm() {
  const fields = [
    'f_pino','f_date',
    'f_exp_name','f_exp_addr1','f_exp_addr2','f_exp_addr3',
    'f_buy_name','f_buy_addr1','f_buy_addr2','f_buy_addr3',
    'f_country_origin','f_country_dest','f_pol','f_pod',
    'f_precarriage','f_vessel','f_incoterms','f_final_dest',
    'f_payment_terms','f_delivery_terms','f_transhipment',
    'f_partial_shipment','f_lead_time','f_validity',
    'f_netgross_wt','f_total_cbm','f_remarks','f_preparedby','f_signatory'
  ];
  fields.forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  setTodayDate();
  autoSetPiNo();

  // Reset product rows
  document.getElementById('productBody').innerHTML = '';
  rowCount = 0;
  addRow(); addRow(); addRow();
  calcTotals();
}

// ── Save ──────────────────────────────────────────────────────
function saveRecord() {
  const pino = gv('f_pino');
  const date = gv('f_date');
  if (!pino) { showToast('⚠️','Please enter PI No.'); goToStep(1); return; }
  if (!date) { showToast('⚠️','Please select Date.'); goToStep(1); return; }

  calcTotals();
  const rows = collectRows();

  const rec = {
    id: editingId ?? Date.now(),
    pino, date,
    exp_name:  gv('f_exp_name'),  exp_addr1: gv('f_exp_addr1'),
    exp_addr2: gv('f_exp_addr2'), exp_addr3: gv('f_exp_addr3'),
    buy_name:  gv('f_buy_name'),  buy_addr1: gv('f_buy_addr1'),
    buy_addr2: gv('f_buy_addr2'), buy_addr3: gv('f_buy_addr3'),
    country_origin: gv('f_country_origin'), country_dest: gv('f_country_dest'),
    pol: gv('f_pol'), pod: gv('f_pod'),
    precarriage: gv('f_precarriage'), vessel: gv('f_vessel'),
    incoterms: gv('f_incoterms'), final_dest: gv('f_final_dest'),
    payment_terms: gv('f_payment_terms'), delivery_terms: gv('f_delivery_terms'),
    transhipment: gv('f_transhipment'), partial_shipment: gv('f_partial_shipment'),
    lead_time: gv('f_lead_time'), validity: gv('f_validity'),
    netgross_wt: gv('f_netgross_wt'), total_cbm: gv('f_total_cbm'),
    remarks: gv('f_remarks'), preparedby: gv('f_preparedby'), signatory: gv('f_signatory'),
    rows,
    tot_qty:   document.getElementById('tot_qty')?.textContent || '0',
    tot_box:   document.getElementById('tot_box')?.textContent || '0',
    tot_amt:   document.getElementById('tot_amt')?.textContent || '0.00',
    amt_words: document.getElementById('amt_words')?.textContent || '',
  };

  if (editingId !== null) {
    const idx = piRecords.findIndex(r => r.id === editingId);
    if (idx > -1) piRecords[idx] = rec; else piRecords.unshift(rec);
  } else {
    piRecords.unshift(rec);
  }

  localStorage.setItem('pi_records', JSON.stringify(piRecords));
  renderRecords();
  showToast('✅', `PI ${pino} saved!`);
  editingId = rec.id;
  setText('formTitle', `Editing: ${pino}`);
}

// ── Edit ──────────────────────────────────────────────────────
function editRecord(id) {
  const rec = piRecords.find(r => r.id === id);
  if (!rec) return;
  editingId = id;
  setText('formTitle', `Editing: ${rec.pino}`);

  const sv = (elId, v) => { const el = document.getElementById(elId); if (el) el.value = v || ''; };
  sv('f_pino', rec.pino); sv('f_date', rec.date);
  sv('f_exp_name', rec.exp_name); sv('f_exp_addr1', rec.exp_addr1);
  sv('f_exp_addr2', rec.exp_addr2); sv('f_exp_addr3', rec.exp_addr3);
  sv('f_buy_name', rec.buy_name); sv('f_buy_addr1', rec.buy_addr1);
  sv('f_buy_addr2', rec.buy_addr2); sv('f_buy_addr3', rec.buy_addr3);
  sv('f_country_origin', rec.country_origin); sv('f_country_dest', rec.country_dest);
  sv('f_pol', rec.pol); sv('f_pod', rec.pod);
  sv('f_precarriage', rec.precarriage); sv('f_vessel', rec.vessel);
  sv('f_incoterms', rec.incoterms); sv('f_final_dest', rec.final_dest);
  sv('f_payment_terms', rec.payment_terms); sv('f_delivery_terms', rec.delivery_terms);
  sv('f_transhipment', rec.transhipment); sv('f_partial_shipment', rec.partial_shipment);
  sv('f_lead_time', rec.lead_time); sv('f_validity', rec.validity);
  sv('f_netgross_wt', rec.netgross_wt); sv('f_total_cbm', rec.total_cbm);
  sv('f_remarks', rec.remarks); sv('f_preparedby', rec.preparedby);
  sv('f_signatory', rec.signatory);

  // Restore rows
  document.getElementById('productBody').innerHTML = '';
  rowCount = 0;
  if (rec.rows && rec.rows.length > 0) {
    rec.rows.forEach(row => {
      addRow();
      const id2 = rowCount;
      const sv2 = (k, v) => { const el = document.getElementById(`r_${k}_${id2}`); if (el) el.value = v || ''; };
      sv2('desc', row.desc); sv2('hs', row.hs);
      sv2('qty',  row.qty);  sv2('box', row.box); sv2('rate', row.rate);
      calcRow(id2);
    });
  } else {
    addRow(); addRow(); addRow();
  }
  calcTotals();

  document.querySelectorAll('.pl-card').forEach(c => c.classList.remove('active'));
  document.getElementById(`picard_${id}`)?.classList.add('active');
  goToStep(1);
}

// ── Delete ────────────────────────────────────────────────────
function deleteRecord(id) {
  if (!confirm('Delete this Proforma Invoice record?')) return;
  piRecords = piRecords.filter(r => r.id !== id);
  localStorage.setItem('pi_records', JSON.stringify(piRecords));
  if (editingId === id) newEntry();
  renderRecords();
  showToast('🗑','Record deleted.');
}

// ── Render List ───────────────────────────────────────────────
function renderRecords(data = null) {
  const list  = document.getElementById('recordsList');
  const items = data || piRecords;
  if (items.length === 0) {
    list.innerHTML = `
      <div class="pl-empty">
        <div style="font-size:1.6rem;opacity:0.35;">📄</div>
        <div class="pl-empty-txt">No records yet</div>
        <div class="pl-empty-sub">Click + New to begin</div>
      </div>`;
    return;
  }
  list.innerHTML = items.map(rec => `
    <div class="pl-card ${editingId===rec.id?'active':''}" id="picard_${rec.id}" onclick="editRecord(${rec.id})">
      <div class="pl-card-no">${rec.pino}</div>
      <div class="pl-card-buyer">${rec.buy_name || rec.exp_name || '—'}</div>
      <div class="pl-card-row">
        <span class="pl-card-date">${fmtDate(rec.date)}</span>
        <span class="pl-card-val">${rec.tot_amt || '0.00'}</span>
      </div>
      <div class="pl-card-acts">
        <button class="pl-act edit" onclick="event.stopPropagation();editRecord(${rec.id})">✏️ Edit</button>
        <button class="pl-act prnt" onclick="event.stopPropagation();printById(${rec.id})">🖨 Print</button>
        <button class="pl-act del"  onclick="event.stopPropagation();deleteRecord(${rec.id})">🗑</button>
      </div>
    </div>`).join('');
}

function filterRecords() {
  const q = document.getElementById('searchInput')?.value.toLowerCase() || '';
  if (!q) { renderRecords(); return; }
  renderRecords(piRecords.filter(r =>
    r.pino?.toLowerCase().includes(q) ||
    r.buy_name?.toLowerCase().includes(q) ||
    r.exp_name?.toLowerCase().includes(q)
  ));
}

// ── Print ─────────────────────────────────────────────────────
function printRecord() {
  calcTotals();
  const rows = collectRows();
  doPrint({
    pino: gv('f_pino'), date: gv('f_date'),
    exp_name: gv('f_exp_name'), exp_addr1: gv('f_exp_addr1'),
    exp_addr2: gv('f_exp_addr2'), exp_addr3: gv('f_exp_addr3'),
    buy_name: gv('f_buy_name'), buy_addr1: gv('f_buy_addr1'),
    buy_addr2: gv('f_buy_addr2'), buy_addr3: gv('f_buy_addr3'),
    country_origin: gv('f_country_origin'), country_dest: gv('f_country_dest'),
    pol: gv('f_pol'), pod: gv('f_pod'),
    precarriage: gv('f_precarriage'), vessel: gv('f_vessel'),
    incoterms: gv('f_incoterms'), final_dest: gv('f_final_dest'),
    payment_terms: gv('f_payment_terms'), delivery_terms: gv('f_delivery_terms'),
    transhipment: gv('f_transhipment'), partial_shipment: gv('f_partial_shipment'),
    lead_time: gv('f_lead_time'), validity: gv('f_validity'),
    netgross_wt: gv('f_netgross_wt'), total_cbm: gv('f_total_cbm'),
    remarks: gv('f_remarks'), preparedby: gv('f_preparedby'), signatory: gv('f_signatory'),
    rows,
    tot_qty:   document.getElementById('tot_qty')?.textContent || '0',
    tot_box:   document.getElementById('tot_box')?.textContent || '0',
    tot_amt:   document.getElementById('tot_amt')?.textContent || '0.00',
    amt_words: document.getElementById('amt_words')?.textContent || '',
  });
}

function printById(id) {
  const rec = piRecords.find(r => r.id === id);
  if (rec) doPrint(rec);
}

function doPrint(rec) {
  const client = sess?.clientCode || 'Demo001';

  const productRows = (rec.rows || []).map(r => `
    <tr>
      <td class="desc-td">${r.desc||''}</td>
      <td>${r.hs||''}</td>
      <td>${r.qty||''}</td>
      <td>${r.box||''}</td>
      <td>${r.rate ? fmtAmt(r.rate) : ''}</td>
      <td>${r.amt||''}</td>
    </tr>`).join('');

  // Pad to at least 10 rows for clean look
  const emptyRows = Math.max(0, 10 - (rec.rows||[]).length);
  const padRows   = Array(emptyRows).fill('<tr><td>&nbsp;</td><td></td><td></td><td></td><td></td><td></td></tr>').join('');

  const shipItems = [
    ['Country of Origin', rec.country_origin],
    ['Country of Final Destination', rec.country_dest],
    ['Port of Loading', rec.pol],
    ['Port of Discharge', rec.pod],
    ['Pre-carriage By', rec.precarriage],
    ['Vessel / Flight No.', rec.vessel],
    ['IncoTerms', rec.incoterms],
    ['Final Destination', rec.final_dest],
    ['Payment Terms', rec.payment_terms],
    ['Delivery Terms', rec.delivery_terms],
    ['Transhipment', rec.transhipment],
    ['Partial Shipment', rec.partial_shipment],
    ['Lead Delivery Time', rec.lead_time],
    ['Validity P.I.', rec.validity],
  ].filter(([,v]) => v);

  const shipHTML = shipItems.map(([l,v]) => `
    <div class="pp-ship-item">
      <div class="pp-ship-lbl">${l}</div>
      <div class="pp-ship-val">${v}</div>
    </div>`).join('');

  document.getElementById('printArea').innerHTML = `
  <div class="pp-doc">
    <div class="pp-hdr">
      <div class="pp-hdr-title">IMPEXIO &mdash; PROFORMA INVOICE</div>
    </div>
    <div class="pp-teal-bar"></div>

    <div class="pp-meta-row">
      <div class="pp-meta-item"><span class="pp-meta-lbl">PI No:&nbsp;</span><span class="pp-meta-val">${rec.pino||''}</span></div>
      <div class="pp-meta-item"><span class="pp-meta-lbl">Date:&nbsp;</span><span class="pp-meta-val">${fmtDate(rec.date)}</span></div>
    </div>

    <div class="pp-parties">
      <div class="pp-party">
        <div class="pp-party-hd">Exporter / Seller</div>
        <div class="pp-party-body">
          ${[rec.exp_name, rec.exp_addr1, rec.exp_addr2, rec.exp_addr3].filter(Boolean).join('<br/>')||'&nbsp;'}
        </div>
      </div>
      <div class="pp-party">
        <div class="pp-party-hd">Buyer / Importer / Consignee</div>
        <div class="pp-party-body">
          ${[rec.buy_name, rec.buy_addr1, rec.buy_addr2, rec.buy_addr3].filter(Boolean).join('<br/>')||'&nbsp;'}
        </div>
      </div>
    </div>

    ${shipItems.length > 0 ? `<div class="pp-ship">${shipHTML}</div>` : ''}

    <table class="pp-tbl">
      <thead>
        <tr>
          <th class="desc-th">Product Description</th>
          <th>HS Code</th>
          <th>Qty</th>
          <th>Boxes</th>
          <th>Rate</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
        ${productRows}
        ${padRows}
        <tr class="pp-tot-row">
          <td colspan="2" style="text-align:right;font-size:8pt;letter-spacing:0.1em;">TOTAL</td>
          <td>${rec.tot_qty||'0'}</td>
          <td>${rec.tot_box||'0'}</td>
          <td></td>
          <td class="gold-cell">${rec.tot_amt||'0.00'}</td>
        </tr>
        <tr class="pp-words-row">
          <td colspan="2" style="font-size:7pt;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;">Amount in Words:</td>
          <td colspan="4" style="font-style:italic;">${rec.amt_words||'—'}</td>
        </tr>
        <tr class="pp-wt-row">
          <td style="font-weight:700;font-size:7.5pt;">Net/Gross Wt:</td>
          <td colspan="2">${rec.netgross_wt||''}</td>
          <td style="font-weight:700;font-size:7.5pt;">Total CBM:</td>
          <td colspan="2">${rec.total_cbm||''}</td>
        </tr>
      </tbody>
    </table>

    ${rec.remarks ? `<div style="font-size:7pt;font-weight:700;background:#0f2540;color:#fff;padding:3px 7px;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:0;">Remarks:</div><div class="pp-remarks">${rec.remarks}</div>` : ''}

    <div class="pp-sigs">
      <div class="pp-sig"><div class="pp-sig-line">Prepared By: ${rec.preparedby||'__________________'}</div></div>
      <div class="pp-sig"><div class="pp-sig-line">For IMPEXIO / Authorised Signatory: ${rec.signatory||'__________________'}</div></div>
    </div>

    <div class="pp-bottom-bar"></div>
    <div class="pp-footer">IMPEXIO | Export-Import Document Portal | Client: ${client} | Export Proforma Invoice | Printed: ${new Date().toLocaleString('en-IN')}</div>
  </div>`;

  window.print();
}

// ── Toast ─────────────────────────────────────────────────────
function showToast(icon, msg) {
  let t = document.getElementById('pi-toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'pi-toast';
    t.style.cssText = `position:fixed;bottom:1.5rem;right:1.5rem;background:var(--navy);color:#fff;padding:0.7rem 1.2rem;border-radius:10px;font-size:0.82rem;font-weight:600;display:flex;gap:0.5rem;align-items:center;box-shadow:0 8px 24px rgba(15,37,64,0.3);z-index:9999;opacity:0;transition:opacity 0.3s;pointer-events:none;border-left:3px solid var(--gold);`;
    document.body.appendChild(t);
  }
  t.innerHTML = `<span>${icon}</span><span>${msg}</span>`;
  t.style.opacity = '1';
  clearTimeout(t._t);
  t._t = setTimeout(() => { t.style.opacity = '0'; }, 3000);
}

// ══════════════════════════════════════════════════════════════
//  PI MASTER DATA SYSTEM
//  Masters: Exporter, Buyer, Port, Incoterms, Payment Terms, Signatory
//  + Autocomplete dropdown on field click
// ══════════════════════════════════════════════════════════════

const PI_MASTER_CONFIG = {
  exporter: {
    label:'Exporter', icon:'🏭', key:'impexio_master_exporter',
    fields:[
      {id:'name',    label:'Exporter Name',   placeholder:'e.g. Impexio Trade Solutions Pvt. Ltd.', req:true},
      {id:'addr1',   label:'Address Line 1',  placeholder:'Building / Street'},
      {id:'addr2',   label:'Address Line 2',  placeholder:'City, State, PIN'},
      {id:'addr3',   label:'Address Line 3',  placeholder:'Country'},
      {id:'gst',     label:'GST Number',      placeholder:'24AABCI1234A1Z5'},
      {id:'contact', label:'Contact',         placeholder:'+91 98765 43210'},
    ],
    display: r => r.name,
    sub:     r => [r.addr2, r.addr3].filter(Boolean).join(', '),
    fill:    (r, tid) => {
      const s = id => { const el=document.getElementById(id); if(el){el.value=r[id.replace('f_exp_','')]||'';el.dispatchEvent(new Event('input'));} };
      const el = document.getElementById(tid); if(el){el.value=r.name||'';el.dispatchEvent(new Event('input'));}
      ['f_exp_addr1','f_exp_addr2','f_exp_addr3'].forEach(fid => {
        const key = fid.replace('f_exp_',''); const el2=document.getElementById(fid);
        if(el2){el2.value=r[key]||'';el2.dispatchEvent(new Event('input'));}
      });
    }
  },
  buyer: {
    label:'Buyer', icon:'🌍', key:'impexio_master_buyer',
    fields:[
      {id:'name',    label:'Buyer Name',      placeholder:'e.g. Global Traders LLC', req:true},
      {id:'addr1',   label:'Address Line 1',  placeholder:'Building / Street'},
      {id:'addr2',   label:'Address Line 2',  placeholder:'City, State, ZIP'},
      {id:'addr3',   label:'Country',         placeholder:'e.g. United Arab Emirates'},
      {id:'contact', label:'Contact',         placeholder:'Phone / Email'},
    ],
    display: r => r.name,
    sub:     r => [r.addr2, r.addr3].filter(Boolean).join(', '),
    fill:    (r, tid) => {
      const el = document.getElementById(tid); if(el){el.value=r.name||'';el.dispatchEvent(new Event('input'));}
      ['f_buy_addr1','f_buy_addr2','f_buy_addr3'].forEach(fid => {
        const key = fid.replace('f_buy_',''); const el2=document.getElementById(fid);
        if(el2){el2.value=r[key]||'';el2.dispatchEvent(new Event('input'));}
      });
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
      {id:'term', label:'Incoterm',     placeholder:'e.g. FOB / CIF / EXW', req:true},
      {id:'desc', label:'Description',  placeholder:'e.g. Free On Board — Port of Loading'},
    ],
    display: r => r.term,
    sub:     r => r.desc || '',
    fill:    (r, tid) => { const el=document.getElementById(tid); if(el){el.value=r.term;el.dispatchEvent(new Event('input'));} }
  },
  payterms: {
    label:'Payment Terms', icon:'💳', key:'impexio_master_payterms',
    fields:[
      {id:'term', label:'Payment Term',  placeholder:'e.g. 30% Advance, 70% against BL', req:true},
      {id:'note', label:'Note',          placeholder:'Additional note'},
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
  },
  product: {
    label:'Product', icon:'📦', key:'impexio_master_product',
    fields:[
      {id:'name',   label:'Product Name',        placeholder:'e.g. Ceramic Floor Tiles', req:true},
      {id:'hscode', label:'HS Code',              placeholder:'e.g. 6907.21'},
      {id:'unit',   label:'Unit',                 placeholder:'e.g. PCS / KGS / MTR'},
      {id:'rate',   label:'Default Rate (USD)',   placeholder:'e.g. 12.50'},
      {id:'desc',   label:'Additional Details',   placeholder:'Grade, finish, size etc.'},
    ],
    display: r => r.name,
    sub:     r => [r.hscode ? 'HS: '+r.hscode : '', r.unit].filter(Boolean).join(' · '),
    fill:    (r, rowId) => {
      // rowId is the product row number — fill desc, hs, rate
      const dEl = document.getElementById('r_desc_' + rowId);
      const hEl = document.getElementById('r_hs_'   + rowId);
      const rEl = document.getElementById('r_rate_' + rowId);
      if (dEl) { dEl.value = r.name || ''; dEl.dispatchEvent(new Event('input')); }
      if (hEl) { hEl.value = r.hscode || ''; }
      if (rEl && r.rate) { rEl.value = r.rate; rEl.dispatchEvent(new Event('input')); calcRow(rowId); }
    }
  }
};

// ── Storage ───────────────────────────────────────────────────
function getPiMaster(type) {
  try { return JSON.parse(localStorage.getItem(PI_MASTER_CONFIG[type].key)||'[]'); } catch { return []; }
}
function setPiMaster(type, data) {
  localStorage.setItem(PI_MASTER_CONFIG[type].key, JSON.stringify(data));
}

// ── State ─────────────────────────────────────────────────────
let piMasterPickTarget = null;
let piMasterEditType   = null;
let piMasterEditIdx    = null;

// ── Open / Close ──────────────────────────────────────────────
function openPiMaster(tab, targetFieldId) {
  piMasterPickTarget = targetFieldId || null;
  document.getElementById('piMasterOverlay').classList.add('open');
  document.getElementById('piMasterPanel').classList.add('open');
  switchPiMasterTab(tab || 'exporter');
}
function closePiMaster() {
  document.getElementById('piMasterOverlay').classList.remove('open');
  document.getElementById('piMasterPanel').classList.remove('open');
  piMasterPickTarget = null;
}

// ── Tab switch ────────────────────────────────────────────────
function switchPiMasterTab(type) {
  document.querySelectorAll('.pi-master-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.pi-master-sect').forEach(s => s.classList.remove('active'));
  const tab = document.getElementById('pimt-' + type);
  const sec = document.getElementById('pims-' + type);
  if (tab) tab.classList.add('active');
  if (sec) sec.classList.add('active');
  const cfg = PI_MASTER_CONFIG[type];
  document.getElementById('piMasterTitle').textContent = cfg.icon + ' ' + cfg.label + ' Master';
  renderPiMasterList(type);
}

// ── Render list ───────────────────────────────────────────────
function renderPiMasterList(type) {
  const cfg    = PI_MASTER_CONFIG[type];
  const data   = getPiMaster(type);
  const listEl = document.getElementById('piml-' + type);
  if (!listEl) return;
  if (!data.length) {
    listEl.innerHTML = `<div class="pi-master-empty"><div class="pi-master-empty-icon">${cfg.icon}</div><div class="pi-master-empty-txt">No ${cfg.label} records yet</div><div class="pi-master-empty-sub">Click "+ Add ${cfg.label}" to create your first record</div></div>`;
    return;
  }
  listEl.innerHTML = data.map((r, i) => `
    <div class="pi-master-item" onclick="pickPiMasterRecord('${type}',${i})">
      <div class="pi-master-item-icon">${cfg.icon}</div>
      <div style="flex:1;min-width:0;"><div class="pi-master-item-name">${cfg.display(r)}</div><div class="pi-master-item-sub">${cfg.sub(r)}</div></div>
      <div class="pi-master-item-acts" onclick="event.stopPropagation()">
        <button class="pi-mi-btn use"  onclick="pickPiMasterRecord('${type}',${i})">↗ Use</button>
        <button class="pi-mi-btn edit" onclick="openPiMasterForm('${type}',${i})">✏️</button>
        <button class="pi-mi-btn del"  onclick="deletePiMaster('${type}',${i})">🗑</button>
      </div>
    </div>`).join('');
}

// ── Pick record ───────────────────────────────────────────────
function pickPiMasterRecord(type, idx) {
  const cfg  = PI_MASTER_CONFIG[type];
  const data = getPiMaster(type);
  const r    = data[idx]; if (!r) return;
  if (piMasterPickTarget) {
    cfg.fill(r, piMasterPickTarget);
    showToast('✅', cfg.label + ' selected: ' + cfg.display(r));
    closePiMaster();
  }
}

// ── Add / Edit form ───────────────────────────────────────────
function openPiMasterForm(type, idx) {
  piMasterEditType = type;
  piMasterEditIdx  = (idx !== undefined && idx !== null) ? idx : null;
  const cfg  = PI_MASTER_CONFIG[type];
  const data = getPiMaster(type);
  const rec  = piMasterEditIdx !== null ? data[piMasterEditIdx] : null;
  document.getElementById('piMfTitle').textContent = rec ? `✏️ Edit ${cfg.label}` : `+ Add ${cfg.label}`;
  document.getElementById('piMfBody').innerHTML = cfg.fields.map(f => `
    <div class="pi-mf-fg">
      <label class="pi-mf-lbl">${f.label}${f.req?' *':''}</label>
      <input class="pi-mf-inp" id="pimf_${f.id}" type="text" placeholder="${f.placeholder}" value="${rec?(rec[f.id]||''):''}"/>
    </div>`).join('');
  document.getElementById('piMfOverlay').classList.add('open');
  setTimeout(() => { const first=document.querySelector('#piMfBody .pi-mf-inp'); if(first) first.focus(); }, 100);
}
function closePiMasterForm() {
  document.getElementById('piMfOverlay').classList.remove('open');
  piMasterEditType = null; piMasterEditIdx = null;
}
function savePiMasterRecord() {
  const type = piMasterEditType; if (!type) return;
  const cfg  = PI_MASTER_CONFIG[type];
  const data = getPiMaster(type);
  const rec  = {}; let valid = true;
  cfg.fields.forEach(f => {
    const el = document.getElementById('pimf_' + f.id);
    if (el) rec[f.id] = el.value.trim();
    if (f.req && !rec[f.id]) { valid=false; el?.classList.add('err'); } else el?.classList.remove('err');
  });
  if (!valid) { showToast('⚠️','Please fill all required fields!'); return; }
  if (piMasterEditIdx !== null) { data[piMasterEditIdx]=rec; } else { data.push(rec); }
  setPiMaster(type, data);
  closePiMasterForm();
  renderPiMasterList(type);
  showToast('✅', cfg.label + ' saved!');
}
function deletePiMaster(type, idx) {
  const cfg = PI_MASTER_CONFIG[type];
  if (!confirm('Delete this ' + cfg.label + ' record?')) return;
  const data = getPiMaster(type); data.splice(idx,1);
  setPiMaster(type, data); renderPiMasterList(type);
  showToast('🗑', cfg.label + ' deleted.');
}

// ══════════════════════════════════════════════════════════════
//  AUTOCOMPLETE DROPDOWN
// ══════════════════════════════════════════════════════════════
const PI_FIELD_MAP = {
  'f_exp_name':      { type:'exporter',  display:r=>r.name, sub:r=>[r.addr2,r.addr3].filter(Boolean).join(', ') },
  'f_buy_name':      { type:'buyer',     display:r=>r.name, sub:r=>[r.addr2,r.addr3].filter(Boolean).join(', ') },
  'f_pol':           { type:'port',      display:r=>r.name, sub:r=>[r.code,r.state].filter(Boolean).join(' · ') },
  'f_pod':           { type:'port',      display:r=>r.name, sub:r=>[r.code,r.state].filter(Boolean).join(' · ') },
  'f_incoterms':     { type:'incoterms', display:r=>r.term, sub:r=>r.desc||'' },
  'f_payment_terms': { type:'payterms',  display:r=>r.term, sub:r=>r.note||'' },
  'f_preparedby':    { type:'signatory', display:r=>r.name, sub:r=>r.designation||'' },
  'f_signatory':     { type:'signatory', display:r=>r.name, sub:r=>r.designation||'' },
};

const piAcDrop = document.getElementById('piAcDropdown');
let piAcField  = null;

function posPiAC(el) {
  const r = el.getBoundingClientRect();
  piAcDrop.style.left  = r.left + 'px';
  piAcDrop.style.top   = (r.bottom + 4) + 'px';
  piAcDrop.style.width = Math.max(r.width, 260) + 'px';
}

function renderPiAC(fieldId, query) {
  const map  = PI_FIELD_MAP[fieldId]; if (!map) return closePiAC();
  const data = getPiMaster(map.type);  if (!data.length) return closePiAC();
  const q    = (query||'').toLowerCase().trim();
  const filtered = q ? data.filter(r => map.display(r).toLowerCase().includes(q)) : data;
  if (!filtered.length) return closePiAC();
  const cfg = PI_MASTER_CONFIG[map.type];
  piAcDrop.innerHTML = `
    <div style="padding:0.45rem 0.75rem;font-size:0.62rem;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#6b7fa3;border-bottom:1px solid #eef1f8;display:flex;align-items:center;justify-content:space-between;">
      <span>${cfg.icon} Saved ${cfg.label}</span><span style="color:#9aadcc;">${filtered.length} found</span>
    </div>
    ${filtered.map(r => {
      const idx=data.indexOf(r); const sub=map.sub(r);
      return `<div class="pi-ac-item" onmousedown="event.preventDefault();pickPiAC('${fieldId}',${idx})"
        style="padding:0.6rem 0.85rem;cursor:pointer;border-bottom:1px solid #f4f3ee;display:flex;align-items:center;gap:0.65rem;transition:background 0.15s;">
        <div style="width:28px;height:28px;border-radius:7px;background:#f0f2f8;display:flex;align-items:center;justify-content:center;font-size:0.85rem;flex-shrink:0;">${cfg.icon}</div>
        <div style="flex:1;min-width:0;">
          <div style="font-size:0.82rem;font-weight:600;color:#0f2540;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${map.display(r)}</div>
          ${sub?`<div style="font-size:0.68rem;color:#6b7fa3;margin-top:0.1rem;">${sub}</div>`:''}
        </div>
        <div style="font-size:0.65rem;color:#c9a84c;font-weight:700;flex-shrink:0;">↗ Use</div>
      </div>`;
    }).join('')}`;
  piAcDrop.querySelectorAll('.pi-ac-item').forEach(el => {
    el.addEventListener('mouseover', () => el.style.background='#f4f3ee');
    el.addEventListener('mouseout',  () => el.style.background='');
  });
  piAcDrop.style.display = 'block';
  posPiAC(document.getElementById(fieldId));
}

function pickPiAC(fieldId, idx) {
  const map  = PI_FIELD_MAP[fieldId]; if (!map) return;
  const data = getPiMaster(map.type); const r=data[idx]; if (!r) return;
  PI_MASTER_CONFIG[map.type].fill(r, fieldId);
  closePiAC();
  showToast('✅', map.display(r) + ' selected');
}
function closePiAC() { piAcDrop.style.display='none'; piAcField=null; }

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    Object.keys(PI_FIELD_MAP).forEach(fieldId => {
      const el = document.getElementById(fieldId); if (!el) return;
      el.addEventListener('focus', () => { piAcField=fieldId; renderPiAC(fieldId, el.value); });
      el.addEventListener('click', () => { piAcField=fieldId; renderPiAC(fieldId, el.value); });
      el.addEventListener('input', () => { if(piAcField===fieldId) renderPiAC(fieldId, el.value); });
      el.addEventListener('keydown', e => {
        if (e.key==='Escape') { closePiAC(); return; }
        if (piAcDrop.style.display==='none') return;
        const items=piAcDrop.querySelectorAll('.pi-ac-item');
        const active=piAcDrop.querySelector('.pi-ac-item.ac-active');
        let idx=-1; items.forEach((it,i)=>{ if(it===active) idx=i; });
        if (e.key==='ArrowDown') { e.preventDefault(); const next=idx<items.length-1?idx+1:0; items.forEach(i=>{i.classList.remove('ac-active');i.style.background='';}); items[next].classList.add('ac-active'); items[next].style.background='#f4f3ee'; items[next].scrollIntoView({block:'nearest'}); }
        if (e.key==='ArrowUp')   { e.preventDefault(); const prev=idx>0?idx-1:items.length-1; items.forEach(i=>{i.classList.remove('ac-active');i.style.background='';}); items[prev].classList.add('ac-active'); items[prev].style.background='#f4f3ee'; items[prev].scrollIntoView({block:'nearest'}); }
        if (e.key==='Enter' && active) { e.preventDefault(); active.dispatchEvent(new MouseEvent('mousedown')); }
      });
    });
    document.addEventListener('click', e => {
      if (!piAcDrop.contains(e.target) && !Object.keys(PI_FIELD_MAP).some(id => document.getElementById(id)===e.target)) closePiAC();
    });
    window.addEventListener('scroll', () => { if(piAcField && piAcDrop.style.display!=='none') posPiAC(document.getElementById(piAcField)); }, true);
  }, 300);
});


// ══════════════════════════════════════════════════════════════
//  PRODUCT ROW PICKER & AUTOCOMPLETE
// ══════════════════════════════════════════════════════════════

// ── Open product picker for a specific row ───────────────────
let piProductPickRowId = null;

function openPiProductPicker(rowId) {
  piProductPickRowId  = rowId;
  piMasterPickTarget  = rowId; // reuse pick target as rowId
  openPiMaster('product', rowId);
}

// ── Override pickPiMasterRecord for product type ─────────────
const _origPickPiMasterRecord = pickPiMasterRecord;
pickPiMasterRecord = function(type, idx) {
  if (type === 'product') {
    const data = getPiMaster('product');
    const r    = data[idx]; if (!r) return;
    const rowId = piMasterPickTarget;
    if (rowId !== null && rowId !== undefined) {
      PI_MASTER_CONFIG.product.fill(r, rowId);
      showToast('📦', r.name + ' selected');
      closePiMaster();
    }
    return;
  }
  _origPickPiMasterRecord(type, idx);
};

// ── Attach autocomplete to desc field of a row ───────────────
function attachPiProductAC(rowId) {
  setTimeout(() => {
    const descEl = document.getElementById('r_desc_' + rowId);
    if (!descEl) return;

    descEl.addEventListener('focus', () => renderPiRowAC(rowId, descEl.value));
    descEl.addEventListener('click', () => renderPiRowAC(rowId, descEl.value));
    descEl.addEventListener('input', () => renderPiRowAC(rowId, descEl.value));
    descEl.addEventListener('keydown', e => {
      if (e.key === 'Escape') { closePiRowAC(); return; }
      if (piAcDrop.style.display === 'none') return;
      const items  = piAcDrop.querySelectorAll('.pi-row-ac-item');
      const active = piAcDrop.querySelector('.pi-row-ac-item.ac-active');
      let idx = -1; items.forEach((it, i) => { if (it === active) idx = i; });
      if (e.key === 'ArrowDown') {
        e.preventDefault(); const next = idx < items.length - 1 ? idx + 1 : 0;
        items.forEach(i => { i.classList.remove('ac-active'); i.style.background = ''; });
        items[next].classList.add('ac-active'); items[next].style.background = '#f4f3ee';
        items[next].scrollIntoView({ block: 'nearest' });
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault(); const prev = idx > 0 ? idx - 1 : items.length - 1;
        items.forEach(i => { i.classList.remove('ac-active'); i.style.background = ''; });
        items[prev].classList.add('ac-active'); items[prev].style.background = '#f4f3ee';
        items[prev].scrollIntoView({ block: 'nearest' });
      }
      if (e.key === 'Enter' && active) { e.preventDefault(); active.dispatchEvent(new MouseEvent('mousedown')); }
    });
  }, 50);
}

// ── Render product autocomplete for row ──────────────────────
let piRowAcCurrentId = null;

function renderPiRowAC(rowId, query) {
  const data = getPiMaster('product');
  if (!data.length) return closePiRowAC();
  const q = (query || '').toLowerCase().trim();
  const filtered = q ? data.filter(r => r.name.toLowerCase().includes(q)) : data;
  if (!filtered.length) return closePiRowAC();

  piRowAcCurrentId = rowId;

  piAcDrop.innerHTML = `
    <div style="padding:0.45rem 0.75rem;font-size:0.62rem;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#6b7fa3;border-bottom:1px solid #eef1f8;display:flex;align-items:center;justify-content:space-between;">
      <span>📦 Saved Products</span><span style="color:#9aadcc;">${filtered.length} found</span>
    </div>
    ${filtered.map(r => {
      const idx = data.indexOf(r);
      const sub = [r.hscode ? 'HS: '+r.hscode : '', r.unit].filter(Boolean).join(' · ');
      return `<div class="pi-row-ac-item" onmousedown="event.preventDefault();pickPiRowProduct(${rowId},${idx})"
        style="padding:0.6rem 0.85rem;cursor:pointer;border-bottom:1px solid #f4f3ee;display:flex;align-items:center;gap:0.65rem;transition:background 0.15s;">
        <div style="width:28px;height:28px;border-radius:7px;background:#f0f2f8;display:flex;align-items:center;justify-content:center;font-size:0.85rem;flex-shrink:0;">📦</div>
        <div style="flex:1;min-width:0;">
          <div style="font-size:0.82rem;font-weight:600;color:#0f2540;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${r.name}</div>
          ${sub ? `<div style="font-size:0.68rem;color:#6b7fa3;margin-top:0.1rem;">${sub}</div>` : ''}
          ${r.rate ? `<div style="font-size:0.68rem;color:#c9a84c;font-weight:700;">Rate: $${r.rate}</div>` : ''}
        </div>
        <div style="font-size:0.65rem;color:#c9a84c;font-weight:700;flex-shrink:0;">↗ Use</div>
      </div>`;
    }).join('')}`;

  piAcDrop.querySelectorAll('.pi-row-ac-item').forEach(el => {
    el.addEventListener('mouseover', () => el.style.background = '#f4f3ee');
    el.addEventListener('mouseout',  () => el.style.background = '');
  });

  piAcDrop.style.display = 'block';
  const descEl = document.getElementById('r_desc_' + rowId);
  if (descEl) posPiAC(descEl);
}

function pickPiRowProduct(rowId, idx) {
  const data = getPiMaster('product');
  const r = data[idx]; if (!r) return;
  PI_MASTER_CONFIG.product.fill(r, rowId);
  closePiRowAC();
  showToast('📦', r.name + ' selected');
}

function closePiRowAC() {
  if (typeof closePiAC === 'function') closePiAC();
  piRowAcCurrentId = null;
}

// Attach autocomplete to initial 3 rows after DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    // Rows 1,2,3 are created at init — attach AC to them
    [1, 2, 3].forEach(id => attachPiProductAC(id));
  }, 400);
});

