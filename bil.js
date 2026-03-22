/* ============================================================
   bil.js — Export Marketing: Buyer Intro Letter
   IMPEXIO v2
   ============================================================ */

let bilRecords  = JSON.parse(localStorage.getItem('bil_records') || '[]');
let editingId   = null;
let currentStep = 1;
const TOTAL_STEPS = 4;

// ── Init ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadSess();
  populateTopbar();
  setTodayDate();
  autoSetRefNo();
  renderRecords();
  goToStep(1);
});

function setTodayDate() {
  const el = document.getElementById('f_date');
  if (el && !el.value) el.value = new Date().toISOString().split('T')[0];
}
function autoSetRefNo() {
  const el = document.getElementById('f_refno');
  if (el && !el.value) el.value = `BIL/2026/${String(bilRecords.length + 1).padStart(4,'0')}`;
}
function fmtDate(d) {
  if (!d) return '';
  try { return new Date(d).toLocaleDateString('en-IN', {day:'2-digit',month:'long',year:'numeric'}); } catch { return d; }
}
function gv(id) { return document.getElementById(id)?.value?.trim() || ''; }
function sv(id, v) { const el = document.getElementById(id); if (el) el.value = v || ''; }
function setText(id, v) { const el = document.getElementById(id); if (el) el.textContent = v; }

