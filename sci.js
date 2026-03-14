/* ============================================================
   sci.js — Sample Courier Invoice Step Wizard
   IMPEXIO v2
   ============================================================ */

let sciRecords  = JSON.parse(localStorage.getItem('sci_records') || '[]');
let editingId   = null;
let currentStep = 1;
let rowCount    = 0;

// ── Init ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadSess();
  populateTopbar();
  setTodayDate();
  autoSetInvNo();
  addRow(); addRow(); addRow(); addRow(); addRow();
  renderRecords();
  goToStep(1);
});

function setTodayDate() {
  const el = document.getElementById('f_date');
  if (el && !el.value) el.value = new Date().toISOString().split('T')[0];
}

function autoSetInvNo() {
  const el = document.getElementById('f_invno');
  if (el && !el.value) {
    const num = String(sciRecords.length + 1).padStart(4, '0');
    el.value = `SCI/2026/${num}`;
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
    if (!gv('f_invno')) { showToast('⚠️', 'Please enter Invoice No. first.'); return; }
    if (!gv('f_date'))  { showToast('⚠️', 'Please select Invoice Date first.'); return; }
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
  document.querySelectorAll('.spb-connector').forEach((c, idx) => {
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
  const invno = gv('f_invno') || '—';
  const date  = gv('f_date') ? fmtDate(gv('f_date')) : '—';
  const con   = gv('f_con_name') || '—';
  const total = document.getElementById('tot_amt')?.textContent || '0.00';

  [[2,'s2'],[3,'s3']].forEach(([,p]) => {
    setText(`${p}_invno`,     invno);
    setText(`${p}_date`,      date);
    setText(`${p}_consignee`, con);
  });
  setText('s3_total', total);
}

// ── Product Rows ──────────────────────────────────────────────
function addRow() {
  rowCount++;
  const id = rowCount;
  const tbody = document.getElementById('productBody');
  const tr = document.createElement('tr');
  tr.id = `srow_${id}`;
  tr.innerHTML = `
    <td><input type="text"   class="si-ci"           id="r_desc_${id}" placeholder="Product description"/></td>
    <td><input type="text"   class="si-ci si-ci-num" id="r_hs_${id}"   placeholder="HS Code"/></td>
    <td><input type="number" class="si-ci si-ci-num" id="r_qty_${id}"  placeholder="0"    step="0.01" min="0" oninput="calcRow(${id})"/></td>
    <td><input type="number" class="si-ci si-ci-num" id="r_rate_${id}" placeholder="0.00" step="0.01" min="0" oninput="calcRow(${id})"/></td>
    <td><span class="si-ci-amt" id="r_amt_${id}">0.00</span></td>
    <td><button class="si-del-btn" onclick="delRow(${id})">✕</button></td>`;
  tbody.appendChild(tr);
}

function delRow(id) {
  const rows = document.getElementById('productBody').querySelectorAll('tr');
  if (rows.length <= 1) { showToast('⚠️', 'At least one product row is required.'); return; }
  document.getElementById(`srow_${id}`)?.remove();
  calcTotals();
}

function calcRow(id) {
  const qty  = parseFloat(document.getElementById(`r_qty_${id}`)?.value)  || 0;
  const rate = parseFloat(document.getElementById(`r_rate_${id}`)?.value) || 0;
  const el   = document.getElementById(`r_amt_${id}`);
  if (el) el.textContent = fmtAmt(qty * rate);
  calcTotals();
}

function calcTotals() {
  const tbody = document.getElementById('productBody');
  let totalQty = 0, totalAmt = 0;
  tbody.querySelectorAll('tr').forEach(tr => {
    const id = tr.id.replace('srow_','');
    totalQty += parseFloat(document.getElementById(`r_qty_${id}`)?.value) || 0;
    totalAmt += parseFloat(document.getElementById(`r_amt_${id}`)?.textContent?.replace(/,/g,'')) || 0;
  });
  setText('tot_qty',   fmtNum(totalQty));
  setText('tot_amt',   fmtAmt(totalAmt));
  setText('amt_words', numToWords(totalAmt));
}

function updateSummaryCard() {
  calcTotals();
  setText('sum_qty',   document.getElementById('tot_qty')?.textContent  || '0');
  setText('sum_amt',   document.getElementById('tot_amt')?.textContent  || '0.00');
  setText('sum_words', document.getElementById('amt_words')?.textContent || '—');
}

// ── Number to Words (Indian) ──────────────────────────────────
function numToWords(n) {
  if (!n || n === 0) return 'Zero Only';
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
  const intPart = Math.floor(n);
  const decPart = Math.round((n - intPart) * 100);
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

// ── Collect Rows ──────────────────────────────────────────────
function collectRows() {
  return Array.from(document.getElementById('productBody').querySelectorAll('tr')).map(tr => {
    const id = tr.id.replace('srow_','');
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
  setText('formTitle', 'New Courier Invoice');
  goToStep(1);
  document.querySelectorAll('.sl-card').forEach(c => c.classList.remove('active'));
}

function clearForm() {
  ['f_invno','f_date',
   'f_con_name','f_con_addr1','f_con_addr2','f_con_addr3',
   'f_not_name','f_not_addr1','f_not_addr2','f_not_addr3',
   'f_country_origin','f_country_dest','f_pol','f_pod',
   'f_final_dest','f_vessel','f_precarriage','f_place_receipt',
   'f_delivery_terms','f_payment_terms','f_incoterms','f_other_terms',
   'f_marks_nos','f_gross_net_wt',
   'f_other_ref','f_remarks','f_preparedby','f_signatory'
  ].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  setTodayDate();
  autoSetInvNo();
  document.getElementById('productBody').innerHTML = '';
  rowCount = 0;
  addRow(); addRow(); addRow(); addRow(); addRow();
  calcTotals();
}

// ── Save ──────────────────────────────────────────────────────
function saveRecord() {
  const invno = gv('f_invno');
  const date  = gv('f_date');
  if (!invno) { showToast('⚠️','Please enter Invoice No.'); goToStep(1); return; }
  if (!date)  { showToast('⚠️','Please select Invoice Date.'); goToStep(1); return; }

  calcTotals();
  const rows = collectRows();

  const rec = {
    id: editingId ?? Date.now(),
    invno, date,
    con_name:  gv('f_con_name'),  con_addr1: gv('f_con_addr1'),
    con_addr2: gv('f_con_addr2'), con_addr3: gv('f_con_addr3'),
    not_name:  gv('f_not_name'),  not_addr1: gv('f_not_addr1'),
    not_addr2: gv('f_not_addr2'), not_addr3: gv('f_not_addr3'),
    country_origin: gv('f_country_origin'), country_dest: gv('f_country_dest'),
    pol: gv('f_pol'), pod: gv('f_pod'),
    final_dest:    gv('f_final_dest'),   vessel:        gv('f_vessel'),
    precarriage:   gv('f_precarriage'),  place_receipt: gv('f_place_receipt'),
    delivery_terms: gv('f_delivery_terms'), payment_terms: gv('f_payment_terms'),
    incoterms:     gv('f_incoterms'),    other_terms:   gv('f_other_terms'),
    marks_nos:     gv('f_marks_nos'),    gross_net_wt:  gv('f_gross_net_wt'),
    other_ref:     gv('f_other_ref'),    remarks:       gv('f_remarks'),
    preparedby:    gv('f_preparedby'),   signatory:     gv('f_signatory'),
    rows,
    tot_qty:   document.getElementById('tot_qty')?.textContent   || '0',
    tot_amt:   document.getElementById('tot_amt')?.textContent   || '0.00',
    amt_words: document.getElementById('amt_words')?.textContent || '',
  };

  if (editingId !== null) {
    const idx = sciRecords.findIndex(r => r.id === editingId);
    if (idx > -1) sciRecords[idx] = rec; else sciRecords.unshift(rec);
  } else {
    sciRecords.unshift(rec);
  }

  localStorage.setItem('sci_records', JSON.stringify(sciRecords));
  renderRecords();
  showToast('✅', `Invoice ${invno} saved!`);
  editingId = rec.id;
  setText('formTitle', `Editing: ${invno}`);
}

// ── Edit ──────────────────────────────────────────────────────
function editRecord(id) {
  const rec = sciRecords.find(r => r.id === id);
  if (!rec) return;
  editingId = id;
  setText('formTitle', `Editing: ${rec.invno}`);

  const sv = (elId, v) => { const el = document.getElementById(elId); if (el) el.value = v || ''; };
  sv('f_invno', rec.invno); sv('f_date', rec.date);
  sv('f_con_name',  rec.con_name);  sv('f_con_addr1', rec.con_addr1);
  sv('f_con_addr2', rec.con_addr2); sv('f_con_addr3', rec.con_addr3);
  sv('f_not_name',  rec.not_name);  sv('f_not_addr1', rec.not_addr1);
  sv('f_not_addr2', rec.not_addr2); sv('f_not_addr3', rec.not_addr3);
  sv('f_country_origin', rec.country_origin); sv('f_country_dest', rec.country_dest);
  sv('f_pol',   rec.pol);   sv('f_pod',  rec.pod);
  sv('f_final_dest',   rec.final_dest);   sv('f_vessel',       rec.vessel);
  sv('f_precarriage',  rec.precarriage);  sv('f_place_receipt',rec.place_receipt);
  sv('f_delivery_terms', rec.delivery_terms); sv('f_payment_terms', rec.payment_terms);
  sv('f_incoterms',    rec.incoterms);    sv('f_other_terms',  rec.other_terms);
  sv('f_marks_nos',    rec.marks_nos);    sv('f_gross_net_wt', rec.gross_net_wt);
  sv('f_other_ref',    rec.other_ref);    sv('f_remarks',      rec.remarks);
  sv('f_preparedby',   rec.preparedby);   sv('f_signatory',    rec.signatory);

  document.getElementById('productBody').innerHTML = '';
  rowCount = 0;
  if (rec.rows?.length > 0) {
    rec.rows.forEach(row => {
      addRow();
      const id2 = rowCount;
      const sv2 = (k, v) => { const el = document.getElementById(`r_${k}_${id2}`); if (el) el.value = v || ''; };
      sv2('desc', row.desc); sv2('hs', row.hs);
      sv2('qty',  row.qty);  sv2('rate', row.rate);
      calcRow(id2);
    });
    while (rowCount < 5) addRow();
  } else {
    addRow(); addRow(); addRow(); addRow(); addRow();
  }
  calcTotals();

  document.querySelectorAll('.sl-card').forEach(c => c.classList.remove('active'));
  document.getElementById(`scicard_${id}`)?.classList.add('active');
  goToStep(1);
}

// ── Delete ────────────────────────────────────────────────────
function deleteRecord(id) {
  if (!confirm('Delete this Courier Invoice record?')) return;
  sciRecords = sciRecords.filter(r => r.id !== id);
  localStorage.setItem('sci_records', JSON.stringify(sciRecords));
  if (editingId === id) newEntry();
  renderRecords();
  showToast('🗑','Record deleted.');
}

// ── Render List ───────────────────────────────────────────────
function renderRecords(data = null) {
  const list  = document.getElementById('recordsList');
  const items = data || sciRecords;
  if (items.length === 0) {
    list.innerHTML = `
      <div class="sl-empty">
        <div style="font-size:1.6rem;opacity:0.35;">📦</div>
        <div class="sl-empty-txt">No records yet</div>
        <div class="sl-empty-sub">Click + New to begin</div>
      </div>`;
    return;
  }
  list.innerHTML = items.map(rec => `
    <div class="sl-card ${editingId===rec.id?'active':''}" id="scicard_${rec.id}" onclick="editRecord(${rec.id})">
      <div class="sl-card-no">${rec.invno}</div>
      <div class="sl-card-con">${rec.con_name||'—'}</div>
      <div class="sl-card-row">
        <span class="sl-card-date">${fmtDate(rec.date)}</span>
        <span class="sl-card-val">${rec.tot_amt||'0.00'}</span>
      </div>
      <div class="sl-card-acts">
        <button class="sl-act edit" onclick="event.stopPropagation();editRecord(${rec.id})">✏️ Edit</button>
        <button class="sl-act prnt" onclick="event.stopPropagation();printById(${rec.id})">🖨 Print</button>
        <button class="sl-act del"  onclick="event.stopPropagation();deleteRecord(${rec.id})">🗑</button>
      </div>
    </div>`).join('');
}

function filterRecords() {
  const q = document.getElementById('searchInput')?.value.toLowerCase() || '';
  if (!q) { renderRecords(); return; }
  renderRecords(sciRecords.filter(r =>
    r.invno?.toLowerCase().includes(q) ||
    r.con_name?.toLowerCase().includes(q) ||
    r.not_name?.toLowerCase().includes(q)
  ));
}

// ── Print ─────────────────────────────────────────────────────
function printRecord() {
  calcTotals();
  doPrint({
    invno: gv('f_invno'), date: gv('f_date'),
    con_name: gv('f_con_name'), con_addr1: gv('f_con_addr1'),
    con_addr2: gv('f_con_addr2'), con_addr3: gv('f_con_addr3'),
    not_name: gv('f_not_name'), not_addr1: gv('f_not_addr1'),
    not_addr2: gv('f_not_addr2'), not_addr3: gv('f_not_addr3'),
    country_origin: gv('f_country_origin'), country_dest: gv('f_country_dest'),
    pol: gv('f_pol'), pod: gv('f_pod'),
    final_dest: gv('f_final_dest'), vessel: gv('f_vessel'),
    precarriage: gv('f_precarriage'), place_receipt: gv('f_place_receipt'),
    delivery_terms: gv('f_delivery_terms'), payment_terms: gv('f_payment_terms'),
    incoterms: gv('f_incoterms'), other_terms: gv('f_other_terms'),
    marks_nos: gv('f_marks_nos'), gross_net_wt: gv('f_gross_net_wt'),
    other_ref: gv('f_other_ref'), remarks: gv('f_remarks'),
    preparedby: gv('f_preparedby'), signatory: gv('f_signatory'),
    rows: collectRows(),
    tot_qty:   document.getElementById('tot_qty')?.textContent   || '0',
    tot_amt:   document.getElementById('tot_amt')?.textContent   || '0.00',
    amt_words: document.getElementById('amt_words')?.textContent || '',
  });
}

function printById(id) {
  const rec = sciRecords.find(r => r.id === id);
  if (rec) doPrint(rec);
}

function doPrint(rec) {
  const client = sess?.clientCode || 'Demo001';

  const productRows = (rec.rows||[]).map(r => `
    <tr>
      <td class="desc-td">${r.desc||''}</td>
      <td>${r.hs||''}</td>
      <td>${r.qty||''}</td>
      <td>${r.rate ? fmtAmt(r.rate) : ''}</td>
      <td>${r.amt||''}</td>
    </tr>`).join('');
  const emptyRows = Math.max(0, 12 - (rec.rows||[]).length);
  const padRows   = Array(emptyRows).fill('<tr><td>&nbsp;</td><td></td><td></td><td></td><td></td></tr>').join('');

  const shipItems = [
    ['Country of Origin',             rec.country_origin],
    ['Country of Final Destination',  rec.country_dest],
    ['Port of Loading',               rec.pol],
    ['Port of Discharge',             rec.pod],
    ['Final Destination',             rec.final_dest],
    ['Vessel / Flight No.',           rec.vessel],
    ['Pre-carriage By',               rec.precarriage],
    ['Place of Receipt by Pre-carriage', rec.place_receipt],
  ].filter(([,v]) => v);

  const termItems = [
    ['Delivery Terms',  rec.delivery_terms],
    ['Payment Terms',   rec.payment_terms],
    ['Inco Terms',      rec.incoterms],
    ['Other Terms',     rec.other_terms],
    ['Marks & Nos.',    rec.marks_nos],
    ['GRS.WT./NET WT.', rec.gross_net_wt],
  ].filter(([,v]) => v);

  document.getElementById('printArea').innerHTML = `
  <div class="sp-doc">
    <div class="sp-hdr-logo">IMPEXIO</div>
    <div class="sp-hdr-teal"></div>
    <div class="sp-hdr-sub">Sample Courier Invoice</div>

    <div class="sp-meta-row">
      <div class="sp-meta-item"><span class="sp-meta-lbl">Invoice No.:&nbsp;</span><span class="sp-meta-val">${rec.invno||''}</span></div>
      <div class="sp-meta-item"><span class="sp-meta-lbl">Invoice Date:&nbsp;</span><span class="sp-meta-val" style="font-weight:700;color:#0f2540;">${fmtDate(rec.date)}</span></div>
    </div>

    <div class="sp-parties">
      <div>
        <div class="sp-party-hd">Consignee</div>
        <div class="sp-party-body">${[rec.con_name,rec.con_addr1,rec.con_addr2,rec.con_addr3].filter(Boolean).join('<br/>')||'&nbsp;'}</div>
      </div>
      <div>
        <div class="sp-party-hd">Notify Party</div>
        <div class="sp-party-body">${[rec.not_name,rec.not_addr1,rec.not_addr2,rec.not_addr3].filter(Boolean).join('<br/>')||'&nbsp;'}</div>
      </div>
    </div>

    ${shipItems.length > 0 ? `
    <div class="sp-ship">
      ${shipItems.map(([l,v]) => `<div class="sp-ship-item"><div class="sp-ship-lbl">${l}</div><div class="sp-ship-val">${v}</div></div>`).join('')}
    </div>` : ''}

    ${termItems.length > 0 ? `
    <div class="sp-terms-hd">Terms of Delivery and Payment</div>
    <div class="sp-terms">
      ${termItems.map(([l,v]) => `<div class="sp-term-item"><span class="sp-term-lbl">${l}:</span><span class="sp-term-val">${v}</span></div>`).join('')}
    </div>` : ''}

    <table class="sp-tbl">
      <thead>
        <tr>
          <th class="desc-th">Product Description</th>
          <th>HS Code</th>
          <th>Qty</th>
          <th>Rate</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
        ${productRows}
        ${padRows}
        <tr class="sp-tot-row">
          <td colspan="2" style="text-align:right;font-size:7.5pt;letter-spacing:0.12em;">TOTAL</td>
          <td>${rec.tot_qty||'0'}</td>
          <td></td>
          <td class="sp-tot-gold">${rec.tot_amt||'0.00'}</td>
        </tr>
        <tr class="sp-words-row">
          <td colspan="2" style="font-size:7pt;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;">Amount in Words:</td>
          <td colspan="3" style="font-style:italic;">${rec.amt_words||'—'}</td>
        </tr>
      </tbody>
    </table>

    <div class="sp-other-ref">
      <span class="sp-other-ref-lbl">Other Ref.:</span>
      <span>${rec.other_ref||''}</span>
    </div>

    <div class="sp-remarks-hd">Remarks:</div>
    <div class="sp-remarks">${rec.remarks||'&nbsp;'}</div>

    <div class="sp-sigs">
      <div class="sp-sig"><div class="sp-sig-line">Prepared By: ${rec.preparedby||'__________________'}</div></div>
      <div class="sp-sig"><div class="sp-sig-line">For IMPEXIO / Authorised Signatory: ${rec.signatory||'__________________'}</div></div>
    </div>

    <div class="sp-bottom-bar"></div>
    <div class="sp-footer">IMPEXIO | Export-Import Document Portal | Client: ${client} | Sample Courier Invoice | Printed: ${new Date().toLocaleString('en-IN')}</div>
  </div>`;

  window.print();
}

// ── Toast ─────────────────────────────────────────────────────
function showToast(icon, msg) {
  let t = document.getElementById('sci-toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'sci-toast';
    t.style.cssText = `position:fixed;bottom:1.5rem;right:1.5rem;background:var(--teal,#0f5c52);color:#fff;padding:0.7rem 1.2rem;border-radius:10px;font-size:0.82rem;font-weight:600;display:flex;gap:0.5rem;align-items:center;box-shadow:0 8px 24px rgba(15,92,82,0.3);z-index:9999;opacity:0;transition:opacity 0.3s;pointer-events:none;border-left:3px solid var(--gold,#c9a84c);`;
    document.body.appendChild(t);
  }
  t.innerHTML = `<span>${icon}</span><span>${msg}</span>`;
  t.style.opacity = '1';
  clearTimeout(t._t);
  t._t = setTimeout(() => { t.style.opacity = '0'; }, 3000);
}
