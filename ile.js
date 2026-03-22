/* ============================================================
   ile.js — Import Letter For Enquiry
   IMPEXIO v2
   ============================================================ */

let ileRecords  = JSON.parse(localStorage.getItem('ile_records') || '[]');
let editingId   = null;
let currentStep = 1;
let rowCount    = 0;

document.addEventListener('DOMContentLoaded', () => {
  loadSess(); populateTopbar(); setTodayDate(); autoSetRefNo();
  addRow(); addRow(); addRow();
  renderRecords(); goToStep(1);
});

function setTodayDate() { const el=document.getElementById('f_date'); if(el&&!el.value) el.value=new Date().toISOString().split('T')[0]; }
function autoSetRefNo()  { const el=document.getElementById('f_refno'); if(el&&!el.value) el.value=`ILE/2026/${String(ileRecords.length+1).padStart(4,'0')}`; }
function fmtDate(d)      { if(!d) return ''; try{return new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'});}catch{return d;} }
function gv(id)          { return document.getElementById(id)?.value?.trim()||''; }
function sv(id,v)        { const el=document.getElementById(id); if(el) el.value=v||''; }
function setText(id,v)   { const el=document.getElementById(id); if(el) el.textContent=v; }

function populateTopbar() {
  const s=sess||{};
  setText('dtbUname',s.username||'Admin'); setText('dtbRole',s.role||'Administrator');
  const av=document.getElementById('dtbAv'); if(av) av.textContent=(s.username||'A')[0].toUpperCase();
  const meta=document.getElementById('dtbMeta');
  if(meta&&s.company&&s.year) meta.innerHTML=`<div class="dtb-chip">🏷️ <strong>${s.clientCode||''}</strong></div><div class="dtb-chip">🏢 <strong>${(s.company.name||'').split(' ').slice(0,3).join(' ')}</strong></div><div class="dtb-chip">📅 <strong>FY ${s.year?.label||''}</strong></div>`;
}
function doLogout() { if(confirm('Logout from IMPEXIO?')){sessionStorage.removeItem('impexio');window.location.href='index.html';} }

// ── Product rows ──────────────────────────────────────────────
function addRow() {
  rowCount++;
  const id = rowCount;
  const tbody = document.getElementById('productBody');
  const tr = document.createElement('tr');
  tr.id = `irow_${id}`;
  tr.innerHTML = `
    <td style="display:flex;align-items:center;gap:0.3rem;">
      <button onclick="openIleMaster('product','r_desc_${id}')" title="Product Master" style="width:26px;height:26px;border-radius:6px;background:#0f2540;color:#fff;border:none;cursor:pointer;font-size:0.75rem;flex-shrink:0;display:flex;align-items:center;justify-content:center;">📦</button>
      <input type="text" class="ile-ci" id="r_desc_${id}" placeholder="Product description" style="flex:1;min-width:0;"/>
    </td>
    <td><input type="text"   class="ile-ci" id="r_hs_${id}"   placeholder="e.g. 6907.21"/></td>
    <td><input type="number" class="ile-ci" id="r_qty_${id}"  placeholder="e.g. 5000" step="0.01" min="0"/></td>
    <td><input type="text"   class="ile-ci" id="r_unit_${id}" placeholder="SQM/KGS"/></td>
    <td><input type="text"   class="ile-ci" id="r_spec_${id}" placeholder="Grade, size..."/></td>
    <td><button class="ile-del-btn" onclick="delRow(${id})">✕</button></td>`;
  tbody.appendChild(tr);
  attachIleProductAC(id);
}

function delRow(id) {
  const rows = document.getElementById('productBody').querySelectorAll('tr');
  if (rows.length <= 1) { showToastIle('⚠️','At least one product row is required.'); return; }
  document.getElementById(`irow_${id}`)?.remove();
}

function getProductRows() {
  return Array.from(document.getElementById('productBody').querySelectorAll('tr')).map(tr => {
    const id = tr.id.replace('irow_','');
    return {
      desc: document.getElementById(`r_desc_${id}`)?.value||'',
      hs:   document.getElementById(`r_hs_${id}`)?.value||'',
      qty:  document.getElementById(`r_qty_${id}`)?.value||'',
      unit: document.getElementById(`r_unit_${id}`)?.value||'',
      spec: document.getElementById(`r_spec_${id}`)?.value||''
    };
  }).filter(r => r.desc||r.qty);
}

function loadProductRows(rows) {
  document.getElementById('productBody').innerHTML = '';
  rowCount = 0;
  if (!rows || !rows.length) { addRow(); addRow(); addRow(); return; }
  rows.forEach(r => {
    addRow();
    const id = rowCount;
    sv(`r_desc_${id}`, r.desc); sv(`r_hs_${id}`, r.hs);
    sv(`r_qty_${id}`,  r.qty);  sv(`r_unit_${id}`, r.unit);
    sv(`r_spec_${id}`, r.spec);
  });
}

// ── Step navigation ───────────────────────────────────────────
function goToStep(n) {
  if (n > currentStep) {
    if (n >= 2) {
      if (!gv('f_refno'))        { showToastIle('⚠️','Please enter the ILE Ref. No.'); return; }
      if (!gv('f_date'))         { showToastIle('⚠️','Please select a date.'); return; }
      if (!gv('f_from_company')) { showToastIle('⚠️','Please enter your Company Name.'); return; }
      if (!gv('f_from_contact')) { showToastIle('⚠️','Please enter your Contact Person name.'); return; }
      if (!gv('f_sup_name'))     { showToastIle('⚠️','Please enter the Supplier Name.'); return; }
    }
    if (n >= 3) {
      const rows = getProductRows();
      if (!rows.length) { showToastIle('⚠️','Please add at least one product.'); return; }
    }
    if (n === 4) {
      if (!gv('f_preparedby'))   { showToastIle('⚠️','Please enter Prepared By name.'); return; }
      generateLetterPreview();
    }
  }
  currentStep = n;
  for (let i=1;i<=4;i++) { document.getElementById(`step_${i}`)?.classList.toggle('hidden',i!==n); }
  for (let i=1;i<=4;i++) {
    const dot=document.getElementById(`pstep_${i}`); if(!dot) continue;
    dot.classList.remove('active','done');
    if(i===n) dot.classList.add('active');
    if(i<n)   dot.classList.add('done');
  }
  document.querySelectorAll('.ipb-connector').forEach((c,i)=>{ c.classList.toggle('done',i+1<n); });
  const subs={1:'Step 1 of 4 — Header Info',2:'Step 2 of 4 — Products',3:'Step 3 of 4 — Terms & Checklist',4:'Step 4 of 4 — Preview & Print'};
  setText('formSub',subs[n]||''); updateInfoStrips();
}
function nextStep(from) { goToStep(from+1); }
function prevStep(from) { goToStep(from-1); }

function updateInfoStrips() {
  const sup  = gv('f_sup_name')||'—';
  const ctry = gv('f_sup_country')||'—';
  const ref  = gv('f_refno')||'—';
  const rows = getProductRows();
  const prod = rows.length ? rows[0].desc : '—';
  setText('s2_supplier',sup); setText('s2_country',ctry); setText('s2_ref',ref);
  setText('s3_supplier',sup); setText('s3_product',prod); setText('s3_ref',ref);
  setText('s4_supplier',sup); setText('s4_product',prod); setText('s4_ref',ref);
}

// ── Generate Letter Preview ───────────────────────────────────
function getChecklist() {
  const items = [
    {id:'c_price',    label:'Price List / Rate'},
    {id:'c_moq',      label:'MOQ Details'},
    {id:'c_lead',     label:'Lead Time'},
    {id:'c_payment',  label:'Payment Terms'},
    {id:'c_sample',   label:'Sample Availability'},
    {id:'c_catalogue',label:'Product Catalogue'},
    {id:'c_cert',     label:'Certifications'},
    {id:'c_packing',  label:'Packing Details'},
    {id:'c_pol',      label:'Port of Loading'},
    {id:'c_photo',    label:'Product Photos'},
    {id:'c_test',     label:'Test Reports'},
    {id:'c_spec',     label:'Technical Specs / Datasheet'},
  ];
  return items.filter(i => document.getElementById(i.id)?.checked).map(i => i.label);
}

function generateLetterPreview() {
  const rows = getProductRows();
  const checklist = getChecklist();
  const d = {
    refno:       gv('f_refno'), date: gv('f_date'), responseBy: gv('f_response_by'),
    fromCompany: gv('f_from_company'), fromContact: gv('f_from_contact'),
    fromDesig:   gv('f_from_desig'), fromAddr: gv('f_from_addr'),
    fromEmail:   gv('f_from_email'), fromPhone: gv('f_from_phone'),
    supName:     gv('f_sup_name'), supContact: gv('f_sup_contact'),
    supCountry:  gv('f_sup_country'), supAddr: gv('f_sup_addr'),
    supEmail:    gv('f_sup_email'),
    pod:         gv('f_pod'), incoterms: gv('f_incoterms'), container: gv('f_container'),
    deliveryBy:  gv('f_delivery_by'), coo: gv('f_coo'), priceBasis: gv('f_price_basis'),
    paymentTerms:gv('f_payment_terms'), currency: gv('f_currency'), moq: gv('f_moq'),
    remarks:     gv('f_remarks'), preparedby: gv('f_preparedby'), signatory: gv('f_signatory'),
  };

  const salutation = `Dear ${d.supContact ? d.supContact + ',' : 'Sir / Madam,'}`;
  const intro = `We are writing to express our interest in importing ${rows.length === 1 ? `<strong>${rows[0].desc}</strong>` : 'the following products'} from your esteemed organisation and would appreciate if you could provide us with the requested information at your earliest convenience.`;

  // Product table rows
  const prodRows = rows.map(r => `
    <tr><td>${r.desc||'—'}</td><td>${r.hs||'—'}</td><td>${r.qty||'—'}</td><td>${r.unit||'—'}</td><td>${r.spec||'—'}</td></tr>`).join('');

  const deliveryPara = [
    d.pod        ? `<strong>Port of Discharge:</strong> ${d.pod}` : '',
    d.incoterms  ? `<strong>Preferred Incoterms:</strong> ${d.incoterms}` : '',
    d.container  ? `<strong>Container Type:</strong> ${d.container}` : '',
    d.deliveryBy ? `<strong>Required Delivery By:</strong> ${fmtDate(d.deliveryBy)}` : '',
    d.coo        ? `<strong>Country of Origin:</strong> ${d.coo}` : '',
    d.priceBasis ? `<strong>Pricing Basis:</strong> ${d.priceBasis}` : '',
  ].filter(Boolean).join(' &nbsp;|&nbsp; ');

  const commercialPara = [
    d.paymentTerms ? `<strong>Payment Terms:</strong> ${d.paymentTerms}` : '',
    d.currency     ? `<strong>Currency:</strong> ${d.currency}` : '',
    d.moq          ? `<strong>MOQ:</strong> ${d.moq}` : '',
  ].filter(Boolean).join(' &nbsp;|&nbsp; ');

  const checklistHtml = checklist.length ? `We specifically request the following information:<br/>${checklist.map(c=>`✅ ${c}`).join(' &nbsp;&nbsp; ')}` : '';
  const closing = `Kindly respond at your earliest convenience${d.responseBy ? ` — no later than <strong>${fmtDate(d.responseBy)}</strong>` : ''}. We look forward to establishing a mutually beneficial business relationship with your organisation.`;

  const previewEl = document.getElementById('letterPreviewBody');
  if (!previewEl) return;
  previewEl.innerHTML = `
    <div class="ilp-field"><div class="ilp-lbl">To:</div><div class="ilp-val">${d.supEmail||'—'} &nbsp;(${d.supName}${d.supAddr?', '+d.supAddr:''})</div></div>
    <div class="ilp-field"><div class="ilp-lbl">From:</div><div class="ilp-val">${d.fromEmail||'—'} &nbsp;(${d.fromContact}, ${d.fromCompany})</div></div>
    <div class="ilp-field"><div class="ilp-lbl">Date:</div><div class="ilp-val">${fmtDate(d.date)}</div></div>
    <div class="ilp-field"><div class="ilp-lbl">Ref:</div><div class="ilp-val">${d.refno}</div></div>
    <div class="ilp-subject">Subject: Import Enquiry for ${rows.length===1?rows[0].desc:'Multiple Products'}${rows[0]?.hs?' (HS Code: '+rows[0].hs+')':''}</div>
    <div class="ilp-div"></div>
    <div class="ilp-para">${salutation}</div>
    <div class="ilp-para">We are pleased to introduce ourselves as <strong>${d.fromCompany}</strong>${d.fromAddr?', '+d.fromAddr:''}. ${intro}</div>
    <div class="ilp-highlight">
      <table style="width:100%;border-collapse:collapse;font-size:0.78rem;">
        <tr style="background:#0f2540;color:#fff;"><th style="padding:0.3rem 0.5rem;text-align:left;">Product</th><th style="padding:0.3rem 0.5rem;">HS Code</th><th style="padding:0.3rem 0.5rem;">Qty</th><th style="padding:0.3rem 0.5rem;">Unit</th><th style="padding:0.3rem 0.5rem;text-align:left;">Specs</th></tr>
        ${prodRows}
      </table>
    </div>
    ${deliveryPara?`<div class="ilp-para">${deliveryPara}</div>`:''}
    ${commercialPara?`<div class="ilp-para">${commercialPara}</div>`:''}
    ${checklistHtml?`<div class="ilp-highlight">${checklistHtml}</div>`:''}
    ${d.remarks?`<div class="ilp-para"><em>${d.remarks}</em></div>`:''}
    <div class="ilp-para">${closing}</div>
    <div class="ilp-div"></div>
    <div class="ilp-sign">
      Yours faithfully,<br/>
      <strong>${d.preparedby||d.fromContact}${d.fromDesig?' — '+d.fromDesig:''}</strong>
      ${d.fromCompany}${d.fromAddr?' | '+d.fromAddr:''}${d.fromPhone?' | '+d.fromPhone:''}
    </div>`;

  setText('sum_ref',      d.refno||'—');
  setText('sum_date',     fmtDate(d.date));
  setText('sum_sup',      d.supName||'—');
  setText('sum_from',     d.fromCompany||'—');
  setText('sum_prod',     rows.length ? rows[0].desc : '—');
  setText('sum_response', d.responseBy ? fmtDate(d.responseBy) : '—');
}

// ── Save / Load ───────────────────────────────────────────────
function saveRecord() {
  if (!gv('f_sup_name'))     { showToastIle('⚠️','Please enter the Supplier Name.'); return; }
  if (!gv('f_from_company')) { showToastIle('⚠️','Please enter your Company Name.'); return; }
  const rows = getProductRows();
  if (!rows.length)          { showToastIle('⚠️','Please add at least one product.'); return; }

  const chk = {};
  ['c_price','c_moq','c_lead','c_payment','c_sample','c_catalogue','c_cert','c_packing','c_pol','c_photo','c_test','c_spec']
    .forEach(id => { chk[id] = document.getElementById(id)?.checked || false; });

  const rec = {
    id: editingId??Date.now(),
    refno:gv('f_refno'),date:gv('f_date'),responseBy:gv('f_response_by'),
    fromCompany:gv('f_from_company'),fromContact:gv('f_from_contact'),fromDesig:gv('f_from_desig'),
    fromAddr:gv('f_from_addr'),fromEmail:gv('f_from_email'),fromPhone:gv('f_from_phone'),
    supName:gv('f_sup_name'),supContact:gv('f_sup_contact'),supCountry:gv('f_sup_country'),
    supAddr:gv('f_sup_addr'),supEmail:gv('f_sup_email'),supWebsite:gv('f_sup_website'),
    pod:gv('f_pod'),incoterms:gv('f_incoterms'),container:gv('f_container'),
    deliveryBy:gv('f_delivery_by'),coo:gv('f_coo'),priceBasis:gv('f_price_basis'),
    paymentTerms:gv('f_payment_terms'),currency:gv('f_currency'),moq:gv('f_moq'),
    remarks:gv('f_remarks'),preparedby:gv('f_preparedby'),signatory:gv('f_signatory'),
    rows, checklist: chk
  };
  if (editingId!==null) { const idx=ileRecords.findIndex(r=>r.id===editingId); if(idx>=0) ileRecords[idx]=rec; }
  else ileRecords.push(rec);
  localStorage.setItem('ile_records',JSON.stringify(ileRecords));
  renderRecords(); showToastIle('✅','Enquiry letter saved!');
}

function loadRecord(id) {
  const rec=ileRecords.find(r=>r.id===id); if(!rec) return;
  editingId=id; clearForm(false);
  sv('f_refno',rec.refno); sv('f_date',rec.date); sv('f_response_by',rec.responseBy);
  sv('f_from_company',rec.fromCompany); sv('f_from_contact',rec.fromContact); sv('f_from_desig',rec.fromDesig);
  sv('f_from_addr',rec.fromAddr); sv('f_from_email',rec.fromEmail); sv('f_from_phone',rec.fromPhone);
  sv('f_sup_name',rec.supName); sv('f_sup_contact',rec.supContact); sv('f_sup_country',rec.supCountry);
  sv('f_sup_addr',rec.supAddr); sv('f_sup_email',rec.supEmail); sv('f_sup_website',rec.supWebsite);
  sv('f_pod',rec.pod); sv('f_incoterms',rec.incoterms); sv('f_container',rec.container);
  sv('f_delivery_by',rec.deliveryBy); sv('f_coo',rec.coo); sv('f_price_basis',rec.priceBasis);
  sv('f_payment_terms',rec.paymentTerms); sv('f_currency',rec.currency); sv('f_moq',rec.moq);
  sv('f_remarks',rec.remarks); sv('f_preparedby',rec.preparedby); sv('f_signatory',rec.signatory);
  loadProductRows(rec.rows);
  if (rec.checklist) Object.entries(rec.checklist).forEach(([k,v])=>{ const el=document.getElementById(k); if(el) el.checked=v; });
  setText('formTitle','Edit Enquiry Letter'); goToStep(1);
  document.querySelectorAll('.ill-card').forEach(c=>c.classList.remove('active'));
  document.querySelector(`.ill-card[data-id="${id}"]`)?.classList.add('active');
}

function deleteRecord(id) {
  if(!confirm('Delete this record?')) return;
  ileRecords=ileRecords.filter(r=>r.id!==id);
  localStorage.setItem('ile_records',JSON.stringify(ileRecords));
  renderRecords(); showToastIle('🗑','Record deleted.');
}

function newEntry() {
  clearForm(true); setText('formTitle','New Enquiry Letter'); editingId=null; autoSetRefNo(); goToStep(1);
  document.querySelectorAll('.ill-card').forEach(c=>c.classList.remove('active'));
}

function clearForm(resetAll=true) {
  const ids=['f_refno','f_date','f_response_by','f_from_company','f_from_contact','f_from_desig',
    'f_from_addr','f_from_email','f_from_phone','f_sup_name','f_sup_contact','f_sup_country',
    'f_sup_addr','f_sup_email','f_sup_website','f_pod','f_incoterms','f_container',
    'f_delivery_by','f_coo','f_price_basis','f_payment_terms','f_currency','f_moq',
    'f_remarks','f_preparedby','f_signatory'];
  ids.forEach(id=>sv(id,''));
  const prev=document.getElementById('letterPreviewBody');
  if(prev) prev.innerHTML=`<div class="ilp-placeholder"><div class="ilp-placeholder-icon">📩</div><div class="ilp-placeholder-txt">Letter preview will appear here</div><div class="ilp-placeholder-sub">Fill in all required fields</div></div>`;
  // Reset checklist defaults
  ['c_price','c_moq','c_lead','c_payment','c_sample','c_catalogue'].forEach(id=>{const el=document.getElementById(id);if(el)el.checked=true;});
  ['c_cert','c_packing','c_pol','c_photo','c_test','c_spec'].forEach(id=>{const el=document.getElementById(id);if(el)el.checked=false;});
  if(resetAll){editingId=null;document.getElementById('productBody').innerHTML='';rowCount=0;addRow();addRow();addRow();setTodayDate();autoSetRefNo();}
}

// ── Render records ────────────────────────────────────────────
function renderRecords(query='') {
  const list=document.getElementById('recordsList');
  const q=query.toLowerCase().trim();
  const filtered=ileRecords.filter(r=>!q||r.refno?.toLowerCase().includes(q)||r.supName?.toLowerCase().includes(q)||r.rows?.[0]?.desc?.toLowerCase().includes(q));
  if(!filtered.length){list.innerHTML=`<div class="ill-empty"><div style="font-size:1.6rem;opacity:0.35;">📩</div><div class="ill-empty-txt">No records yet</div><div class="ill-empty-sub">Click + New to begin</div></div>`;return;}
  list.innerHTML=filtered.slice().reverse().map(r=>`
    <div class="ill-card${editingId===r.id?' active':''}" data-id="${r.id}" onclick="loadRecord(${r.id})">
      <div class="ill-card-no">${r.refno||'—'}</div>
      <div class="ill-card-sup">${r.supName||'—'}${r.supCountry?' · '+r.supCountry:''}</div>
      <div class="ill-card-row">
        <div class="ill-card-date">${fmtDate(r.date)}</div>
        <div class="ill-card-prod">${r.rows?.[0]?.desc||''}</div>
      </div>
      <div class="ill-card-acts">
        <button class="ill-act edit" onclick="event.stopPropagation();loadRecord(${r.id})">✏️ Edit</button>
        <button class="ill-act prnt" onclick="event.stopPropagation();quickPrint(${r.id})">🖨 Print</button>
        <button class="ill-act del"  onclick="event.stopPropagation();deleteRecord(${r.id})">🗑</button>
      </div>
    </div>`).join('');
}
function filterRecords() { renderRecords(document.getElementById('searchInput')?.value||''); }

// ── Print ─────────────────────────────────────────────────────
function printRecord() {
  if(!gv('f_sup_name')){showToastIle('⚠️','Please complete the form first.');return;}
  generateLetterPreview();
  const rows=getProductRows(); const checklist=getChecklist();
  const d={
    refno:gv('f_refno'),date:gv('f_date'),responseBy:gv('f_response_by'),
    fromCompany:gv('f_from_company'),fromContact:gv('f_from_contact'),fromDesig:gv('f_from_desig'),
    fromAddr:gv('f_from_addr'),fromEmail:gv('f_from_email'),fromPhone:gv('f_from_phone'),
    supName:gv('f_sup_name'),supContact:gv('f_sup_contact'),supCountry:gv('f_sup_country'),
    pod:gv('f_pod'),incoterms:gv('f_incoterms'),container:gv('f_container'),
    paymentTerms:gv('f_payment_terms'),currency:gv('f_currency'),
    remarks:gv('f_remarks'),preparedby:gv('f_preparedby'),signatory:gv('f_signatory'),
  };
  const prodBody=rows.map(r=>`<tr><td>${r.desc}</td><td>${r.hs}</td><td>${r.qty}</td><td>${r.unit}</td><td>${r.spec}</td></tr>`).join('');
  const body=[
    `Dear ${d.supContact||'Sir / Madam'},`,
    '',
    `We are pleased to introduce ourselves as ${d.fromCompany}${d.fromAddr?', '+d.fromAddr:''}. We are interested in importing the products listed below and would request you to kindly provide us with the necessary information at your earliest.`,
    '',
    d.pod||d.incoterms||d.container?`Delivery Requirement: ${[d.pod?'Port: '+d.pod:'',d.incoterms?'Incoterms: '+d.incoterms:'',d.container?'Container: '+d.container:''].filter(Boolean).join(' | ')}`:'',
    d.paymentTerms?`Payment Terms: ${d.paymentTerms}${d.currency?' | Currency: '+d.currency:''}`: '',
    checklist.length?`\nInformation Requested:\n${checklist.map(c=>'✅ '+c).join('  |  ')}`:'',
    d.remarks?'\n'+d.remarks:'',
    '',
    `Kindly respond at your earliest${d.responseBy?' — by '+fmtDate(d.responseBy):''}.`,
    '',
    `Yours faithfully,\n${d.preparedby||d.fromContact}${d.fromDesig?' — '+d.fromDesig:''}\n${d.fromCompany}${d.fromPhone?' | '+d.fromPhone:''}${d.fromEmail?'\n'+d.fromEmail:''}`,
  ].filter(v=>v!==null&&v!==undefined).join('\n');

  document.getElementById('printArea').innerHTML=`
    <div class="print-doc">
      <div class="print-hdr"><div class="print-hdr-title">Import Letter For Enquiry</div><div class="print-hdr-sub">Ref: ${d.refno} &nbsp;|&nbsp; ${d.fromCompany}</div></div>
      <div class="print-meta">
        <div class="print-meta-item"><span class="print-meta-lbl">To:</span><span class="print-meta-val">${d.supName}${d.supCountry?', '+d.supCountry:''}</span></div>
        <div class="print-meta-item"><span class="print-meta-lbl">Date:</span><span class="print-meta-val">${fmtDate(d.date)}</span></div>
        <div class="print-meta-item"><span class="print-meta-lbl">From:</span><span class="print-meta-val">${d.fromCompany}${d.fromAddr?', '+d.fromAddr:''}</span></div>
        <div class="print-meta-item"><span class="print-meta-lbl">Ref No.:</span><span class="print-meta-val">${d.refno}</span></div>
        <div class="print-meta-item" style="grid-column:1/-1;"><span class="print-meta-lbl">Subject:</span><span class="print-meta-val">Import Enquiry for ${rows[0]?.desc||'Products'}</span></div>
      </div>
      <table class="print-ptbl">
        <thead><tr><th>Product Description</th><th>HS Code</th><th>Qty</th><th>Unit</th><th>Specifications</th></tr></thead>
        <tbody>${prodBody}</tbody>
      </table>
      <div class="print-body">${body}</div>
      <div class="print-sigs">
        <div class="print-sig"><div style="height:30px;"></div><div class="print-sig-line">${d.preparedby||'Prepared By'}<br/>${d.fromDesig||''}</div></div>
        <div class="print-sig"><div style="height:30px;"></div><div class="print-sig-line">${d.signatory||d.fromCompany}<br/>Authorised Signatory</div></div>
      </div>
      <div class="print-footer">Generated by IMPEXIO — Import Letter For Enquiry Module</div>
    </div>`;
  window.print();
}
function quickPrint(id){ loadRecord(id); setTimeout(()=>{goToStep(4);setTimeout(printRecord,400);},200); }

// ── Toast ─────────────────────────────────────────────────────
function showToastIle(icon,msg){
  let t=document.getElementById('ile-toast');
  if(!t){t=document.createElement('div');t.id='ile-toast';t.style.cssText=`position:fixed;bottom:1.5rem;right:1.5rem;background:var(--navy);color:#fff;padding:0.7rem 1.2rem;border-radius:10px;font-size:0.82rem;font-weight:600;display:flex;gap:0.5rem;align-items:center;box-shadow:0 8px 24px rgba(15,37,64,0.3);z-index:9999;opacity:0;transition:opacity 0.3s;pointer-events:none;border-left:3px solid var(--gold);`;document.body.appendChild(t);}
  t.innerHTML=`<span>${icon}</span><span>${msg}</span>`;t.style.opacity='1';clearTimeout(t._t);t._t=setTimeout(()=>{t.style.opacity='0';},3000);
}

// ══════════════════════════════════════════════════════════════
//  ILE MASTER DATA SYSTEM — Shared impexio_master_* keys
// ══════════════════════════════════════════════════════════════

const ILE_MASTER_CONFIG = {
  company: {
    label:'Company', icon:'🏢', key:'impexio_master_company',
    fields:[
      {id:'name',    label:'Company Name',   placeholder:'e.g. Impexio Trade Solutions Pvt. Ltd.', req:true},
      {id:'addr1',   label:'Address / City', placeholder:'e.g. GIFT City, Gandhinagar, India'},
      {id:'contact', label:'Phone',          placeholder:'+91 98765 43210'},
      {id:'email',   label:'Email',          placeholder:'imports@company.com'},
    ],
    display:r=>r.name, sub:r=>r.addr1||'',
    fill:(r,tid)=>{
      const el=document.getElementById(tid);if(el){el.value=r.name||'';el.dispatchEvent(new Event('input'));}
      const addr=document.getElementById('f_from_addr');   if(addr&&r.addr1&&!addr.value) addr.value=r.addr1;
      const phone=document.getElementById('f_from_phone'); if(phone&&r.contact&&!phone.value) phone.value=r.contact;
      const email=document.getElementById('f_from_email'); if(email&&r.email&&!email.value)   email.value=r.email;
    }
  },
  supplier: {
    label:'Supplier', icon:'🌏', key:'impexio_master_supplier',
    fields:[
      {id:'name',    label:'Supplier / Company Name', placeholder:'e.g. Global Ceramic Exports Ltd.', req:true},
      {id:'contact', label:'Contact Person',          placeholder:'e.g. Mr. Wang Li'},
      {id:'country', label:'Country',                 placeholder:'e.g. China'},
      {id:'addr',    label:'Address',                 placeholder:'City, Province, Country'},
      {id:'email',   label:'Email',                   placeholder:'supplier@factory.com'},
      {id:'website', label:'Website',                 placeholder:'www.factory.com'},
    ],
    display:r=>r.name, sub:r=>[r.contact,r.country].filter(Boolean).join(', '),
    fill:(r,tid)=>{
      const el=document.getElementById(tid);if(el){el.value=r.name||'';el.dispatchEvent(new Event('input'));}
      const co=document.getElementById('f_sup_contact'); if(co&&r.contact) co.value=r.contact;
      const ct=document.getElementById('f_sup_country'); if(ct&&r.country) ct.value=r.country;
      const ad=document.getElementById('f_sup_addr');    if(ad&&r.addr)    ad.value=r.addr;
      const em=document.getElementById('f_sup_email');   if(em&&r.email)   em.value=r.email;
      const we=document.getElementById('f_sup_website'); if(we&&r.website) we.value=r.website;
    }
  },
  product: {
    label:'Product', icon:'📦', key:'impexio_master_product',
    fields:[
      {id:'name',   label:'Product Name', placeholder:'e.g. Ceramic Floor Tiles', req:true},
      {id:'hscode', label:'HS Code',      placeholder:'e.g. 6907.21'},
      {id:'unit',   label:'Unit',         placeholder:'e.g. SQM / KGS / PCS'},
    ],
    display:r=>r.name, sub:r=>r.hscode?'HS: '+r.hscode:'',
    fill:(r,tid)=>{
      const el=document.getElementById(tid);if(el){el.value=r.name||'';el.dispatchEvent(new Event('input'));}
      // Auto fill hs and unit in same row
      const rowId=tid.replace('r_desc_','');
      const hs=document.getElementById('r_hs_'+rowId);   if(hs&&r.hscode&&!hs.value) hs.value=r.hscode;
      const un=document.getElementById('r_unit_'+rowId); if(un&&r.unit&&!un.value)   un.value=r.unit;
    }
  },
  port: {
    label:'Port', icon:'⚓', key:'impexio_master_port',
    fields:[
      {id:'name',    label:'Port Name',  placeholder:'e.g. Mundra Port', req:true},
      {id:'code',    label:'Port Code',  placeholder:'e.g. INMUN'},
      {id:'country', label:'Country',    placeholder:'e.g. India'},
    ],
    display:r=>r.name, sub:r=>[r.code,r.country].filter(Boolean).join(' · '),
    fill:(r,tid)=>{const el=document.getElementById(tid);if(el){el.value=r.name;el.dispatchEvent(new Event('input'));}}
  },
  incoterms: {
    label:'Incoterms', icon:'📜', key:'impexio_master_incoterms',
    fields:[
      {id:'term', label:'Incoterm',    placeholder:'e.g. CIF / FOB / EXW', req:true},
      {id:'desc', label:'Description', placeholder:'e.g. Cost Insurance Freight'},
    ],
    display:r=>r.term, sub:r=>r.desc||'',
    fill:(r,tid)=>{const el=document.getElementById(tid);if(el){el.value=r.term;el.dispatchEvent(new Event('input'));}}
  },
  payterms: {
    label:'Payment Terms', icon:'💳', key:'impexio_master_payterms',
    fields:[
      {id:'term', label:'Payment Term', placeholder:'e.g. 30% Advance, 70% against BL', req:true},
      {id:'note', label:'Note',         placeholder:'Additional note'},
    ],
    display:r=>r.term, sub:r=>r.note||'',
    fill:(r,tid)=>{const el=document.getElementById(tid);if(el){el.value=r.term;el.dispatchEvent(new Event('input'));}}
  },
  currency: {
    label:'Currency', icon:'💱', key:'impexio_master_currency',
    fields:[
      {id:'name', label:'Currency Name', placeholder:'e.g. US Dollar', req:true},
      {id:'code', label:'Currency Code', placeholder:'e.g. USD'},
      {id:'rate', label:'Rate (1=INR)',  placeholder:'e.g. 85.40'},
    ],
    display:r=>r.code?r.code+' — '+r.name:r.name, sub:r=>r.rate?'₹'+r.rate+' per unit':'',
    fill:(r,tid)=>{const el=document.getElementById(tid);if(el){el.value=r.code||r.name;el.dispatchEvent(new Event('input'));}}
  },
  location: {
    label:'Location', icon:'📍', key:'impexio_master_location',
    fields:[
      {id:'name',    label:'City & Country', placeholder:'e.g. Guangzhou, China', req:true},
      {id:'country', label:'Country Only',   placeholder:'e.g. China'},
    ],
    display:r=>r.name, sub:r=>r.country||'',
    fill:(r,tid)=>{const el=document.getElementById(tid);if(el){el.value=r.name;el.dispatchEvent(new Event('input'));}}
  },
  signatory: {
    label:'Signatory', icon:'✍️', key:'impexio_master_signatory',
    fields:[
      {id:'name',        label:'Full Name',    placeholder:'e.g. Rajesh Kumar Sharma', req:true},
      {id:'designation', label:'Designation',  placeholder:'e.g. Import Manager'},
      {id:'email',       label:'Email',        placeholder:'name@company.com'},
    ],
    display:r=>r.name, sub:r=>r.designation||'',
    fill:(r,tid)=>{
      const el=document.getElementById(tid);if(el){el.value=r.name||'';el.dispatchEvent(new Event('input'));}
      const desig=document.getElementById('f_from_desig'); if(desig&&r.designation&&!desig.value) desig.value=r.designation;
      const email=document.getElementById('f_from_email'); if(email&&r.email&&!email.value) email.value=r.email;
    }
  }
};

function getIleMaster(type){try{return JSON.parse(localStorage.getItem(ILE_MASTER_CONFIG[type].key)||'[]');}catch{return[];}}
function setIleMaster(type,data){localStorage.setItem(ILE_MASTER_CONFIG[type].key,JSON.stringify(data));}

let ileMasterPickTarget=null, ileMasterEditType=null, ileMasterEditIdx=null;

function ensureIleMasterPanel(){
  if(document.getElementById('ileMasterPanel')) return;
  const ov=document.createElement('div');ov.id='ileMasterOverlay';ov.style.cssText='display:none;position:fixed;inset:0;background:rgba(15,37,64,0.45);backdrop-filter:blur(3px);z-index:1000;';ov.onclick=closeIleMaster;
  const panel=document.createElement('div');panel.id='ileMasterPanel';panel.style.cssText='position:fixed;top:0;right:-420px;width:400px;max-width:95vw;bottom:0;background:#fff;z-index:1001;box-shadow:-8px 0 48px rgba(15,37,64,0.18);display:flex;flex-direction:column;transition:right 0.3s cubic-bezier(.4,0,.2,1);';
  panel.innerHTML=`<div style="padding:1.1rem 1.25rem;background:#0f5c52;display:flex;align-items:flex-start;justify-content:space-between;"><div><div id="ileMasterTitle" style="font-family:var(--font-display);font-size:1.05rem;font-weight:700;color:#fff;">Master Data</div><div style="font-size:0.68rem;color:rgba(255,255,255,0.6);margin-top:0.15rem;">Click a record to auto-fill</div></div><button onclick="closeIleMaster()" style="background:rgba(255,255,255,0.15);border:none;color:#fff;width:28px;height:28px;border-radius:50%;cursor:pointer;font-size:0.85rem;">✕</button></div><div id="ileMasterTabs" style="display:flex;border-bottom:1px solid #dde3f0;background:#fafaf7;overflow-x:auto;"></div><div id="ileMasterBody" style="flex:1;overflow:hidden;"></div>`;
  const mfOv=document.createElement('div');mfOv.id='ileMfOverlay';mfOv.style.cssText='display:none;position:fixed;inset:0;background:rgba(15,37,64,0.5);backdrop-filter:blur(4px);z-index:1100;align-items:center;justify-content:center;padding:1rem;';
  mfOv.innerHTML=`<div style="background:#fff;border-radius:16px;width:100%;max-width:480px;box-shadow:0 24px 72px rgba(15,37,64,0.22);overflow:hidden;"><div style="background:#0f2540;padding:1rem 1.25rem;display:flex;align-items:center;justify-content:space-between;"><div id="ileMfTitle" style="font-weight:700;font-size:0.95rem;color:#fff;">Add Record</div><button onclick="closeIleMasterForm()" style="background:rgba(255,255,255,0.15);border:none;color:#fff;width:28px;height:28px;border-radius:50%;cursor:pointer;">✕</button></div><div id="ileMfBody" style="padding:1.25rem;display:flex;flex-direction:column;gap:0.75rem;max-height:60vh;overflow-y:auto;"></div><div style="padding:0.85rem 1.25rem;border-top:1px solid #dde3f0;display:flex;justify-content:flex-end;gap:0.5rem;"><button onclick="closeIleMasterForm()" style="padding:0.5rem 1.4rem;border-radius:50px;font-size:0.82rem;font-weight:700;cursor:pointer;background:#f4f3ee;color:#3d5475;border:1.5px solid #dde3f0;">Cancel</button><button onclick="saveIleMasterRecord()" style="padding:0.5rem 1.4rem;border-radius:50px;font-size:0.82rem;font-weight:700;cursor:pointer;background:#0f2540;color:#fff;border:none;">💾 Save</button></div></div>`;
  const acDrop=document.createElement('div');acDrop.id='ileAcDropdown';acDrop.style.cssText='position:fixed;z-index:99999;background:#fff;border:1.5px solid #dde3f0;border-radius:12px;box-shadow:0 16px 48px rgba(15,37,64,0.16);min-width:260px;max-width:380px;max-height:280px;overflow-y:auto;display:none;font-family:Outfit,sans-serif;';
  document.body.appendChild(ov);document.body.appendChild(panel);document.body.appendChild(mfOv);document.body.appendChild(acDrop);
}

function openIleMaster(tab,targetFieldId){ensureIleMasterPanel();ileMasterPickTarget=targetFieldId||null;document.getElementById('ileMasterOverlay').style.display='block';document.getElementById('ileMasterPanel').style.right='0';buildIleMasterTabs(tab||'company');}
function closeIleMaster(){const p=document.getElementById('ileMasterPanel');if(p)p.style.right='-420px';const o=document.getElementById('ileMasterOverlay');if(o)o.style.display='none';ileMasterPickTarget=null;}

function buildIleMasterTabs(activeType){
  const types=Object.keys(ILE_MASTER_CONFIG);
  document.getElementById('ileMasterTabs').innerHTML=types.map(t=>{const c=ILE_MASTER_CONFIG[t];return`<div onclick="switchIleMasterTab('${t}')" id="ilemt-${t}" style="padding:0.6rem 0.8rem;font-size:0.73rem;font-weight:600;color:${t===activeType?'#0f2540':'#6b7fa3'};cursor:pointer;white-space:nowrap;border-bottom:2px solid ${t===activeType?'#c9a84c':'transparent'};transition:all 0.2s;">${c.icon} ${c.label}</div>`;}).join('');
  document.getElementById('ileMasterBody').innerHTML=types.map(t=>`<div id="ilems-${t}" style="display:${t===activeType?'flex':'none'};height:100%;flex-direction:column;"><div style="padding:0.75rem 1rem;border-bottom:1px solid #eef1f8;"><button onclick="openIleMasterForm('${t}')" style="width:100%;padding:0.6rem;background:#0f2540;color:#fff;border:none;border-radius:8px;font-size:0.82rem;font-weight:700;cursor:pointer;">+ Add ${ILE_MASTER_CONFIG[t].label}</button></div><div id="ileml-${t}" style="flex:1;overflow-y:auto;padding:0.5rem;"></div></div>`).join('');
  document.getElementById('ileMasterTitle').textContent=ILE_MASTER_CONFIG[activeType].icon+' '+ILE_MASTER_CONFIG[activeType].label+' Master';
  types.forEach(t=>renderIleMasterList(t));
}
function switchIleMasterTab(type){Object.keys(ILE_MASTER_CONFIG).forEach(t=>{const tab=document.getElementById('ilemt-'+t);const sec=document.getElementById('ilems-'+t);if(tab){tab.style.color=t===type?'#0f2540':'#6b7fa3';tab.style.borderBottom=t===type?'2px solid #c9a84c':'2px solid transparent';}if(sec)sec.style.display=t===type?'flex':'none';});document.getElementById('ileMasterTitle').textContent=ILE_MASTER_CONFIG[type].icon+' '+ILE_MASTER_CONFIG[type].label+' Master';renderIleMasterList(type);}
function renderIleMasterList(type){const cfg=ILE_MASTER_CONFIG[type];const data=getIleMaster(type);const listEl=document.getElementById('ileml-'+type);if(!listEl)return;if(!data.length){listEl.innerHTML=`<div style="text-align:center;padding:2.5rem 1rem;color:#6b7fa3;"><div style="font-size:2rem;opacity:0.35;margin-bottom:0.5rem;">${cfg.icon}</div><div style="font-size:0.85rem;font-weight:600;">No ${cfg.label} records yet</div></div>`;return;}listEl.innerHTML=data.map((r,i)=>`<div onclick="pickIleMasterRecord('${type}',${i})" style="display:flex;align-items:center;gap:0.75rem;padding:0.75rem 0.85rem;border-radius:10px;border:1px solid #dde3f0;margin-bottom:0.5rem;cursor:pointer;background:#fff;transition:all 0.18s;" onmouseover="this.style.background='#f4f3ee'" onmouseout="this.style.background='#fff'"><div style="width:34px;height:34px;border-radius:8px;background:#0f2540;color:#fff;display:flex;align-items:center;justify-content:center;font-size:0.9rem;flex-shrink:0;">${cfg.icon}</div><div style="flex:1;min-width:0;"><div style="font-size:0.83rem;font-weight:700;color:#0f2540;">${cfg.display(r)}</div><div style="font-size:0.7rem;color:#6b7fa3;">${cfg.sub(r)}</div></div><div style="display:flex;gap:0.3rem;" onclick="event.stopPropagation()"><button onclick="pickIleMasterRecord('${type}',${i})" style="padding:0.25rem 0.55rem;border-radius:6px;font-size:0.7rem;font-weight:700;border:none;cursor:pointer;background:#0f2540;color:#fff;">↗ Use</button><button onclick="openIleMasterForm('${type}',${i})" style="padding:0.25rem 0.55rem;border-radius:6px;font-size:0.7rem;font-weight:700;border:none;cursor:pointer;background:#f4f3ee;color:#3d5475;">✏️</button><button onclick="deleteIleMaster('${type}',${i})" style="padding:0.25rem 0.55rem;border-radius:6px;font-size:0.7rem;font-weight:700;border:none;cursor:pointer;background:#fef2f2;color:#dc2626;">🗑</button></div></div>`).join('');}
function pickIleMasterRecord(type,idx){const cfg=ILE_MASTER_CONFIG[type];const data=getIleMaster(type);const r=data[idx];if(!r)return;if(ileMasterPickTarget){cfg.fill(r,ileMasterPickTarget);showToastIle('✅',cfg.label+' selected: '+cfg.display(r));closeIleMaster();}}
function openIleMasterForm(type,idx){ileMasterEditType=type;ileMasterEditIdx=(idx!==undefined&&idx!==null)?idx:null;const cfg=ILE_MASTER_CONFIG[type];const data=getIleMaster(type);const rec=ileMasterEditIdx!==null?data[ileMasterEditIdx]:null;document.getElementById('ileMfTitle').textContent=rec?`✏️ Edit ${cfg.label}`:`+ Add ${cfg.label}`;document.getElementById('ileMfBody').innerHTML=cfg.fields.map(f=>`<div style="display:flex;flex-direction:column;gap:0.3rem;"><label style="font-size:0.7rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#3d5475;">${f.label}${f.req?' *':''}</label><input id="ilemf_${f.id}" type="text" placeholder="${f.placeholder}" value="${rec?(rec[f.id]||''):''}" style="padding:0.65rem 0.85rem;border:1.5px solid #dde3f0;border-radius:8px;font-size:0.88rem;font-family:inherit;width:100%;box-sizing:border-box;" onfocus="this.style.borderColor='#0f2540'" onblur="this.style.borderColor='#dde3f0'"/></div>`).join('');document.getElementById('ileMfOverlay').style.display='flex';setTimeout(()=>{const f=document.querySelector('#ileMfBody input');if(f)f.focus();},100);}
function closeIleMasterForm(){document.getElementById('ileMfOverlay').style.display='none';ileMasterEditType=null;ileMasterEditIdx=null;}
function saveIleMasterRecord(){const type=ileMasterEditType;if(!type)return;const cfg=ILE_MASTER_CONFIG[type];const data=getIleMaster(type);const rec={};let valid=true;cfg.fields.forEach(f=>{const el=document.getElementById('ilemf_'+f.id);if(el)rec[f.id]=el.value.trim();if(f.req&&!rec[f.id]){valid=false;el.style.borderColor='#ef4444';}else if(el)el.style.borderColor='#dde3f0';});if(!valid){showToastIle('⚠️','Please fill all required fields!');return;}if(ileMasterEditIdx!==null){data[ileMasterEditIdx]=rec;}else{data.push(rec);}setIleMaster(type,data);closeIleMasterForm();renderIleMasterList(type);showToastIle('✅',cfg.label+' saved!');}
function deleteIleMaster(type,idx){if(!confirm('Delete this record?'))return;const data=getIleMaster(type);data.splice(idx,1);setIleMaster(type,data);renderIleMasterList(type);showToastIle('🗑','Deleted.');}

// Autocomplete
const ILE_FIELD_MAP={
  'f_from_company': {type:'company',   display:r=>r.name,  sub:r=>r.addr1||''},
  'f_from_contact': {type:'signatory', display:r=>r.name,  sub:r=>r.designation||''},
  'f_sup_name':     {type:'supplier',  display:r=>r.name,  sub:r=>[r.contact,r.country].filter(Boolean).join(', ')},
  'f_sup_country':  {type:'location',  display:r=>r.name,  sub:r=>r.country||''},
  'f_pod':          {type:'port',      display:r=>r.name,  sub:r=>[r.code,r.country].filter(Boolean).join(' · ')},
  'f_incoterms':    {type:'incoterms', display:r=>r.term,  sub:r=>r.desc||''},
  'f_payment_terms':{type:'payterms',  display:r=>r.term,  sub:r=>r.note||''},
  'f_currency':     {type:'currency',  display:r=>r.code?r.code+' — '+r.name:r.name, sub:r=>r.rate?'₹'+r.rate:''},
  'f_preparedby':   {type:'signatory', display:r=>r.name,  sub:r=>r.designation||''},
  'f_signatory':    {type:'signatory', display:r=>r.name,  sub:r=>r.designation||''},
};
let ileAcField=null;
function getIleAcDrop(){ensureIleMasterPanel();return document.getElementById('ileAcDropdown');}
function posIleAC(el){const r=el.getBoundingClientRect();const d=getIleAcDrop();d.style.left=r.left+'px';d.style.top=(r.bottom+4)+'px';d.style.width=Math.max(r.width,260)+'px';}
function renderIleAC(fieldId,query){const map=ILE_FIELD_MAP[fieldId];if(!map)return closeIleAC();const data=getIleMaster(map.type);if(!data.length)return closeIleAC();const q=(query||'').toLowerCase().trim();const filtered=q?data.filter(r=>map.display(r).toLowerCase().includes(q)):data;if(!filtered.length)return closeIleAC();const cfg=ILE_MASTER_CONFIG[map.type];const d=getIleAcDrop();d.innerHTML=`<div style="padding:0.45rem 0.75rem;font-size:0.62rem;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#6b7fa3;border-bottom:1px solid #eef1f8;display:flex;align-items:center;justify-content:space-between;"><span>${cfg.icon} Saved ${cfg.label}</span><span style="color:#9aadcc;">${filtered.length} found</span></div>`+filtered.map(r=>{const idx=data.indexOf(r);const sub=map.sub(r);return`<div class="ile-ac-item" onmousedown="event.preventDefault();pickIleAC('${fieldId}',${idx})" style="padding:0.6rem 0.85rem;cursor:pointer;border-bottom:1px solid #f4f3ee;display:flex;align-items:center;gap:0.65rem;transition:background 0.15s;"><div style="width:28px;height:28px;border-radius:7px;background:#f0f2f8;display:flex;align-items:center;justify-content:center;font-size:0.85rem;flex-shrink:0;">${cfg.icon}</div><div style="flex:1;min-width:0;"><div style="font-size:0.82rem;font-weight:600;color:#0f2540;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${map.display(r)}</div>${sub?`<div style="font-size:0.68rem;color:#6b7fa3;margin-top:0.1rem;">${sub}</div>`:''}</div><div style="font-size:0.65rem;color:#c9a84c;font-weight:700;flex-shrink:0;">↗ Use</div></div>`;}).join('');d.querySelectorAll('.ile-ac-item').forEach(el=>{el.addEventListener('mouseover',()=>el.style.background='#f4f3ee');el.addEventListener('mouseout',()=>el.style.background='');});d.style.display='block';posIleAC(document.getElementById(fieldId));}
function pickIleAC(fieldId,idx){const map=ILE_FIELD_MAP[fieldId];if(!map)return;const data=getIleMaster(map.type);const r=data[idx];if(!r)return;ILE_MASTER_CONFIG[map.type].fill(r,fieldId);closeIleAC();showToastIle('✅',map.display(r)+' selected');}
function closeIleAC(){const d=document.getElementById('ileAcDropdown');if(d)d.style.display='none';ileAcField=null;}

// Product row autocomplete
function attachIleProductAC(rowId){
  setTimeout(()=>{
    const descEl=document.getElementById('r_desc_'+rowId);if(!descEl)return;
    descEl.addEventListener('focus',()=>renderIleRowAC(rowId,descEl.value));
    descEl.addEventListener('click',()=>renderIleRowAC(rowId,descEl.value));
    descEl.addEventListener('input',()=>renderIleRowAC(rowId,descEl.value));
    descEl.addEventListener('keydown',e=>{
      if(e.key==='Escape'){closeIleAC();return;}
      const d=document.getElementById('ileAcDropdown');if(!d||d.style.display==='none')return;
      const items=d.querySelectorAll('.ile-row-ac-item');const active=d.querySelector('.ile-row-ac-item.ac-active');
      let idx=-1;items.forEach((it,i)=>{if(it===active)idx=i;});
      if(e.key==='ArrowDown'){e.preventDefault();const next=idx<items.length-1?idx+1:0;items.forEach(i=>{i.classList.remove('ac-active');i.style.background='';});items[next].classList.add('ac-active');items[next].style.background='#f4f3ee';items[next].scrollIntoView({block:'nearest'});}
      if(e.key==='ArrowUp'){e.preventDefault();const prev=idx>0?idx-1:items.length-1;items.forEach(i=>{i.classList.remove('ac-active');i.style.background='';});items[prev].classList.add('ac-active');items[prev].style.background='#f4f3ee';items[prev].scrollIntoView({block:'nearest'});}
      if(e.key==='Enter'&&active){e.preventDefault();active.dispatchEvent(new MouseEvent('mousedown'));}
    });
  },50);
}
function renderIleRowAC(rowId,query){
  const data=getIleMaster('product');if(!data.length)return closeIleAC();
  const q=(query||'').toLowerCase().trim();const filtered=q?data.filter(r=>r.name.toLowerCase().includes(q)):data;if(!filtered.length)return closeIleAC();
  const d=getIleAcDrop();
  d.innerHTML=`<div style="padding:0.45rem 0.75rem;font-size:0.62rem;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#6b7fa3;border-bottom:1px solid #eef1f8;display:flex;align-items:center;justify-content:space-between;"><span>📦 Saved Products</span><span style="color:#9aadcc;">${filtered.length} found</span></div>`+
  filtered.map(r=>{const idx=data.indexOf(r);const sub=[r.hscode?'HS:'+r.hscode:'',r.unit].filter(Boolean).join(' · ');return`<div class="ile-row-ac-item" onmousedown="event.preventDefault();pickIleRowProduct(${rowId},${idx})" style="padding:0.6rem 0.85rem;cursor:pointer;border-bottom:1px solid #f4f3ee;display:flex;align-items:center;gap:0.65rem;transition:background 0.15s;"><div style="width:28px;height:28px;border-radius:7px;background:#f0f2f8;display:flex;align-items:center;justify-content:center;font-size:0.85rem;flex-shrink:0;">📦</div><div style="flex:1;min-width:0;"><div style="font-size:0.82rem;font-weight:600;color:#0f2540;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${r.name}</div>${sub?`<div style="font-size:0.68rem;color:#6b7fa3;margin-top:0.1rem;">${sub}</div>`:''}</div><div style="font-size:0.65rem;color:#c9a84c;font-weight:700;flex-shrink:0;">↗ Use</div></div>`;}).join('');
  d.querySelectorAll('.ile-row-ac-item').forEach(el=>{el.addEventListener('mouseover',()=>el.style.background='#f4f3ee');el.addEventListener('mouseout',()=>el.style.background='');});
  d.style.display='block';const descEl=document.getElementById('r_desc_'+rowId);if(descEl)posIleAC(descEl);
}
function pickIleRowProduct(rowId,idx){const data=getIleMaster('product');const r=data[idx];if(!r)return;ILE_MASTER_CONFIG.product.fill(r,'r_desc_'+rowId);closeIleAC();showToastIle('📦',r.name+' selected');}

document.addEventListener('DOMContentLoaded',()=>{
  setTimeout(()=>{
    ensureIleMasterPanel();
    Object.keys(ILE_FIELD_MAP).forEach(fieldId=>{
      const el=document.getElementById(fieldId);if(!el)return;
      el.addEventListener('focus',()=>{ileAcField=fieldId;renderIleAC(fieldId,el.value);});
      el.addEventListener('click',()=>{ileAcField=fieldId;renderIleAC(fieldId,el.value);});
      el.addEventListener('input',()=>{if(ileAcField===fieldId)renderIleAC(fieldId,el.value);});
      el.addEventListener('keydown',e=>{
        if(e.key==='Escape'){closeIleAC();return;}
        const d=document.getElementById('ileAcDropdown');if(!d||d.style.display==='none')return;
        const items=d.querySelectorAll('.ile-ac-item');const active=d.querySelector('.ile-ac-item.ac-active');
        let idx=-1;items.forEach((it,i)=>{if(it===active)idx=i;});
        if(e.key==='ArrowDown'){e.preventDefault();const next=idx<items.length-1?idx+1:0;items.forEach(i=>{i.classList.remove('ac-active');i.style.background='';});items[next].classList.add('ac-active');items[next].style.background='#f4f3ee';items[next].scrollIntoView({block:'nearest'});}
        if(e.key==='ArrowUp'){e.preventDefault();const prev=idx>0?idx-1:items.length-1;items.forEach(i=>{i.classList.remove('ac-active');i.style.background='';});items[prev].classList.add('ac-active');items[prev].style.background='#f4f3ee';items[prev].scrollIntoView({block:'nearest'});}
        if(e.key==='Enter'&&active){e.preventDefault();active.dispatchEvent(new MouseEvent('mousedown'));}
      });
    });
    document.addEventListener('click',e=>{const d=document.getElementById('ileAcDropdown');if(d&&!d.contains(e.target)&&!Object.keys(ILE_FIELD_MAP).some(id=>document.getElementById(id)===e.target))closeIleAC();});
    window.addEventListener('scroll',()=>{const d=document.getElementById('ileAcDropdown');if(ileAcField&&d&&d.style.display!=='none')posIleAC(document.getElementById(ileAcField));},true);
    [1,2,3].forEach(id=>attachIleProductAC(id));
  },300);
});