function populateTopbar() {
  const s = sess || {};
  setText('dtbUname', s.username || 'Admin');
  setText('dtbRole',  s.role || 'Administrator');
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
function doLogout() {
  if (confirm('Logout from IMPEXIO?')) { sessionStorage.removeItem('impexio'); window.location.href = 'index.html'; }
}

// ── Step navigation ───────────────────────────────────────────
function goToStep(n) {
  if (n > currentStep) {
    if (n >= 2) {
      if (!gv('f_refno'))     { showToastBil('⚠️','Please enter a Letter Ref. No.'); return; }
      if (!gv('f_date'))      { showToastBil('⚠️','Please select a date.'); return; }
      if (!gv('f_buy_name'))  { showToastBil('⚠️','Please enter the Buyer Contact Name.'); return; }
      if (!gv('f_buy_company')){ showToastBil('⚠️','Please enter the Buyer Company.'); return; }
      if (!gv('f_buy_country')){ showToastBil('⚠️','Please enter the Buyer City & Country.'); return; }
    }
    if (n >= 3) {
      if (!gv('f_co_name'))    { showToastBil('⚠️','Please enter Your Company Name.'); return; }
      if (!gv('f_sender_name')){ showToastBil('⚠️','Please enter the Sender Name.'); return; }
    }
    if (n === 4) {
      if (!gv('f_product1'))   { showToastBil('⚠️','Please enter at least one Product.'); return; }
      generateLetterPreview();
    }
  }

  currentStep = n;
  for (let i = 1; i <= TOTAL_STEPS; i++) {
    document.getElementById(`step_${i}`)?.classList.toggle('hidden', i !== n);
  }
  for (let i = 1; i <= TOTAL_STEPS; i++) {
    const dot = document.getElementById(`pstep_${i}`);
    if (!dot) continue;
    dot.classList.remove('active','done');
    if (i === n) dot.classList.add('active');
    if (i < n)   dot.classList.add('done');
  }
  document.querySelectorAll('.bpb-connector').forEach((c, i) => {
    c.classList.toggle('done', i + 1 < n);
  });
  const subs = {
    1:'Step 1 of 4 — Buyer Details & Reference',
    2:'Step 2 of 4 — Your Company Information',
    3:'Step 3 of 4 — Products & USP',
    4:'Step 4 of 4 — Preview & Print'
  };
  setText('formSub', subs[n] || '');
  updateInfoStrips();
}
function nextStep(from) { goToStep(from + 1); }
function prevStep(from) { goToStep(from - 1); }

function updateInfoStrips() {
  const buyer   = gv('f_buy_name') + (gv('f_buy_company') ? ', ' + gv('f_buy_company') : '');
  const country = gv('f_buy_country') || '—';
  const ref     = gv('f_refno') || '—';
  const company = gv('f_co_name') || '—';
  setText('s2_buyer',   buyer || '—'); setText('s2_country', country); setText('s2_ref', ref);
  setText('s3_buyer',   buyer || '—'); setText('s3_company', company); setText('s3_ref', ref);
  setText('s4_buyer',   buyer || '—'); setText('s4_company', company); setText('s4_ref', ref);
}

// ── Generate Letter Preview ───────────────────────────────────
function generateLetterPreview() {
  const d = {
    refno:         gv('f_refno'),
    date:          gv('f_date'),
    source:        gv('f_source'),
    buyName:       gv('f_buy_name'),
    buyCompany:    gv('f_buy_company'),
    buyDesig:      gv('f_buy_designation'),
    buyAddr1:      gv('f_buy_addr1'),
    buyCountry:    gv('f_buy_country'),
    buyEmail:      gv('f_buy_email'),
    coName:        gv('f_co_name'),
    coSince:       gv('f_co_since'),
    coCity:        gv('f_co_city'),
    coWebsite:     gv('f_co_website'),
    coEmail:       gv('f_co_email'),
    coPhone:       gv('f_co_phone'),
    turnover:      gv('f_turnover'),
    countries:     gv('f_countries'),
    certs:         gv('f_certifications'),
    capacity:      gv('f_capacity'),
    leadtime:      gv('f_leadtime'),
    expYears:      gv('f_exp_years'),
    senderName:    gv('f_sender_name'),
    senderDesig:   gv('f_sender_desig'),
    senderEmail:   gv('f_sender_email'),
    product1:      gv('f_product1'),
    hscode1:       gv('f_hscode1'),
    product2:      gv('f_product2'),
    hscode2:       gv('f_hscode2'),
    otherProducts: gv('f_other_products'),
    usp:           gv('f_usp'),
    offer:         gv('f_offer'),
    cta:           gv('f_cta'),
    remarks:       gv('f_remarks'),
  };

  // Build the letter body
  const salutation = `Dear ${d.buyDesig ? d.buyDesig + ' ' : ''}${d.buyName},`;

  const intro = `We are pleased to introduce ourselves as <strong>${d.coName}</strong>${d.coCity ? ', based in <strong>' + d.coCity + '</strong>' : ''}${d.coSince ? ', established in <strong>' + d.coSince + '</strong>' : ''} — a leading manufacturer and exporter of <strong>${d.product1}${d.product2 ? ' and ' + d.product2 : ''}${d.otherProducts ? ' and allied products' : ''}</strong>.`;

  const companyPara = [
    d.expYears ? `With <strong>${d.expYears}</strong>, we have built a strong reputation for quality, reliability and competitive pricing in international markets.` : '',
    d.countries ? `We are currently supplying to valued buyers in <strong>${d.countries}</strong> and are now looking to expand our presence in your market.` : '',
    (d.certs || d.turnover) ? `Our products are backed by ${d.certs ? `<strong>${d.certs}</strong> certifications` : 'international quality certifications'}${d.turnover ? `, with an annual export turnover of <strong>${d.turnover}</strong>` : ''}.` : ''
  ].filter(Boolean).join(' ');

  // Product highlight box
  const productLines = [];
  if (d.product1) productLines.push(`• <strong>${d.product1}</strong>${d.hscode1 ? ' (HS Code: ' + d.hscode1 + ')' : ''}`);
  if (d.product2) productLines.push(`• <strong>${d.product2}</strong>${d.hscode2 ? ' (HS Code: ' + d.hscode2 + ')' : ''}`);
  if (d.otherProducts) productLines.push(`• ${d.otherProducts}`);

  const uspPara = d.usp ? `Our key competitive advantages include: <strong>${d.usp}</strong>${d.capacity ? `. Our production capacity stands at <strong>${d.capacity}</strong>` : ''}${d.leadtime ? ` with a lead time of <strong>${d.leadtime}</strong>` : ''}.` : '';

  const offerPara = d.offer ? `As an introductory gesture, we would like to offer you: <strong>${d.offer}</strong>. We believe this will give you an opportunity to evaluate our products and services firsthand.` : '';

  const ctaPara = d.cta ? d.cta : `We would be delighted to share our complete product catalogue, price list and sample collection. Kindly share your specific requirements so we can provide you with a competitive quotation at the earliest.`;

  const closing = `We look forward to the opportunity of being your trusted supplier and building a long-term, mutually beneficial business relationship.${d.coWebsite ? ` For more information about our company and products, please visit us at <strong>${d.coWebsite}</strong>.` : ''}`;

  const sign = `${d.senderName || d.coName}${d.senderDesig ? ' — ' + d.senderDesig : ''}\n${d.coName}${d.coCity ? ' | ' + d.coCity : ''}${d.coPhone ? ' | ' + d.coPhone : ''}${d.senderEmail || d.coEmail ? '\n' + (d.senderEmail || d.coEmail) : ''}`;

  // Build preview HTML
  const previewEl = document.getElementById('letterPreviewBody');
  if (!previewEl) return;

  previewEl.innerHTML = `
    <div class="blp-field"><div class="blp-lbl">To:</div><div class="blp-val">${d.buyEmail||'—'} &nbsp;(${d.buyName}${d.buyCompany?', '+d.buyCompany:''})</div></div>
    <div class="blp-field"><div class="blp-lbl">From:</div><div class="blp-val">${d.coEmail||d.senderEmail||'—'} &nbsp;(${d.senderName||d.coName}${d.coName?', '+d.coName:''})</div></div>
    <div class="blp-field"><div class="blp-lbl">Date:</div><div class="blp-val">${fmtDate(d.date)}</div></div>
    <div class="blp-field"><div class="blp-lbl">Ref:</div><div class="blp-val">${d.refno}</div></div>
    <div class="blp-subject">Subject: Introduction — ${d.coName || '[Your Company]'} | ${d.product1 || '[Products]'} — Export Enquiry Welcome</div>
    <div class="blp-div"></div>
    <div class="blp-para">${salutation}</div>
    <div class="blp-para">${intro}</div>
    ${companyPara ? `<div class="blp-para">${companyPara}</div>` : ''}
    ${productLines.length ? `<div class="blp-highlight"><strong>Our Export Products:</strong><br/>${productLines.join('<br/>')}</div>` : ''}
    ${uspPara ? `<div class="blp-para">${uspPara}</div>` : ''}
    ${offerPara ? `<div class="blp-para">${offerPara}</div>` : ''}
    <div class="blp-para">${ctaPara}</div>
    <div class="blp-para">${closing}</div>
    ${d.remarks ? `<div class="blp-para"><em>${d.remarks}</em></div>` : ''}
    <div class="blp-div"></div>
    <div class="blp-sign">
      Yours faithfully,<br/>
      <strong>${sign}</strong>
    </div>`;

  // Update summary
  setText('sum_ref',     d.refno || '—');
  setText('sum_date',    fmtDate(d.date));
  setText('sum_buyer',   d.buyName + (d.buyCompany?', '+d.buyCompany:''));
  setText('sum_company', d.coName || '—');
  setText('sum_product', d.product1 + (d.product2?' & '+d.product2:''));
  setText('sum_country', d.buyCountry || '—');
}

// ── Save / Load records ───────────────────────────────────────
function saveRecord() {
  if (!gv('f_buy_name'))   { showToastBil('⚠️','Please enter the Buyer Name.'); return; }
  if (!gv('f_co_name'))    { showToastBil('⚠️','Please enter Your Company Name.'); return; }
  if (!gv('f_product1'))   { showToastBil('⚠️','Please enter at least one Product.'); return; }

  const rec = {
    id: editingId ?? Date.now(),
    refno: gv('f_refno'), date: gv('f_date'), source: gv('f_source'),
    buyName: gv('f_buy_name'), buyCompany: gv('f_buy_company'),
    buyDesig: gv('f_buy_designation'), buyAddr1: gv('f_buy_addr1'),
    buyCountry: gv('f_buy_country'), buyEmail: gv('f_buy_email'),
    coName: gv('f_co_name'), coSince: gv('f_co_since'), coCity: gv('f_co_city'),
    coWebsite: gv('f_co_website'), coEmail: gv('f_co_email'), coPhone: gv('f_co_phone'),
    turnover: gv('f_turnover'), countries: gv('f_countries'), certs: gv('f_certifications'),
    capacity: gv('f_capacity'), leadtime: gv('f_leadtime'), expYears: gv('f_exp_years'),
    senderName: gv('f_sender_name'), senderDesig: gv('f_sender_desig'), senderEmail: gv('f_sender_email'),
    product1: gv('f_product1'), hscode1: gv('f_hscode1'),
    product2: gv('f_product2'), hscode2: gv('f_hscode2'),
    otherProducts: gv('f_other_products'), usp: gv('f_usp'), offer: gv('f_offer'),
    cta: gv('f_cta'), remarks: gv('f_remarks'),
  };

  if (editingId !== null) {
    const idx = bilRecords.findIndex(r => r.id === editingId);
    if (idx >= 0) bilRecords[idx] = rec;
  } else {
    bilRecords.push(rec);
  }
  localStorage.setItem('bil_records', JSON.stringify(bilRecords));
  renderRecords();
  showToastBil('✅', 'Buyer Intro Letter saved!');
}

function loadRecord(id) {
  const rec = bilRecords.find(r => r.id === id); if (!rec) return;
  editingId = id; clearForm(false);
  const fields = ['refno','date','source','buy_name','buy_company','buy_designation','buy_addr1','buy_country','buy_email',
    'co_name','co_since','co_city','co_website','co_email','co_phone','turnover','countries','certifications',
    'capacity','leadtime','exp_years','sender_name','sender_desig','sender_email',
    'product1','hscode1','product2','hscode2','other_products','usp','offer','cta','remarks'];
  fields.forEach(f => {
    const key = f.replace(/_([a-z])/g, (m,c) => c.toUpperCase());
    const alt = f.replace('buy_','buy').replace('co_','co').replace('sender_','sender');
    sv('f_' + f, rec[key] || rec[f.replace('_','')] || rec[alt] || '');
  });
  // manual mapping for camelCase mismatches
  sv('f_refno', rec.refno); sv('f_date', rec.date); sv('f_source', rec.source);
  sv('f_buy_name', rec.buyName); sv('f_buy_company', rec.buyCompany);
  sv('f_buy_designation', rec.buyDesig); sv('f_buy_addr1', rec.buyAddr1);
  sv('f_buy_country', rec.buyCountry); sv('f_buy_email', rec.buyEmail);
  sv('f_co_name', rec.coName); sv('f_co_since', rec.coSince); sv('f_co_city', rec.coCity);
  sv('f_co_website', rec.coWebsite); sv('f_co_email', rec.coEmail); sv('f_co_phone', rec.coPhone);
  sv('f_turnover', rec.turnover); sv('f_countries', rec.countries); sv('f_certifications', rec.certs);
  sv('f_capacity', rec.capacity); sv('f_leadtime', rec.leadtime); sv('f_exp_years', rec.expYears);
  sv('f_sender_name', rec.senderName); sv('f_sender_desig', rec.senderDesig); sv('f_sender_email', rec.senderEmail);
  sv('f_product1', rec.product1); sv('f_hscode1', rec.hscode1);
  sv('f_product2', rec.product2); sv('f_hscode2', rec.hscode2);
  sv('f_other_products', rec.otherProducts); sv('f_usp', rec.usp); sv('f_offer', rec.offer);
  sv('f_cta', rec.cta); sv('f_remarks', rec.remarks);
  setText('formTitle', 'Edit Buyer Intro Letter');
  goToStep(1);
  document.querySelectorAll('.bll-card').forEach(c => c.classList.remove('active'));
  document.querySelector(`.bll-card[data-id="${id}"]`)?.classList.add('active');
}

function deleteRecord(id) {
  if (!confirm('Delete this record?')) return;
  bilRecords = bilRecords.filter(r => r.id !== id);
  localStorage.setItem('bil_records', JSON.stringify(bilRecords));
  renderRecords(); showToastBil('🗑','Record deleted.');
}

function newEntry() {
  clearForm(true); setText('formTitle','New Buyer Intro Letter');
  editingId = null; autoSetRefNo(); goToStep(1);
  document.querySelectorAll('.bll-card').forEach(c => c.classList.remove('active'));
}

function clearForm(resetAll = true) {
  const ids = ['f_refno','f_date','f_source','f_buy_name','f_buy_company','f_buy_designation',
    'f_buy_addr1','f_buy_country','f_buy_email','f_co_name','f_co_since','f_co_city',
    'f_co_website','f_co_email','f_co_phone','f_turnover','f_countries','f_certifications',
    'f_capacity','f_leadtime','f_exp_years','f_sender_name','f_sender_desig','f_sender_email',
    'f_product1','f_hscode1','f_product2','f_hscode2','f_other_products','f_usp','f_offer','f_cta','f_remarks'];
  ids.forEach(id => sv(id,''));
  const prev = document.getElementById('letterPreviewBody');
  if (prev) prev.innerHTML = `<div class="blp-placeholder"><div class="blp-placeholder-icon">📣</div><div class="blp-placeholder-txt">Letter preview will appear here</div><div class="blp-placeholder-sub">Fill in all required fields to generate the letter</div></div>`;
  if (resetAll) { editingId = null; setTodayDate(); autoSetRefNo(); }
}

// ── Render records ────────────────────────────────────────────
function renderRecords(query = '') {
  const list = document.getElementById('recordsList');
  const q = query.toLowerCase().trim();
  const filtered = bilRecords.filter(r =>
    !q || r.refno?.toLowerCase().includes(q) || r.buyName?.toLowerCase().includes(q) ||
    r.buyCompany?.toLowerCase().includes(q) || r.product1?.toLowerCase().includes(q) || r.buyCountry?.toLowerCase().includes(q)
  );
  if (!filtered.length) {
    list.innerHTML = `<div class="bll-empty"><div style="font-size:1.6rem;opacity:0.35;">📣</div><div class="bll-empty-txt">No records yet</div><div class="bll-empty-sub">Click + New to begin</div></div>`;
    return;
  }
  list.innerHTML = filtered.slice().reverse().map(r => `
    <div class="bll-card${editingId===r.id?' active':''}" data-id="${r.id}" onclick="loadRecord(${r.id})">
      <div class="bll-card-no">${r.refno || '—'}</div>
      <div class="bll-card-buyer">${r.buyName || '—'}${r.buyCompany?' · '+r.buyCompany:''}</div>
      <div class="bll-card-country">🌍 ${r.buyCountry || '—'}</div>
      <div class="bll-card-row">
        <div class="bll-card-date">${fmtDate(r.date)}</div>
        <div class="bll-card-prod">${r.product1 || ''}</div>
      </div>
      <div class="bll-card-acts">
        <button class="bll-act edit" onclick="event.stopPropagation();loadRecord(${r.id})">✏️ Edit</button>
        <button class="bll-act prnt" onclick="event.stopPropagation();quickPrint(${r.id})">🖨 Print</button>
        <button class="bll-act del"  onclick="event.stopPropagation();deleteRecord(${r.id})">🗑</button>
      </div>
    </div>`).join('');
}

function filterRecords() { renderRecords(document.getElementById('searchInput')?.value || ''); }

// ── Print ─────────────────────────────────────────────────────
function printRecord() {
  if (!gv('f_product1')) { showToastBil('⚠️','Please complete the form first.'); return; }
  generateLetterPreview();
  const d = {
    refno: gv('f_refno'), date: gv('f_date'),
    buyName: gv('f_buy_name'), buyCompany: gv('f_buy_company'),
    buyDesig: gv('f_buy_designation'), buyAddr1: gv('f_buy_addr1'), buyCountry: gv('f_buy_country'),
    coName: gv('f_co_name'), coCity: gv('f_co_city'), coPhone: gv('f_co_phone'),
    coEmail: gv('f_co_email'), coWebsite: gv('f_co_website'), coSince: gv('f_co_since'),
    countries: gv('f_countries'), certs: gv('f_certifications'), capacity: gv('f_capacity'),
    leadtime: gv('f_leadtime'), expYears: gv('f_exp_years'),
    senderName: gv('f_sender_name'), senderDesig: gv('f_sender_desig'), senderEmail: gv('f_sender_email'),
    product1: gv('f_product1'), hscode1: gv('f_hscode1'),
    product2: gv('f_product2'), hscode2: gv('f_hscode2'),
    otherProducts: gv('f_other_products'), usp: gv('f_usp'), offer: gv('f_offer'),
    cta: gv('f_cta'), remarks: gv('f_remarks'),
  };

  const productList = [
    d.product1 ? `- ${d.product1}${d.hscode1?' (HS: '+d.hscode1+')':''}` : '',
    d.product2 ? `- ${d.product2}${d.hscode2?' (HS: '+d.hscode2+')':''}` : '',
    d.otherProducts ? `- ${d.otherProducts}` : ''
  ].filter(Boolean).join('\n');

  const body = [
    `Dear ${d.buyDesig?d.buyDesig+' ':''}${d.buyName},`,
    '',
    `We are pleased to introduce ourselves as ${d.coName}${d.coCity?', based in '+d.coCity:''}${d.coSince?', established in '+d.coSince:''} — a leading manufacturer and exporter of ${d.product1}${d.product2?' and '+d.product2:''}.`,
    '',
    d.expYears?`With ${d.expYears}, we have built a strong reputation for quality, reliability and competitive pricing in international markets.`:'',
    d.countries?`We are currently supplying to buyers in ${d.countries} and are expanding our presence in your market.`:'',
    (d.certs||d.capacity)?`Our products are backed by ${d.certs||'international quality certifications'}${d.capacity?'. Production capacity: '+d.capacity:''}.`:'',
    '',
    'Our Export Products:',
    productList,
    '',
    d.usp?`Our key competitive advantages: ${d.usp}.`:'',
    d.offer?`\nIntroductory offer: ${d.offer}.`:'',
    '',
    d.cta||`We would be delighted to share our product catalogue, price list and samples. Kindly share your requirements so we can provide a competitive quotation.`,
    '',
    `We look forward to building a long-term, mutually beneficial business relationship.${d.coWebsite?' | '+d.coWebsite:''}`,
    d.remarks?'\n'+d.remarks:'',
  ].filter(v => v !== null && v !== undefined).join('\n');

  document.getElementById('printArea').innerHTML = `
    <div class="print-doc">
      <div class="print-hdr">
        <div class="print-hdr-title">${d.coName || 'IMPEXIO'}</div>
        <div class="print-hdr-sub">Export Marketing — Buyer Introduction Letter &nbsp;|&nbsp; Ref: ${d.refno}</div>
      </div>
      <div class="print-meta">
        <div class="print-meta-item"><span class="print-meta-lbl">To:</span><span class="print-meta-val">${d.buyName}${d.buyCompany?', '+d.buyCompany:''}</span></div>
        <div class="print-meta-item"><span class="print-meta-lbl">Country:</span><span class="print-meta-val">${d.buyCountry||'—'}</span></div>
        <div class="print-meta-item"><span class="print-meta-lbl">From:</span><span class="print-meta-val">${d.senderName||d.coName}${d.coName?', '+d.coName:''}</span></div>
        <div class="print-meta-item"><span class="print-meta-lbl">Date:</span><span class="print-meta-val">${fmtDate(d.date)}</span></div>
        <div class="print-meta-item" style="grid-column:1/-1;"><span class="print-meta-lbl">Subject:</span><span class="print-meta-val">Introduction — ${d.coName} | ${d.product1}${d.product2?' & '+d.product2:''} — Export Enquiry Welcome</span></div>
      </div>
      <div class="print-body">${body}</div>
      <div class="print-sigs">
        <div class="print-sig">
          <div style="height:32px;"></div>
          <div class="print-sig-line">${d.senderName||'Authorised Signatory'}<br/>${d.senderDesig||''}</div>
        </div>
        <div class="print-sig">
          <div style="height:32px;"></div>
          <div class="print-sig-line">${d.coName||'Company Stamp'}<br/>${d.coPhone||''}</div>
        </div>
      </div>
      <div class="print-footer">Generated by IMPEXIO — Export Marketing Module &nbsp;|&nbsp; Buyer Introduction Letter</div>
    </div>`;
  window.print();
}

function quickPrint(id) {
  loadRecord(id);
  setTimeout(() => { goToStep(4); setTimeout(printRecord, 400); }, 200);
}

// ── Toast ─────────────────────────────────────────────────────
function showToastBil(icon, msg) {
  let t = document.getElementById('bil-toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'bil-toast';
    t.style.cssText = `position:fixed;bottom:1.5rem;right:1.5rem;background:var(--navy);color:#fff;padding:0.7rem 1.2rem;border-radius:10px;font-size:0.82rem;font-weight:600;display:flex;gap:0.5rem;align-items:center;box-shadow:0 8px 24px rgba(15,37,64,0.3);z-index:9999;opacity:0;transition:opacity 0.3s;pointer-events:none;border-left:3px solid var(--gold);`;
    document.body.appendChild(t);
  }
  t.innerHTML = `<span>${icon}</span><span>${msg}</span>`;
  t.style.opacity = '1';
  clearTimeout(t._t);
  t._t = setTimeout(() => { t.style.opacity = '0'; }, 3000);
}

// ══════════════════════════════════════════════════════════════
//  BIL MASTER DATA SYSTEM
//  Shared keys — same data as all other modules
// ══════════════════════════════════════════════════════════════

const BIL_MASTER_CONFIG = {
  company: {
    label:'Company', icon:'🏢', key:'impexio_master_company',
    fields:[
      {id:'name',    label:'Company Name',   placeholder:'e.g. Impexio Trade Solutions Pvt. Ltd.', req:true},
      {id:'addr1',   label:'Address / City', placeholder:'e.g. GIFT City, Gandhinagar'},
      {id:'contact', label:'Phone',          placeholder:'+91 98765 43210'},
      {id:'email',   label:'Email',          placeholder:'exports@company.com'},
      {id:'website', label:'Website',        placeholder:'www.company.com'},
    ],
    display: r => r.name,
    sub:     r => r.addr1 || '',
    fill:    (r, tid) => {
      const el=document.getElementById(tid); if(el){el.value=r.name||'';el.dispatchEvent(new Event('input'));}
      const city=document.getElementById('f_co_city');    if(city&&r.addr1&&!city.value)    city.value=r.addr1;
      const phone=document.getElementById('f_co_phone');  if(phone&&r.contact&&!phone.value) phone.value=r.contact;
      const email=document.getElementById('f_co_email');  if(email&&r.email&&!email.value)   email.value=r.email;
      const web=document.getElementById('f_co_website');  if(web&&r.website&&!web.value)     web.value=r.website;
    }
  },
  buyer: {
    label:'Buyer', icon:'🌍', key:'impexio_master_buyer',
    fields:[
      {id:'name',    label:'Buyer Name',      placeholder:'e.g. Mr. Hans Mueller', req:true},
      {id:'company', label:'Company',         placeholder:'e.g. Euro Ceramics GmbH'},
      {id:'country', label:'City & Country',  placeholder:'e.g. Frankfurt, Germany'},
      {id:'email',   label:'Email',           placeholder:'buyer@company.com'},
    ],
    display: r => r.name,
    sub:     r => [r.company, r.country].filter(Boolean).join(', '),
    fill:    (r, tid) => {
      const el=document.getElementById(tid); if(el){el.value=r.name||'';el.dispatchEvent(new Event('input'));}
      const co=document.getElementById('f_buy_company'); if(co&&r.company) co.value=r.company;
      const ct=document.getElementById('f_buy_country'); if(ct&&r.country) ct.value=r.country;
      const em=document.getElementById('f_buy_email');   if(em&&r.email)   em.value=r.email;
    }
  },
  product: {
    label:'Product', icon:'📦', key:'impexio_master_product',
    fields:[
      {id:'name',   label:'Product Name', placeholder:'e.g. Ceramic Floor Tiles', req:true},
      {id:'hscode', label:'HS Code',      placeholder:'e.g. 6907.21'},
      {id:'unit',   label:'Unit',         placeholder:'e.g. SQM / KGS / PCS'},
    ],
    display: r => r.name,
    sub:     r => r.hscode?'HS: '+r.hscode:'',
    fill:    (r, tid) => {
      const el=document.getElementById(tid); if(el){el.value=r.name||'';el.dispatchEvent(new Event('input'));}
      // Auto fill HS code field if adjacent
      if (tid === 'f_product1' && r.hscode) { const hs=document.getElementById('f_hscode1'); if(hs&&!hs.value) hs.value=r.hscode; }
      if (tid === 'f_product2' && r.hscode) { const hs=document.getElementById('f_hscode2'); if(hs&&!hs.value) hs.value=r.hscode; }
    }
  },
  location: {
    label:'Location', icon:'📍', key:'impexio_master_location',
    fields:[
      {id:'name',    label:'City & Country',  placeholder:'e.g. Frankfurt, Germany', req:true},
      {id:'country', label:'Country Only',    placeholder:'e.g. Germany'},
      {id:'region',  label:'Region / State',  placeholder:'e.g. Hesse'},
    ],
    display: r => r.name,
    sub:     r => r.country || '',
    fill:    (r, tid) => { const el=document.getElementById(tid); if(el){el.value=r.name||'';el.dispatchEvent(new Event('input'));} }
  },
  signatory: {
    label:'Signatory', icon:'✍️', key:'impexio_master_signatory',
    fields:[
      {id:'name',        label:'Full Name',    placeholder:'e.g. Rajesh Kumar Sharma', req:true},
      {id:'designation', label:'Designation',  placeholder:'e.g. Export Manager'},
      {id:'email',       label:'Email',        placeholder:'name@company.com'},
    ],
    display: r => r.name,
    sub:     r => r.designation || '',
    fill:    (r, tid) => {
      const el=document.getElementById(tid); if(el){el.value=r.name||'';el.dispatchEvent(new Event('input'));}
      const desig=document.getElementById('f_sender_desig');  if(desig&&r.designation) desig.value=r.designation;
      const email=document.getElementById('f_sender_email');  if(email&&r.email&&!email.value) email.value=r.email;
    }
  }
};

function getBilMaster(type){ try{return JSON.parse(localStorage.getItem(BIL_MASTER_CONFIG[type].key)||'[]');}catch{return[];} }
function setBilMaster(type,data){ localStorage.setItem(BIL_MASTER_CONFIG[type].key,JSON.stringify(data)); }

let bilMasterPickTarget=null, bilMasterEditType=null, bilMasterEditIdx=null;

function ensureBilMasterPanel() {
  if (document.getElementById('bilMasterPanel')) return;
  const ov=document.createElement('div'); ov.id='bilMasterOverlay';
  ov.style.cssText='display:none;position:fixed;inset:0;background:rgba(15,37,64,0.45);backdrop-filter:blur(3px);z-index:1000;';
  ov.onclick=closeBilMaster;
  const panel=document.createElement('div'); panel.id='bilMasterPanel';
  panel.style.cssText='position:fixed;top:0;right:-420px;width:400px;max-width:95vw;bottom:0;background:#fff;z-index:1001;box-shadow:-8px 0 48px rgba(15,37,64,0.18);display:flex;flex-direction:column;transition:right 0.3s cubic-bezier(.4,0,.2,1);';
  panel.innerHTML=`<div style="padding:1.1rem 1.25rem;background:#0f5c52;display:flex;align-items:flex-start;justify-content:space-between;"><div><div id="bilMasterTitle" style="font-family:var(--font-display);font-size:1.05rem;font-weight:700;color:#fff;">Master Data</div><div style="font-size:0.68rem;color:rgba(255,255,255,0.6);margin-top:0.15rem;">Click a record to auto-fill</div></div><button onclick="closeBilMaster()" style="background:rgba(255,255,255,0.15);border:none;color:#fff;width:28px;height:28px;border-radius:50%;cursor:pointer;font-size:0.85rem;">✕</button></div><div id="bilMasterTabs" style="display:flex;border-bottom:1px solid #dde3f0;background:#fafaf7;overflow-x:auto;"></div><div id="bilMasterBody" style="flex:1;overflow:hidden;"></div>`;
  const mfOv=document.createElement('div'); mfOv.id='bilMfOverlay';
  mfOv.style.cssText='display:none;position:fixed;inset:0;background:rgba(15,37,64,0.5);backdrop-filter:blur(4px);z-index:1100;align-items:center;justify-content:center;padding:1rem;';
  mfOv.innerHTML=`<div style="background:#fff;border-radius:16px;width:100%;max-width:480px;box-shadow:0 24px 72px rgba(15,37,64,0.22);overflow:hidden;"><div style="background:#0f2540;padding:1rem 1.25rem;display:flex;align-items:center;justify-content:space-between;"><div id="bilMfTitle" style="font-weight:700;font-size:0.95rem;color:#fff;">Add Record</div><button onclick="closeBilMasterForm()" style="background:rgba(255,255,255,0.15);border:none;color:#fff;width:28px;height:28px;border-radius:50%;cursor:pointer;">✕</button></div><div id="bilMfBody" style="padding:1.25rem;display:flex;flex-direction:column;gap:0.75rem;"></div><div style="padding:0.85rem 1.25rem;border-top:1px solid #dde3f0;display:flex;justify-content:flex-end;gap:0.5rem;"><button onclick="closeBilMasterForm()" style="padding:0.5rem 1.4rem;border-radius:50px;font-size:0.82rem;font-weight:700;cursor:pointer;background:#f4f3ee;color:#3d5475;border:1.5px solid #dde3f0;">Cancel</button><button onclick="saveBilMasterRecord()" style="padding:0.5rem 1.4rem;border-radius:50px;font-size:0.82rem;font-weight:700;cursor:pointer;background:#0f2540;color:#fff;border:none;">💾 Save</button></div></div>`;
  const acDrop=document.createElement('div'); acDrop.id='bilAcDropdown';
  acDrop.style.cssText='position:fixed;z-index:99999;background:#fff;border:1.5px solid #dde3f0;border-radius:12px;box-shadow:0 16px 48px rgba(15,37,64,0.16);min-width:260px;max-width:380px;max-height:280px;overflow-y:auto;display:none;font-family:Outfit,sans-serif;';
  document.body.appendChild(ov); document.body.appendChild(panel); document.body.appendChild(mfOv); document.body.appendChild(acDrop);
}

function openBilMaster(tab,targetFieldId){ ensureBilMasterPanel(); bilMasterPickTarget=targetFieldId||null; document.getElementById('bilMasterOverlay').style.display='block'; document.getElementById('bilMasterPanel').style.right='0'; buildBilMasterTabs(tab||'company'); }
function closeBilMaster(){ const p=document.getElementById('bilMasterPanel');if(p)p.style.right='-420px';const o=document.getElementById('bilMasterOverlay');if(o)o.style.display='none';bilMasterPickTarget=null; }

function buildBilMasterTabs(activeType){
  const types=Object.keys(BIL_MASTER_CONFIG);
  document.getElementById('bilMasterTabs').innerHTML=types.map(t=>{const c=BIL_MASTER_CONFIG[t];return`<div onclick="switchBilMasterTab('${t}')" id="bilmt-${t}" style="padding:0.65rem 0.9rem;font-size:0.76rem;font-weight:600;color:${t===activeType?'#0f2540':'#6b7fa3'};cursor:pointer;white-space:nowrap;border-bottom:2px solid ${t===activeType?'#c9a84c':'transparent'};transition:all 0.2s;">${c.icon} ${c.label}</div>`;}).join('');
  document.getElementById('bilMasterBody').innerHTML=types.map(t=>`<div id="bilms-${t}" style="display:${t===activeType?'flex':'none'};height:100%;flex-direction:column;"><div style="padding:0.75rem 1rem;border-bottom:1px solid #eef1f8;"><button onclick="openBilMasterForm('${t}')" style="width:100%;padding:0.6rem;background:#0f2540;color:#fff;border:none;border-radius:8px;font-size:0.82rem;font-weight:700;cursor:pointer;">+ Add ${BIL_MASTER_CONFIG[t].label}</button></div><div id="bilml-${t}" style="flex:1;overflow-y:auto;padding:0.5rem;"></div></div>`).join('');
  document.getElementById('bilMasterTitle').textContent=BIL_MASTER_CONFIG[activeType].icon+' '+BIL_MASTER_CONFIG[activeType].label+' Master';
  types.forEach(t=>renderBilMasterList(t));
}
function switchBilMasterTab(type){ Object.keys(BIL_MASTER_CONFIG).forEach(t=>{const tab=document.getElementById('bilmt-'+t);const sec=document.getElementById('bilms-'+t);if(tab){tab.style.color=t===type?'#0f2540':'#6b7fa3';tab.style.borderBottom=t===type?'2px solid #c9a84c':'2px solid transparent';}if(sec)sec.style.display=t===type?'flex':'none';}); document.getElementById('bilMasterTitle').textContent=BIL_MASTER_CONFIG[type].icon+' '+BIL_MASTER_CONFIG[type].label+' Master'; renderBilMasterList(type); }
function renderBilMasterList(type){ const cfg=BIL_MASTER_CONFIG[type];const data=getBilMaster(type);const listEl=document.getElementById('bilml-'+type);if(!listEl)return;if(!data.length){listEl.innerHTML=`<div style="text-align:center;padding:2.5rem 1rem;color:#6b7fa3;"><div style="font-size:2rem;opacity:0.35;margin-bottom:0.5rem;">${cfg.icon}</div><div style="font-size:0.85rem;font-weight:600;">No ${cfg.label} records yet</div></div>`;return;}listEl.innerHTML=data.map((r,i)=>`<div onclick="pickBilMasterRecord('${type}',${i})" style="display:flex;align-items:center;gap:0.75rem;padding:0.75rem 0.85rem;border-radius:10px;border:1px solid #dde3f0;margin-bottom:0.5rem;cursor:pointer;background:#fff;transition:all 0.18s;" onmouseover="this.style.background='#f4f3ee'" onmouseout="this.style.background='#fff'"><div style="width:34px;height:34px;border-radius:8px;background:#0f2540;color:#fff;display:flex;align-items:center;justify-content:center;font-size:0.9rem;flex-shrink:0;">${cfg.icon}</div><div style="flex:1;min-width:0;"><div style="font-size:0.83rem;font-weight:700;color:#0f2540;">${cfg.display(r)}</div><div style="font-size:0.7rem;color:#6b7fa3;">${cfg.sub(r)}</div></div><div style="display:flex;gap:0.3rem;" onclick="event.stopPropagation()"><button onclick="pickBilMasterRecord('${type}',${i})" style="padding:0.25rem 0.55rem;border-radius:6px;font-size:0.7rem;font-weight:700;border:none;cursor:pointer;background:#0f2540;color:#fff;">↗ Use</button><button onclick="openBilMasterForm('${type}',${i})" style="padding:0.25rem 0.55rem;border-radius:6px;font-size:0.7rem;font-weight:700;border:none;cursor:pointer;background:#f4f3ee;color:#3d5475;">✏️</button><button onclick="deleteBilMaster('${type}',${i})" style="padding:0.25rem 0.55rem;border-radius:6px;font-size:0.7rem;font-weight:700;border:none;cursor:pointer;background:#fef2f2;color:#dc2626;">🗑</button></div></div>`).join('');}
function pickBilMasterRecord(type,idx){ const cfg=BIL_MASTER_CONFIG[type];const data=getBilMaster(type);const r=data[idx];if(!r)return;if(bilMasterPickTarget){cfg.fill(r,bilMasterPickTarget);showToastBil('✅',cfg.label+' selected: '+cfg.display(r));closeBilMaster();} }
function openBilMasterForm(type,idx){ bilMasterEditType=type;bilMasterEditIdx=(idx!==undefined&&idx!==null)?idx:null;const cfg=BIL_MASTER_CONFIG[type];const data=getBilMaster(type);const rec=bilMasterEditIdx!==null?data[bilMasterEditIdx]:null;document.getElementById('bilMfTitle').textContent=rec?`✏️ Edit ${cfg.label}`:`+ Add ${cfg.label}`;document.getElementById('bilMfBody').innerHTML=cfg.fields.map(f=>`<div style="display:flex;flex-direction:column;gap:0.3rem;"><label style="font-size:0.7rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#3d5475;">${f.label}${f.req?' *':''}</label><input id="bilmf_${f.id}" type="text" placeholder="${f.placeholder}" value="${rec?(rec[f.id]||''):''}" style="padding:0.65rem 0.85rem;border:1.5px solid #dde3f0;border-radius:8px;font-size:0.88rem;font-family:inherit;width:100%;box-sizing:border-box;" onfocus="this.style.borderColor='#0f2540'" onblur="this.style.borderColor='#dde3f0'"/></div>`).join('');document.getElementById('bilMfOverlay').style.display='flex';setTimeout(()=>{const f=document.querySelector('#bilMfBody input');if(f)f.focus();},100);}
function closeBilMasterForm(){ document.getElementById('bilMfOverlay').style.display='none';bilMasterEditType=null;bilMasterEditIdx=null; }
function saveBilMasterRecord(){ const type=bilMasterEditType;if(!type)return;const cfg=BIL_MASTER_CONFIG[type];const data=getBilMaster(type);const rec={};let valid=true;cfg.fields.forEach(f=>{const el=document.getElementById('bilmf_'+f.id);if(el)rec[f.id]=el.value.trim();if(f.req&&!rec[f.id]){valid=false;el.style.borderColor='#ef4444';}else if(el)el.style.borderColor='#dde3f0';});if(!valid){showToastBil('⚠️','Please fill all required fields!');return;}if(bilMasterEditIdx!==null){data[bilMasterEditIdx]=rec;}else{data.push(rec);}setBilMaster(type,data);closeBilMasterForm();renderBilMasterList(type);showToastBil('✅',cfg.label+' saved!');}
function deleteBilMaster(type,idx){ if(!confirm('Delete this record?'))return;const data=getBilMaster(type);data.splice(idx,1);setBilMaster(type,data);renderBilMasterList(type);showToastBil('🗑','Deleted.');}

// Autocomplete
const BIL_FIELD_MAP={
  'f_buy_name':    {type:'buyer',    display:r=>r.name, sub:r=>[r.company,r.country].filter(Boolean).join(', ')},
  'f_buy_country': {type:'location', display:r=>r.name, sub:r=>r.country||''},
  'f_co_name':     {type:'company',  display:r=>r.name, sub:r=>r.addr1||''},
  'f_sender_name': {type:'signatory',display:r=>r.name, sub:r=>r.designation||''},
  'f_product1':    {type:'product',  display:r=>r.name, sub:r=>r.hscode?'HS:'+r.hscode:''},
  'f_product2':    {type:'product',  display:r=>r.name, sub:r=>r.hscode?'HS:'+r.hscode:''},
};
let bilAcField=null;
function getBilAcDrop(){ ensureBilMasterPanel();return document.getElementById('bilAcDropdown');}
function posBilAC(el){const r=el.getBoundingClientRect();const d=getBilAcDrop();d.style.left=r.left+'px';d.style.top=(r.bottom+4)+'px';d.style.width=Math.max(r.width,260)+'px';}
function renderBilAC(fieldId,query){const map=BIL_FIELD_MAP[fieldId];if(!map)return closeBilAC();const data=getBilMaster(map.type);if(!data.length)return closeBilAC();const q=(query||'').toLowerCase().trim();const filtered=q?data.filter(r=>map.display(r).toLowerCase().includes(q)):data;if(!filtered.length)return closeBilAC();const cfg=BIL_MASTER_CONFIG[map.type];const d=getBilAcDrop();d.innerHTML=`<div style="padding:0.45rem 0.75rem;font-size:0.62rem;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#6b7fa3;border-bottom:1px solid #eef1f8;display:flex;align-items:center;justify-content:space-between;"><span>${cfg.icon} Saved ${cfg.label}</span><span style="color:#9aadcc;">${filtered.length} found</span></div>`+filtered.map(r=>{const idx=data.indexOf(r);const sub=map.sub(r);return`<div class="bil-ac-item" onmousedown="event.preventDefault();pickBilAC('${fieldId}',${idx})" style="padding:0.6rem 0.85rem;cursor:pointer;border-bottom:1px solid #f4f3ee;display:flex;align-items:center;gap:0.65rem;transition:background 0.15s;"><div style="width:28px;height:28px;border-radius:7px;background:#f0f2f8;display:flex;align-items:center;justify-content:center;font-size:0.85rem;flex-shrink:0;">${cfg.icon}</div><div style="flex:1;min-width:0;"><div style="font-size:0.82rem;font-weight:600;color:#0f2540;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${map.display(r)}</div>${sub?`<div style="font-size:0.68rem;color:#6b7fa3;margin-top:0.1rem;">${sub}</div>`:''}</div><div style="font-size:0.65rem;color:#c9a84c;font-weight:700;flex-shrink:0;">↗ Use</div></div>`;}).join('');d.querySelectorAll('.bil-ac-item').forEach(el=>{el.addEventListener('mouseover',()=>el.style.background='#f4f3ee');el.addEventListener('mouseout',()=>el.style.background='');});d.style.display='block';posBilAC(document.getElementById(fieldId));}
function pickBilAC(fieldId,idx){const map=BIL_FIELD_MAP[fieldId];if(!map)return;const data=getBilMaster(map.type);const r=data[idx];if(!r)return;BIL_MASTER_CONFIG[map.type].fill(r,fieldId);closeBilAC();showToastBil('✅',map.display(r)+' selected');}
function closeBilAC(){const d=document.getElementById('bilAcDropdown');if(d)d.style.display='none';bilAcField=null;}

document.addEventListener('DOMContentLoaded',()=>{
  setTimeout(()=>{
    ensureBilMasterPanel();
    Object.keys(BIL_FIELD_MAP).forEach(fieldId=>{
      const el=document.getElementById(fieldId);if(!el)return;
      el.addEventListener('focus',()=>{bilAcField=fieldId;renderBilAC(fieldId,el.value);});
      el.addEventListener('click',()=>{bilAcField=fieldId;renderBilAC(fieldId,el.value);});
      el.addEventListener('input',()=>{if(bilAcField===fieldId)renderBilAC(fieldId,el.value);});
      el.addEventListener('keydown',e=>{
        if(e.key==='Escape'){closeBilAC();return;}
        const d=document.getElementById('bilAcDropdown');if(!d||d.style.display==='none')return;
        const items=d.querySelectorAll('.bil-ac-item');const active=d.querySelector('.bil-ac-item.ac-active');
        let idx=-1;items.forEach((it,i)=>{if(it===active)idx=i;});
        if(e.key==='ArrowDown'){e.preventDefault();const next=idx<items.length-1?idx+1:0;items.forEach(i=>{i.classList.remove('ac-active');i.style.background='';});items[next].classList.add('ac-active');items[next].style.background='#f4f3ee';items[next].scrollIntoView({block:'nearest'});}
        if(e.key==='ArrowUp'){e.preventDefault();const prev=idx>0?idx-1:items.length-1;items.forEach(i=>{i.classList.remove('ac-active');i.style.background='';});items[prev].classList.add('ac-active');items[prev].style.background='#f4f3ee';items[prev].scrollIntoView({block:'nearest'});}
        if(e.key==='Enter'&&active){e.preventDefault();active.dispatchEvent(new MouseEvent('mousedown'));}
      });
    });
    document.addEventListener('click',e=>{const d=document.getElementById('bilAcDropdown');if(d&&!d.contains(e.target)&&!Object.keys(BIL_FIELD_MAP).some(id=>document.getElementById(id)===e.target))closeBilAC();});
    window.addEventListener('scroll',()=>{const d=document.getElementById('bilAcDropdown');if(bilAcField&&d&&d.style.display!=='none')posBilAC(document.getElementById(bilAcField));},true);
  },300);
});
