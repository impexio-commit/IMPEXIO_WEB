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
    <td><input type="text"   class="pi-ci"          id="r_desc_${id}"  placeholder="Product description" oninput=""/></td>
    <td><input type="text"   class="pi-ci pi-ci-num" id="r_hs_${id}"   placeholder="HS Code"/></td>
    <td><input type="number" class="pi-ci pi-ci-num" id="r_qty_${id}"  placeholder="0" step="0.01" min="0" oninput="calcRow(${id})"/></td>
    <td><input type="number" class="pi-ci pi-ci-num" id="r_box_${id}"  placeholder="0" step="1"    min="0" oninput="calcTotals()"/></td>
    <td><input type="number" class="pi-ci pi-ci-num" id="r_rate_${id}" placeholder="0.00" step="0.01" min="0" oninput="calcRow(${id})"/></td>
    <td><span class="pi-ci-amt" id="r_amt_${id}">0.00</span></td>
    <td><button class="pi-del-btn" onclick="delRow(${id})">✕</button></td>`;
  tbody.appendChild(tr);
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
