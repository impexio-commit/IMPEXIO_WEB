/* ============================================================
   efm.js — Export Follow-up Mail Module
   IMPEXIO v2
   ============================================================ */

let efmRecords   = JSON.parse(localStorage.getItem('efm_records') || '[]');
let editingId    = null;
let currentStep  = 1;
let selectedMailType = null;

// ── Mail type config ──────────────────────────────────────────
const MAIL_TYPES = {
  quotation: {
    label: 'Quotation Follow-up', icon: '📋',
    refLabel: 'Original Quotation / PI No.',
    extraFields: [],
    subject: (d) => `Follow-up on Our Export Quotation / Proforma Invoice — ${d.docref || '[REF NO.]'}`,
    body: (d) => `Dear ${d.toName || 'Sir / Madam'},\n\nWe hope this email finds you in good health. We are writing to follow up on our ${d.docref ? `Export Quotation / Proforma Invoice <strong>${d.docref}</strong>` : 'Export Quotation / Proforma Invoice'} dated <strong>${fmtDate(d.docdate) || '[DATE]'}</strong>${d.product ? ` for <strong>${d.product}</strong>` : ''} which we had sent to your esteemed organisation${d.docvalue ? ` valued at <strong>${d.docvalue}</strong>` : ''}.\n\nWe would greatly appreciate your valued feedback at your earliest convenience. If you require any clarification, revision in pricing, alternative specifications or any additional information, please do not hesitate to contact us — we would be more than happy to accommodate your requirements.\n\n${d.specialNote ? d.specialNote + '\n\n' : ''}We look forward to hearing from you and building a long and fruitful business relationship with your esteemed organisation.\n\nKindly acknowledge receipt of this email.`
  },
  sample: {
    label: 'Sample Follow-up', icon: '🧪',
    refLabel: 'Courier Tracking No.',
    extraFields: [
      { id:'courier_co', label:'Courier Company', placeholder:'e.g. DHL / FedEx / UPS' },
      { id:'dispatch_date', label:'Sample Dispatch Date', placeholder:'', type:'date' }
    ],
    subject: (d) => `Follow-up: Product Samples Dispatched${d.product ? ' — ' + d.product : ''} | Tracking: ${d.docref || '[TRACKING NO.]'}`,
    body: (d) => `Dear ${d.toName || 'Sir / Madam'},\n\nWe hope you are doing well. We are writing to follow up on the product samples${d.product ? ` of <strong>${d.product}</strong>` : ''} which were dispatched to you${d.dispatchDate ? ` on <strong>${fmtDate(d.dispatchDate)}</strong>` : ''}${d.courierCo ? ` via <strong>${d.courierCo}</strong>` : ''}${d.docref ? ` with tracking number <strong>${d.docref}</strong>` : ''}.\n\nWe trust that the samples have reached you safely. We would be grateful if you could kindly share your feedback on the samples at your earliest convenience — specifically regarding the quality, finish, dimensions and overall suitability for your requirements.\n\n${d.specialNote ? d.specialNote + '\n\n' : ''}Your feedback is extremely valuable to us and will help us proceed with your bulk order confirmation. We look forward to your positive response.`
  },
  order: {
    label: 'Order Confirmation', icon: '📦',
    refLabel: 'Buyer\'s Purchase Order No.',
    extraFields: [
      { id:'ship_by', label:'Estimated Shipment Date', placeholder:'', type:'date' }
    ],
    subject: (d) => `Order Confirmation — PO ${d.docref || '[PO NO.]'}${d.product ? ' — ' + d.product : ''}`,
    body: (d) => `Dear ${d.toName || 'Sir / Madam'},\n\nThank you for placing your Purchase Order${d.docref ? ` No. <strong>${d.docref}</strong>` : ''}${d.docdate ? ` dated <strong>${fmtDate(d.docdate)}</strong>` : ''}${d.product ? ` for <strong>${d.product}</strong>` : ''}${d.docvalue ? ` valued at <strong>${d.docvalue}</strong>` : ''}. We are pleased to confirm receipt and acceptance of your Purchase Order.\n\nWe are proceeding with production / packing as per the agreed specifications${d.shipBy ? `. The estimated shipment date is <strong>${fmtDate(d.shipBy)}</strong>` : ''}. We will keep you informed of the progress and notify you as soon as the goods are ready for dispatch.\n\n${d.specialNote ? d.specialNote + '\n\n' : ''}Should you require any changes or have any questions regarding the order, please do not hesitate to contact us. We look forward to a successful execution of this order.`
  },
  payment: {
    label: 'Payment Follow-up', icon: '💳',
    refLabel: 'Invoice / PI No.',
    extraFields: [
      { id:'payment_amount', label:'Advance Amount Due', placeholder:'e.g. $5,000 or 30% of $18,350' },
      { id:'payment_due',   label:'Payment Due Date',   placeholder:'', type:'date' }
    ],
    subject: (d) => `Payment Follow-up — ${d.docref || '[REF NO.]'}${d.product ? ' — ' + d.product : ''} | Amount Due: ${d.paymentAmount || '[AMOUNT]'}`,
    body: (d) => `Dear ${d.toName || 'Sir / Madam'},\n\nWe hope this message finds you well. We are writing to kindly follow up regarding the advance payment due${d.paymentAmount ? ` of <strong>${d.paymentAmount}</strong>` : ''} against our ${d.docref ? `<strong>${d.docref}</strong>` : 'Invoice / Proforma Invoice'} dated <strong>${fmtDate(d.docdate) || '[DATE]'}</strong>${d.product ? ` for <strong>${d.product}</strong>` : ''}.\n\nAs per our agreed payment terms, we would appreciate if the advance payment could be remitted at your earliest convenience${d.paymentDue ? ` — preferably by <strong>${fmtDate(d.paymentDue)}</strong>` : ''}, to enable us to initiate production and maintain the committed shipment schedule.\n\nFor your reference, our bank details are as mentioned in the original Invoice / Proforma Invoice. Kindly share the SWIFT / UTR reference once the payment is processed.\n\n${d.specialNote ? d.specialNote + '\n\n' : ''}We look forward to your confirmation.`
  },
  dispatch: {
    label: 'Shipment Dispatch', icon: '🚢',
    refLabel: 'Bill of Lading / AWB No.',
    extraFields: [
      { id:'vessel',  label:'Vessel / Flight Name', placeholder:'e.g. MSC Gülsün / IndiGo 6E 123' },
      { id:'etd',     label:'ETD (Departure Date)',  placeholder:'', type:'date' },
      { id:'eta',     label:'ETA (Arrival Date)',    placeholder:'', type:'date' },
      { id:'port_loading', label:'Port of Loading',  placeholder:'e.g. Mundra Port' }
    ],
    subject: (d) => `Shipment Dispatched — ${d.docref || '[BL / AWB NO.]'} | ${d.product || 'Goods'} | ETA: ${fmtDate(d.eta) || '[ETA]'}`,
    body: (d) => `Dear ${d.toName || 'Sir / Madam'},\n\nWe are pleased to inform you that your order${d.product ? ` for <strong>${d.product}</strong>` : ''} has been successfully dispatched and is now on its way to you.\n\nShipment Details:\n• <strong>Bill of Lading / AWB No.:</strong> ${d.docref || '[BL NO.]'}\n• <strong>Vessel / Flight:</strong> ${d.vessel || '[VESSEL NAME]'}\n• <strong>Port of Loading:</strong> ${d.portLoading || '[PORT OF LOADING]'}\n• <strong>ETD:</strong> ${fmtDate(d.etd) || '[ETD]'}\n• <strong>ETA:</strong> ${fmtDate(d.eta) || '[ETA]'}\n\nShipping documents (Commercial Invoice, Packing List, Bill of Lading, Certificate of Origin and other relevant documents) will be sent to you separately${d.specialNote ? '' : ' within the next 2–3 business days'}.\n\n${d.specialNote ? d.specialNote + '\n\n' : ''}Please feel free to contact us if you need any further information regarding this shipment. We hope the goods arrive safely and on time.`
  },
  documents: {
    label: 'Documents Sent', icon: '📬',
    refLabel: 'Invoice / BL No.',
    extraFields: [
      { id:'docs_courier',  label:'Document Courier / Method',  placeholder:'e.g. DHL Express / Email / Bank' },
      { id:'docs_tracking', label:'Document Courier Tracking',  placeholder:'e.g. DHL 1234567890' }
    ],
    subject: (d) => `Shipping Documents Dispatched — ${d.docref || '[REF NO.]'}${d.product ? ' — ' + d.product : ''}`,
    body: (d) => `Dear ${d.toName || 'Sir / Madam'},\n\nWe are pleased to confirm that the complete set of shipping documents for your order${d.product ? ` of <strong>${d.product}</strong>` : ''}${d.docref ? ` (Reference: <strong>${d.docref}</strong>)` : ''} have been dispatched${d.docsCourier ? ` via <strong>${d.docsCourier}</strong>` : ''}${d.docsTracking ? ` with tracking number <strong>${d.docsTracking}</strong>` : ''}.\n\nDocuments included:\n• Commercial Invoice\n• Packing List\n• Bill of Lading / Airway Bill\n• Certificate of Origin\n• Inspection / Test Report (if applicable)\n• Phytosanitary Certificate (if applicable)\n\nKindly acknowledge receipt of the documents and inform us once customs clearance has been completed.\n\n${d.specialNote ? d.specialNote + '\n\n' : ''}Should you require any additional documents or clarifications, please do not hesitate to contact us.`
  },
  feedback: {
    label: 'Delivery Feedback', icon: '⭐',
    refLabel: 'Invoice / PO No.',
    extraFields: [],
    subject: (d) => `Feedback Request — Delivery of ${d.product || 'Your Order'} | ${d.docref || '[REF NO.]'}`,
    body: (d) => `Dear ${d.toName || 'Sir / Madam'},\n\nWe hope this email finds you well. We understand that your order${d.product ? ` for <strong>${d.product}</strong>` : ''}${d.docref ? ` (Reference: <strong>${d.docref}</strong>)` : ''} has been delivered to you.\n\nWe would be grateful if you could kindly share your feedback on the following:\n• Quality of the products received\n• Accuracy of quantity and packing\n• Condition of goods upon arrival\n• Overall satisfaction with our service\n\nYour feedback is extremely valuable to us and helps us maintain and improve the quality of our products and services. If there are any concerns or issues, please do not hesitate to let us know — we will address them promptly.\n\n${d.specialNote ? d.specialNote + '\n\n' : ''}We hope to receive a positive response and look forward to serving you again with your next order. Please feel free to share your future requirements at any time.`
  },
  repeat: {
    label: 'Repeat Order Follow-up', icon: '🔄',
    refLabel: 'Last Order / Invoice No.',
    extraFields: [
      { id:'new_offer', label:'New Product / Special Offer', placeholder:'e.g. New 2026 catalogue, 5% special discount' }
    ],
    subject: (d) => `We Miss Your Business — New Products &amp; Special Offer${d.product ? ' | ' + d.product : ''}`,
    body: (d) => `Dear ${d.toName || 'Sir / Madam'},\n\nWe hope this email finds you in good health. It has been a while since your last order${d.docref ? ` (Reference: <strong>${d.docref}</strong>)` : ''} and we wanted to reach out to reconnect and check if you have any upcoming requirements.\n\n${d.newOffer ? `We are pleased to share with you: <strong>${d.newOffer}</strong>\n\n` : ''}We continue to offer the same high quality${d.product ? ` in <strong>${d.product}</strong>` : ' products'} with competitive pricing and reliable delivery. Our production capacity has been enhanced and we can offer improved lead times and flexible order quantities.\n\n${d.specialNote ? d.specialNote + '\n\n' : ''}We would love the opportunity to discuss your current requirements and present you with our updated product range and pricing. Please feel free to send us your enquiry at any time — we will respond promptly.\n\nWe look forward to the opportunity of serving you again and strengthening our business relationship.`
  }
};

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
  if (el && !el.value) {
    el.value = `EFM/2026/${String(efmRecords.length + 1).padStart(4,'0')}`;
  }
}
function fmtDate(d) {
  if (!d) return '';
  try {
    return new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
  } catch { return d; }
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

// ── Mail type selection ───────────────────────────────────────
function selectMailType(type) {
  selectedMailType = type;
  document.querySelectorAll('.mail-type-btn').forEach(b => b.classList.remove('selected'));
  document.getElementById('mtype-' + type)?.classList.add('selected');

  const cfg = MAIL_TYPES[type];
  // Update extra ref fields
  const card = document.getElementById('extraRefCard');
  const fields = document.getElementById('extraRefFields');
  const title = document.getElementById('extraRefTitle');
  if (cfg.extraFields && cfg.extraFields.length > 0) {
    title.textContent = 'Additional Reference Details';
    fields.innerHTML = cfg.extraFields.map(f => `
      <div class="ef">
        <label class="el2">${f.label}</label>
        <input type="${f.type||'text'}" class="ei" id="fextra_${f.id}" placeholder="${f.placeholder||''}"/>
      </div>`).join('');
    card.style.display = 'block';
  } else {
    card.style.display = 'none';
  }
}

// ── Step navigation ───────────────────────────────────────────
function goToStep(n) {
  if (n > currentStep) {
    if (n === 2) {
      if (!selectedMailType) { showToastEfm('⚠️', 'Please select a mail type first.'); return; }
      if (!gv('f_refno'))   { showToastEfm('⚠️', 'Please enter a reference number.'); return; }
      if (!gv('f_date'))    { showToastEfm('⚠️', 'Please select a date.'); return; }
    }
    if (n === 3) {
      if (!gv('f_from_company')) { showToastEfm('⚠️', 'Please enter your company name.'); return; }
      if (!gv('f_from_name'))    { showToastEfm('⚠️', 'Please enter the sender name.'); return; }
      if (!gv('f_to_name'))      { showToastEfm('⚠️', 'Please enter the buyer name.'); return; }
      generateEmailPreview();
    }
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
  document.querySelectorAll('.epb-connector').forEach((c, i) => {
    c.classList.toggle('done', i + 1 < n);
  });
  const subs = {1:'Step 1 of 3 — Mail Type & Reference', 2:'Step 2 of 3 — Sender & Buyer', 3:'Step 3 of 3 — Preview & Send'};
  setText('formSub', subs[n] || '');
  updateInfoStrips();
}
function nextStep(from) { goToStep(from + 1); }
function prevStep(from) { goToStep(from - 1); }

function updateInfoStrips() {
  const type = selectedMailType ? (MAIL_TYPES[selectedMailType]?.icon + ' ' + MAIL_TYPES[selectedMailType]?.label) : '—';
  const ref  = gv('f_refno')  || '—';
  const prod = gv('f_product') || '—';
  const buyer = gv('f_to_name') || '—';
  ['s2_type','s3_type'].forEach(id => setText(id, type));
  ['s2_ref', 's3_ref'].forEach(id => setText(id, ref));
  setText('s2_product', prod);
  setText('s3_buyer', buyer);
}

// ── Generate Email Preview ────────────────────────────────────
function getExtraData() {
  const d = {};
  if (!selectedMailType) return d;
  const cfg = MAIL_TYPES[selectedMailType];
  (cfg.extraFields || []).forEach(f => {
    const el = document.getElementById('fextra_' + f.id);
    if (el) d[toCamel(f.id)] = el.value.trim();
  });
  return d;
}
function toCamel(str) {
  return str.replace(/_([a-z])/g, (m, c) => c.toUpperCase());
}

function generateEmailPreview() {
  if (!selectedMailType) return;
  const cfg = MAIL_TYPES[selectedMailType];
  const extra = getExtraData();
  const d = {
    toName:      gv('f_to_name'),
    toCompany:   gv('f_to_company'),
    toCountry:   gv('f_to_country'),
    toEmail:     gv('f_to_email'),
    fromCompany: gv('f_from_company'),
    fromName:    gv('f_from_name'),
    fromDesig:   gv('f_from_designation'),
    fromEmail:   gv('f_from_email'),
    fromPhone:   gv('f_from_phone'),
    fromCity:    gv('f_from_city'),
    product:     gv('f_product'),
    docref:      gv('f_docref'),
    docdate:     gv('f_docdate'),
    docvalue:    gv('f_docvalue'),
    date:        gv('f_date'),
    specialNote: gv('f_special_note'),
    ...extra
  };

  const subject = cfg.subject(d);
  const bodyRaw = cfg.body(d);

  // Render highlighted ref box content
  let refBoxHtml = '';
  if (d.docref || d.docdate || d.product || d.docvalue) {
    const parts = [];
    if (d.docref)   parts.push(`<strong>Reference:</strong> ${d.docref}`);
    if (d.docdate)  parts.push(`<strong>Date:</strong> ${fmtDate(d.docdate)}`);
    if (d.product)  parts.push(`<strong>Product:</strong> ${d.product}`);
    if (d.docvalue) parts.push(`<strong>Value:</strong> ${d.docvalue}`);
    refBoxHtml = `<div class="eep-highlight">${parts.join(' &nbsp;|&nbsp; ')}</div>`;
  }

  // Convert body text to HTML paragraphs
  const bodyHtml = bodyRaw.split('\n').map(line => {
    if (!line.trim()) return '';
    if (line.startsWith('•')) return `<div style="padding:0.15rem 0 0.15rem 1rem;">${line}</div>`;
    return `<div class="eep-para">${line}</div>`;
  }).join('');

  const previewEl = document.getElementById('emailPreviewBody');
  if (previewEl) {
    previewEl.innerHTML = `
      <div class="eep-field"><div class="eep-lbl">To:</div><div class="eep-val">${d.toEmail || '—'} ${d.toName ? '(' + d.toName + (d.toCompany ? ', ' + d.toCompany : '') + ')' : ''}</div></div>
      <div class="eep-field"><div class="eep-lbl">From:</div><div class="eep-val">${d.fromEmail || '—'} ${d.fromName ? '(' + d.fromName + (d.fromCompany ? ', ' + d.fromCompany : '') + ')' : ''}</div></div>
      <div class="eep-field"><div class="eep-lbl">Date:</div><div class="eep-val">${fmtDate(d.date)}</div></div>
      <div class="eep-subject">${subject}</div>
      <div class="eep-divider"></div>
      ${bodyHtml}
      ${refBoxHtml}
      <div class="eep-divider"></div>
      <div class="eep-sign">
        Warm regards,<br/>
        <strong>${d.fromName || '[Sender Name]'} ${d.fromDesig ? '— ' + d.fromDesig : ''}</strong>
        ${d.fromCompany || ''}${d.fromCity ? ' | ' + d.fromCity : ''}${d.fromPhone ? ' | ' + d.fromPhone : ''}
      </div>`;
  }

  // Update summary
  setText('sum_type',   cfg.icon + ' ' + cfg.label);
  setText('sum_ref',    gv('f_refno') || '—');
  setText('sum_date',   fmtDate(gv('f_date')));
  setText('sum_to',     d.toName + (d.toCompany ? ', ' + d.toCompany : ''));
  setText('sum_from',   d.fromName + (d.fromCompany ? ', ' + d.fromCompany : ''));
  setText('sum_docref', d.docref || '—');
}

// ── Save / Load records ───────────────────────────────────────
function saveRecord() {
  if (!selectedMailType) { showToastEfm('⚠️', 'Please select a mail type first.'); return; }
  if (!gv('f_refno'))   { showToastEfm('⚠️', 'Please enter a reference number.'); return; }
  if (!gv('f_to_name')) { showToastEfm('⚠️', 'Please enter the buyer name.'); return; }

  const cfg = MAIL_TYPES[selectedMailType];
  const extra = getExtraData();
  const rec = {
    id:          editingId ?? Date.now(),
    mailType:    selectedMailType,
    mailLabel:   cfg.label,
    mailIcon:    cfg.icon,
    refno:       gv('f_refno'),
    date:        gv('f_date'),
    product:     gv('f_product'),
    docref:      gv('f_docref'),
    docdate:     gv('f_docdate'),
    docvalue:    gv('f_docvalue'),
    fromCompany: gv('f_from_company'),
    fromName:    gv('f_from_name'),
    fromDesig:   gv('f_from_designation'),
    fromEmail:   gv('f_from_email'),
    fromPhone:   gv('f_from_phone'),
    fromCity:    gv('f_from_city'),
    toName:      gv('f_to_name'),
    toCompany:   gv('f_to_company'),
    toCountry:   gv('f_to_country'),
    toEmail:     gv('f_to_email'),
    specialNote: gv('f_special_note'),
    ...extra
  };

  if (editingId !== null) {
    const idx = efmRecords.findIndex(r => r.id === editingId);
    if (idx >= 0) efmRecords[idx] = rec;
  } else {
    efmRecords.push(rec);
  }
  localStorage.setItem('efm_records', JSON.stringify(efmRecords));
  renderRecords();
  showToastEfm('✅', 'Follow-up mail record saved!');
}

function loadRecord(id) {
  const rec = efmRecords.find(r => r.id === id);
  if (!rec) return;
  editingId = id;
  clearForm(false);
  selectMailType(rec.mailType);
  sv('f_refno', rec.refno); sv('f_date', rec.date);
  sv('f_product', rec.product); sv('f_docref', rec.docref);
  sv('f_docdate', rec.docdate); sv('f_docvalue', rec.docvalue);
  sv('f_from_company', rec.fromCompany); sv('f_from_name', rec.fromName);
  sv('f_from_designation', rec.fromDesig); sv('f_from_email', rec.fromEmail);
  sv('f_from_phone', rec.fromPhone); sv('f_from_city', rec.fromCity);
  sv('f_to_name', rec.toName); sv('f_to_company', rec.toCompany);
  sv('f_to_country', rec.toCountry); sv('f_to_email', rec.toEmail);
  sv('f_special_note', rec.specialNote);
  // Restore extra fields
  const cfg = MAIL_TYPES[rec.mailType];
  (cfg.extraFields || []).forEach(f => {
    const camel = toCamel(f.id);
    const el = document.getElementById('fextra_' + f.id);
    if (el && rec[camel]) el.value = rec[camel];
  });
  setText('formTitle', 'Edit Follow-up Mail');
  goToStep(1);
  document.querySelectorAll('.efl-card').forEach(c => c.classList.remove('active'));
  document.querySelector(`.efl-card[data-id="${id}"]`)?.classList.add('active');
}

function deleteRecord(id) {
  if (!confirm('Delete this follow-up mail record?')) return;
  efmRecords = efmRecords.filter(r => r.id !== id);
  localStorage.setItem('efm_records', JSON.stringify(efmRecords));
  renderRecords();
  showToastEfm('🗑', 'Record deleted.');
}

function newEntry() {
  clearForm(true);
  setText('formTitle', 'New Follow-up Mail');
  editingId = null;
  autoSetRefNo();
  goToStep(1);
  document.querySelectorAll('.efl-card').forEach(c => c.classList.remove('active'));
}

function clearForm(resetAll = true) {
  selectedMailType = null;
  document.querySelectorAll('.mail-type-btn').forEach(b => b.classList.remove('selected'));
  document.getElementById('extraRefCard').style.display = 'none';
  ['f_refno','f_date','f_product','f_docref','f_docdate','f_docvalue',
   'f_from_company','f_from_name','f_from_designation','f_from_email','f_from_phone','f_from_city',
   'f_to_name','f_to_company','f_to_country','f_to_email','f_special_note'].forEach(id => sv(id, ''));
  // Reset preview
  const prev = document.getElementById('emailPreviewBody');
  if (prev) prev.innerHTML = `<div class="eep-placeholder"><div class="eep-placeholder-icon">📧</div><div class="eep-placeholder-txt">Mail preview will appear here</div><div class="eep-placeholder-sub">Fill in all required fields to generate the mail</div></div>`;
  if (resetAll) { editingId = null; setTodayDate(); autoSetRefNo(); }
}

// ── Render left panel records ─────────────────────────────────
function renderRecords(query = '') {
  const list = document.getElementById('recordsList');
  const q = query.toLowerCase().trim();
  const filtered = efmRecords.filter(r =>
    !q || r.refno?.toLowerCase().includes(q) || r.toName?.toLowerCase().includes(q) ||
    r.mailLabel?.toLowerCase().includes(q) || r.product?.toLowerCase().includes(q)
  );
  if (!filtered.length) {
    list.innerHTML = `<div class="efl-empty"><div style="font-size:1.6rem;opacity:0.35;">📧</div><div class="efl-empty-txt">No records yet</div><div class="efl-empty-sub">Click + New to begin</div></div>`;
    return;
  }
  list.innerHTML = filtered.slice().reverse().map(r => `
    <div class="efl-card${editingId===r.id?' active':''}" data-id="${r.id}" onclick="loadRecord(${r.id})">
      <div class="efl-card-no">${r.refno || '—'}</div>
      <div class="efl-card-type">${r.mailIcon || '📧'} ${r.mailLabel || '—'}</div>
      <div class="efl-card-buyer">${r.toName || '—'}${r.toCompany ? ' · ' + r.toCompany : ''}</div>
      <div class="efl-card-row">
        <div class="efl-card-date">${fmtDate(r.date)}</div>
        <div class="efl-card-ref">${r.docref || ''}</div>
      </div>
      <div class="efl-card-acts">
        <button class="efl-act edit" onclick="event.stopPropagation();loadRecord(${r.id})">✏️ Edit</button>
        <button class="efl-act prnt" onclick="event.stopPropagation();quickPrint(${r.id})">🖨 Print</button>
        <button class="efl-act del"  onclick="event.stopPropagation();deleteRecord(${r.id})">🗑</button>
      </div>
    </div>`).join('');
}

function filterRecords() {
  renderRecords(document.getElementById('searchInput')?.value || '');
}

// ── Print ────────────────────────────────────────────────────
function printRecord() {
  if (!selectedMailType) { showToastEfm('⚠️', 'Please complete the form first.'); return; }
  generateEmailPreview();
  const cfg = MAIL_TYPES[selectedMailType];
  const extra = getExtraData();
  const d = {
    toName:gv('f_to_name'), toCompany:gv('f_to_company'), toEmail:gv('f_to_email'),
    fromCompany:gv('f_from_company'), fromName:gv('f_from_name'), fromDesig:gv('f_from_designation'),
    fromEmail:gv('f_from_email'), fromPhone:gv('f_from_phone'), fromCity:gv('f_from_city'),
    product:gv('f_product'), docref:gv('f_docref'), docdate:gv('f_docdate'),
    docvalue:gv('f_docvalue'), date:gv('f_date'), specialNote:gv('f_special_note'), ...extra
  };
  const subject = cfg.subject(d);
  const bodyText = cfg.body(d).replace(/<strong>/g,'').replace(/<\/strong>/g,'');

  document.getElementById('printArea').innerHTML = `
    <div class="print-doc">
      <div class="print-hdr">
        <div class="print-hdr-title">IMPEXIO — Export Follow-up Mail</div>
        <div class="print-hdr-sub">${cfg.icon} ${cfg.label} &nbsp;|&nbsp; Ref: ${gv('f_refno')}</div>
      </div>
      <div class="print-meta">
        <div class="print-meta-item"><span class="print-meta-lbl">To:</span><span class="print-meta-val">${d.toName}${d.toCompany?', '+d.toCompany:''}</span></div>
        <div class="print-meta-item"><span class="print-meta-lbl">Email:</span><span class="print-meta-val">${d.toEmail||'—'}</span></div>
        <div class="print-meta-item"><span class="print-meta-lbl">From:</span><span class="print-meta-val">${d.fromName}${d.fromCompany?', '+d.fromCompany:''}</span></div>
        <div class="print-meta-item"><span class="print-meta-lbl">Date:</span><span class="print-meta-val">${fmtDate(d.date)}</span></div>
        <div class="print-meta-item" style="grid-column:1/-1;"><span class="print-meta-lbl">Subject:</span><span class="print-meta-val">${subject.replace(/&amp;/g,'&')}</span></div>
      </div>
      <div class="print-body">${bodyText}</div>
      <div class="print-sigs">
        <div class="print-sig">
          <div style="height:30px;"></div>
          <div class="print-sig-line">${d.fromName||'Authorised Signatory'}<br/>${d.fromDesig||''}</div>
        </div>
        <div class="print-sig">
          <div style="height:30px;"></div>
          <div class="print-sig-line">${d.fromCompany||'Company Stamp'}</div>
        </div>
      </div>
      <div class="print-footer">Generated by IMPEXIO — Export Follow-up Mail Module &nbsp;|&nbsp; impexio.com</div>
    </div>`;
  window.print();
}

function quickPrint(id) {
  loadRecord(id);
  setTimeout(() => { goToStep(3); setTimeout(printRecord, 400); }, 200);
}

// ── Toast ─────────────────────────────────────────────────────
function showToastEfm(icon, msg) {
  let t = document.getElementById('efm-toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'efm-toast';
    t.style.cssText = `position:fixed;bottom:1.5rem;right:1.5rem;background:var(--navy);color:#fff;padding:0.7rem 1.2rem;border-radius:10px;font-size:0.82rem;font-weight:600;display:flex;gap:0.5rem;align-items:center;box-shadow:0 8px 24px rgba(15,37,64,0.3);z-index:9999;opacity:0;transition:opacity 0.3s;pointer-events:none;border-left:3px solid var(--gold);`;
    document.body.appendChild(t);
  }
  t.innerHTML = `<span>${icon}</span><span>${msg}</span>`;
  t.style.opacity = '1';
  clearTimeout(t._t);
  t._t = setTimeout(() => { t.style.opacity = '0'; }, 3000);
}

// ══════════════════════════════════════════════════════════════
//  EFM MASTER DATA SYSTEM
//  Masters: Company, Buyer, Product, Signatory
//  + Autocomplete dropdown
// ══════════════════════════════════════════════════════════════

const EFM_MASTER_CONFIG = {
  company: {
    label:'Company', icon:'🏢', key:'impexio_master_company',
    fields:[
      {id:'name',    label:'Company Name',   placeholder:'e.g. Impexio Trade Solutions Pvt. Ltd.', req:true},
      {id:'branch',  label:'Branch / Office', placeholder:'e.g. GIFT City Branch'},
      {id:'addr1',   label:'Address',         placeholder:'Building, Street, City'},
      {id:'contact', label:'Phone',           placeholder:'+91 98765 43210'},
      {id:'email',   label:'Email',           placeholder:'exports@company.com'},
    ],
    display: r => r.name,
    sub:     r => r.addr1 || '',
    fill:    (r, tid) => {
      const el=document.getElementById(tid); if(el){el.value=r.name||'';el.dispatchEvent(new Event('input'));}
      // Fill from_city if available
      const city = document.getElementById('f_from_city'); if(city&&r.addr1&&!city.value) city.value=r.addr1;
      const phone = document.getElementById('f_from_phone'); if(phone&&r.contact&&!phone.value) phone.value=r.contact;
      const email = document.getElementById('f_from_email'); if(email&&r.email&&!email.value) email.value=r.email;
    }
  },
  buyer: {
    label:'Buyer', icon:'🌍', key:'impexio_master_buyer',
    fields:[
      {id:'name',    label:'Buyer Name',   placeholder:'e.g. Mr. Hans Mueller', req:true},
      {id:'company', label:'Company',      placeholder:'e.g. Euro Ceramics GmbH'},
      {id:'country', label:'Country',      placeholder:'e.g. Germany'},
      {id:'email',   label:'Email',        placeholder:'buyer@company.com'},
      {id:'phone',   label:'Phone',        placeholder:'+49 69 12345678'},
    ],
    display: r => r.name,
    sub:     r => [r.company, r.country].filter(Boolean).join(', '),
    fill:    (r, tid) => {
      const el=document.getElementById(tid); if(el){el.value=r.name||'';el.dispatchEvent(new Event('input'));}
      const co = document.getElementById('f_to_company'); if(co&&r.company) co.value=r.company;
      const ct = document.getElementById('f_to_country'); if(ct&&r.country) ct.value=r.country;
      const em = document.getElementById('f_to_email');   if(em&&r.email)   em.value=r.email;
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
    sub:     r => r.hscode ? 'HS: '+r.hscode : '',
    fill:    (r, tid) => { const el=document.getElementById(tid); if(el){el.value=r.name||'';el.dispatchEvent(new Event('input'));} }
  },
  signatory: {
    label:'Signatory', icon:'✍️', key:'impexio_master_signatory',
    fields:[
      {id:'name',        label:'Full Name',    placeholder:'e.g. Rajesh Kumar Sharma', req:true},
      {id:'designation', label:'Designation',  placeholder:'e.g. Export Manager'},
      {id:'email',       label:'Email',        placeholder:'name@company.com'},
      {id:'phone',       label:'Phone',        placeholder:'+91 98765 43210'},
    ],
    display: r => r.name,
    sub:     r => r.designation || '',
    fill:    (r, tid) => {
      const el=document.getElementById(tid); if(el){el.value=r.name||'';el.dispatchEvent(new Event('input'));}
      const desig=document.getElementById('f_from_designation'); if(desig&&r.designation) desig.value=r.designation;
      const email=document.getElementById('f_from_email'); if(email&&r.email&&!email.value) email.value=r.email;
      const phone=document.getElementById('f_from_phone'); if(phone&&r.phone&&!phone.value) phone.value=r.phone;
    }
  }
};

// Storage
function getEfmMaster(type) { try{return JSON.parse(localStorage.getItem(EFM_MASTER_CONFIG[type].key)||'[]');}catch{return[];} }
function setEfmMaster(type,data){ localStorage.setItem(EFM_MASTER_CONFIG[type].key,JSON.stringify(data)); }

// State
let efmMasterPickTarget=null, efmMasterEditType=null, efmMasterEditIdx=null;

// Inject master panel HTML on first open
function ensureMasterPanel() {
  if (document.getElementById('efmMasterPanel')) return;
  const overlay = document.createElement('div');
  overlay.id = 'efmMasterOverlay';
  overlay.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(15,37,64,0.45);backdrop-filter:blur(3px);z-index:1000;';
  overlay.onclick = closeEfmMaster;

  const panel = document.createElement('div');
  panel.id = 'efmMasterPanel';
  panel.style.cssText = 'position:fixed;top:0;right:-420px;width:400px;max-width:95vw;bottom:0;background:#fff;z-index:1001;box-shadow:-8px 0 48px rgba(15,37,64,0.18);display:flex;flex-direction:column;transition:right 0.3s cubic-bezier(.4,0,.2,1);';
  panel.innerHTML = `
    <div style="padding:1.1rem 1.25rem;background:#2a5298;display:flex;align-items:flex-start;justify-content:space-between;">
      <div><div id="efmMasterTitle" style="font-family:var(--font-display);font-size:1.05rem;font-weight:700;color:#fff;">Master Data</div><div style="font-size:0.68rem;color:rgba(255,255,255,0.6);margin-top:0.15rem;">Click a record to auto-fill</div></div>
      <button onclick="closeEfmMaster()" style="background:rgba(255,255,255,0.15);border:none;color:#fff;width:28px;height:28px;border-radius:50%;cursor:pointer;font-size:0.85rem;">✕</button>
    </div>
    <div id="efmMasterTabs" style="display:flex;border-bottom:1px solid #dde3f0;background:#fafaf7;overflow-x:auto;"></div>
    <div id="efmMasterBody" style="flex:1;overflow:hidden;"></div>`;

  const mfOverlay = document.createElement('div');
  mfOverlay.id = 'efmMfOverlay';
  mfOverlay.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(15,37,64,0.5);backdrop-filter:blur(4px);z-index:1100;align-items:center;justify-content:center;padding:1rem;';
  mfOverlay.innerHTML = `<div style="background:#fff;border-radius:16px;width:100%;max-width:480px;box-shadow:0 24px 72px rgba(15,37,64,0.22);overflow:hidden;">
    <div style="background:#0f2540;padding:1rem 1.25rem;display:flex;align-items:center;justify-content:space-between;">
      <div id="efmMfTitle" style="font-weight:700;font-size:0.95rem;color:#fff;">Add Record</div>
      <button onclick="closeEfmMasterForm()" style="background:rgba(255,255,255,0.15);border:none;color:#fff;width:28px;height:28px;border-radius:50%;cursor:pointer;">✕</button>
    </div>
    <div id="efmMfBody" style="padding:1.25rem;display:flex;flex-direction:column;gap:0.75rem;"></div>
    <div style="padding:0.85rem 1.25rem;border-top:1px solid #dde3f0;display:flex;justify-content:flex-end;gap:0.5rem;">
      <button onclick="closeEfmMasterForm()" style="padding:0.5rem 1.4rem;border-radius:50px;font-size:0.82rem;font-weight:700;cursor:pointer;background:#f4f3ee;color:#3d5475;border:1.5px solid #dde3f0;">Cancel</button>
      <button onclick="saveEfmMasterRecord()" style="padding:0.5rem 1.4rem;border-radius:50px;font-size:0.82rem;font-weight:700;cursor:pointer;background:var(--navy);color:#fff;border:none;">💾 Save</button>
    </div>
  </div>`;

  const acDrop = document.createElement('div');
  acDrop.id = 'efmAcDropdown';
  acDrop.style.cssText = 'position:fixed;z-index:99999;background:#fff;border:1.5px solid #dde3f0;border-radius:12px;box-shadow:0 16px 48px rgba(15,37,64,0.16);min-width:260px;max-width:380px;max-height:280px;overflow-y:auto;display:none;font-family:Outfit,sans-serif;';

  document.body.appendChild(overlay);
  document.body.appendChild(panel);
  document.body.appendChild(mfOverlay);
  document.body.appendChild(acDrop);
}

function openEfmMaster(tab, targetFieldId) {
  ensureMasterPanel();
  efmMasterPickTarget = targetFieldId || null;
  document.getElementById('efmMasterOverlay').style.display = 'block';
  document.getElementById('efmMasterPanel').style.right = '0';
  buildEfmMasterTabs(tab || 'company');
}
function closeEfmMaster() {
  const p=document.getElementById('efmMasterPanel'); if(p) p.style.right='-420px';
  const o=document.getElementById('efmMasterOverlay'); if(o) o.style.display='none';
  efmMasterPickTarget=null;
}
function buildEfmMasterTabs(activeType) {
  const tabs = document.getElementById('efmMasterTabs');
  const body = document.getElementById('efmMasterBody');
  const types = Object.keys(EFM_MASTER_CONFIG);
  tabs.innerHTML = types.map(t => {
    const c=EFM_MASTER_CONFIG[t];
    return `<div onclick="switchEfmMasterTab('${t}')" id="efmmt-${t}" style="padding:0.65rem 0.9rem;font-size:0.76rem;font-weight:600;color:${t===activeType?'#0f2540':'#6b7fa3'};cursor:pointer;white-space:nowrap;border-bottom:2px solid ${t===activeType?'#c9a84c':'transparent'};transition:all 0.2s;">${c.icon} ${c.label}</div>`;
  }).join('');
  body.innerHTML = types.map(t => `
    <div id="efmms-${t}" style="display:${t===activeType?'flex':'none'};height:100%;flex-direction:column;">
      <div style="padding:0.75rem 1rem;border-bottom:1px solid #eef1f8;">
        <button onclick="openEfmMasterForm('${t}')" style="width:100%;padding:0.6rem;background:#0f2540;color:#fff;border:none;border-radius:8px;font-size:0.82rem;font-weight:700;cursor:pointer;">+ Add ${EFM_MASTER_CONFIG[t].label}</button>
      </div>
      <div id="efmml-${t}" style="flex:1;overflow-y:auto;padding:0.5rem;"></div>
    </div>`).join('');
  document.getElementById('efmMasterTitle').textContent = EFM_MASTER_CONFIG[activeType].icon + ' ' + EFM_MASTER_CONFIG[activeType].label + ' Master';
  types.forEach(t => renderEfmMasterList(t));
}
function switchEfmMasterTab(type) {
  Object.keys(EFM_MASTER_CONFIG).forEach(t => {
    const tab=document.getElementById('efmmt-'+t); const sec=document.getElementById('efmms-'+t);
    if(tab){ tab.style.color=t===type?'#0f2540':'#6b7fa3'; tab.style.borderBottom=t===type?'2px solid #c9a84c':'2px solid transparent'; }
    if(sec) sec.style.display=t===type?'flex':'none';
  });
  document.getElementById('efmMasterTitle').textContent = EFM_MASTER_CONFIG[type].icon + ' ' + EFM_MASTER_CONFIG[type].label + ' Master';
  renderEfmMasterList(type);
}
function renderEfmMasterList(type) {
  const cfg=EFM_MASTER_CONFIG[type]; const data=getEfmMaster(type);
  const listEl=document.getElementById('efmml-'+type); if(!listEl) return;
  if(!data.length){ listEl.innerHTML=`<div style="text-align:center;padding:2.5rem 1rem;color:#6b7fa3;"><div style="font-size:2rem;opacity:0.35;margin-bottom:0.5rem;">${cfg.icon}</div><div style="font-size:0.85rem;font-weight:600;">No ${cfg.label} records yet</div><div style="font-size:0.75rem;margin-top:0.25rem;">Click "+ Add ${cfg.label}" above</div></div>`; return; }
  listEl.innerHTML = data.map((r,i) => `
    <div onclick="pickEfmMasterRecord('${type}',${i})" style="display:flex;align-items:center;gap:0.75rem;padding:0.75rem 0.85rem;border-radius:10px;border:1px solid #dde3f0;margin-bottom:0.5rem;cursor:pointer;background:#fff;transition:all 0.18s;" onmouseover="this.style.background='#f4f3ee'" onmouseout="this.style.background='#fff'">
      <div style="width:34px;height:34px;border-radius:8px;background:#0f2540;color:#fff;display:flex;align-items:center;justify-content:center;font-size:0.9rem;flex-shrink:0;">${cfg.icon}</div>
      <div style="flex:1;min-width:0;"><div style="font-size:0.83rem;font-weight:700;color:#0f2540;">${cfg.display(r)}</div><div style="font-size:0.7rem;color:#6b7fa3;">${cfg.sub(r)}</div></div>
      <div style="display:flex;gap:0.3rem;" onclick="event.stopPropagation()">
        <button onclick="pickEfmMasterRecord('${type}',${i})" style="padding:0.25rem 0.55rem;border-radius:6px;font-size:0.7rem;font-weight:700;border:none;cursor:pointer;background:#0f2540;color:#fff;">↗ Use</button>
        <button onclick="openEfmMasterForm('${type}',${i})" style="padding:0.25rem 0.55rem;border-radius:6px;font-size:0.7rem;font-weight:700;border:none;cursor:pointer;background:#f4f3ee;color:#3d5475;">✏️</button>
        <button onclick="deleteEfmMaster('${type}',${i})" style="padding:0.25rem 0.55rem;border-radius:6px;font-size:0.7rem;font-weight:700;border:none;cursor:pointer;background:#fef2f2;color:#dc2626;">🗑</button>
      </div>
    </div>`).join('');
}
function pickEfmMasterRecord(type,idx) {
  const cfg=EFM_MASTER_CONFIG[type]; const data=getEfmMaster(type); const r=data[idx]; if(!r) return;
  if(efmMasterPickTarget){ cfg.fill(r,efmMasterPickTarget); showToastEfm('✅',cfg.label+' selected: '+cfg.display(r)); closeEfmMaster(); }
}
function openEfmMasterForm(type,idx) {
  efmMasterEditType=type; efmMasterEditIdx=(idx!==undefined&&idx!==null)?idx:null;
  const cfg=EFM_MASTER_CONFIG[type]; const data=getEfmMaster(type);
  const rec=efmMasterEditIdx!==null?data[efmMasterEditIdx]:null;
  document.getElementById('efmMfTitle').textContent=rec?`✏️ Edit ${cfg.label}`:`+ Add ${cfg.label}`;
  document.getElementById('efmMfBody').innerHTML=cfg.fields.map(f=>`
    <div style="display:flex;flex-direction:column;gap:0.3rem;">
      <label style="font-size:0.7rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#3d5475;">${f.label}${f.req?' *':''}</label>
      <input id="efmmf_${f.id}" type="text" placeholder="${f.placeholder}" value="${rec?(rec[f.id]||''):''}" style="padding:0.65rem 0.85rem;border:1.5px solid #dde3f0;border-radius:8px;font-size:0.88rem;font-family:inherit;width:100%;box-sizing:border-box;transition:all 0.2s;" onfocus="this.style.borderColor='#0f2540'" onblur="this.style.borderColor='#dde3f0'"/>
    </div>`).join('');
  document.getElementById('efmMfOverlay').style.display='flex';
  setTimeout(()=>{ const f=document.querySelector('#efmMfBody input'); if(f) f.focus(); },100);
}
function closeEfmMasterForm() { document.getElementById('efmMfOverlay').style.display='none'; efmMasterEditType=null; efmMasterEditIdx=null; }
function saveEfmMasterRecord() {
  const type=efmMasterEditType; if(!type) return;
  const cfg=EFM_MASTER_CONFIG[type]; const data=getEfmMaster(type); const rec={}; let valid=true;
  cfg.fields.forEach(f=>{ const el=document.getElementById('efmmf_'+f.id); if(el) rec[f.id]=el.value.trim(); if(f.req&&!rec[f.id]){valid=false;el.style.borderColor='#ef4444';} else if(el) el.style.borderColor='#dde3f0'; });
  if(!valid){showToastEfm('⚠️','Please fill all required fields!');return;}
  if(efmMasterEditIdx!==null){data[efmMasterEditIdx]=rec;}else{data.push(rec);}
  setEfmMaster(type,data); closeEfmMasterForm(); renderEfmMasterList(type); showToastEfm('✅',cfg.label+' saved!');
}
function deleteEfmMaster(type,idx) {
  if(!confirm('Delete this record?')) return;
  const data=getEfmMaster(type); data.splice(idx,1); setEfmMaster(type,data); renderEfmMasterList(type); showToastEfm('🗑','Deleted.');
}

// Autocomplete
const EFM_FIELD_MAP = {
  'f_from_company': {type:'company',  display:r=>r.name, sub:r=>r.addr1||''},
  'f_from_name':    {type:'signatory',display:r=>r.name, sub:r=>r.designation||''},
  'f_to_name':      {type:'buyer',    display:r=>r.name, sub:r=>[r.company,r.country].filter(Boolean).join(', ')},
  'f_product':      {type:'product',  display:r=>r.name, sub:r=>r.hscode?'HS:'+r.hscode:''},
};
let efmAcField=null;
function getEfmAcDrop(){ ensureMasterPanel(); return document.getElementById('efmAcDropdown'); }
function posEfmAC(el){ const r=el.getBoundingClientRect(); const d=getEfmAcDrop(); d.style.left=r.left+'px'; d.style.top=(r.bottom+4)+'px'; d.style.width=Math.max(r.width,260)+'px'; }
function renderEfmAC(fieldId,query){
  const map=EFM_FIELD_MAP[fieldId]; if(!map) return closeEfmAC();
  const data=getEfmMaster(map.type); if(!data.length) return closeEfmAC();
  const q=(query||'').toLowerCase().trim();
  const filtered=q?data.filter(r=>map.display(r).toLowerCase().includes(q)):data;
  if(!filtered.length) return closeEfmAC();
  const cfg=EFM_MASTER_CONFIG[map.type]; const d=getEfmAcDrop();
  d.innerHTML=`<div style="padding:0.45rem 0.75rem;font-size:0.62rem;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#6b7fa3;border-bottom:1px solid #eef1f8;display:flex;align-items:center;justify-content:space-between;"><span>${cfg.icon} Saved ${cfg.label}</span><span style="color:#9aadcc;">${filtered.length} found</span></div>`+
  filtered.map(r=>{const idx=data.indexOf(r);const sub=map.sub(r);return`<div class="efm-ac-item" onmousedown="event.preventDefault();pickEfmAC('${fieldId}',${idx})" style="padding:0.6rem 0.85rem;cursor:pointer;border-bottom:1px solid #f4f3ee;display:flex;align-items:center;gap:0.65rem;transition:background 0.15s;"><div style="width:28px;height:28px;border-radius:7px;background:#f0f2f8;display:flex;align-items:center;justify-content:center;font-size:0.85rem;flex-shrink:0;">${cfg.icon}</div><div style="flex:1;min-width:0;"><div style="font-size:0.82rem;font-weight:600;color:#0f2540;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${map.display(r)}</div>${sub?`<div style="font-size:0.68rem;color:#6b7fa3;margin-top:0.1rem;">${sub}</div>`:''}</div><div style="font-size:0.65rem;color:#c9a84c;font-weight:700;flex-shrink:0;">↗ Use</div></div>`;}).join('');
  d.querySelectorAll('.efm-ac-item').forEach(el=>{el.addEventListener('mouseover',()=>el.style.background='#f4f3ee');el.addEventListener('mouseout',()=>el.style.background='');});
  d.style.display='block'; posEfmAC(document.getElementById(fieldId));
}
function pickEfmAC(fieldId,idx){
  const map=EFM_FIELD_MAP[fieldId]; if(!map) return;
  const data=getEfmMaster(map.type); const r=data[idx]; if(!r) return;
  EFM_MASTER_CONFIG[map.type].fill(r,fieldId); closeEfmAC(); showToastEfm('✅',map.display(r)+' selected');
}
function closeEfmAC(){ const d=document.getElementById('efmAcDropdown'); if(d) d.style.display='none'; efmAcField=null; }

document.addEventListener('DOMContentLoaded',()=>{
  setTimeout(()=>{
    ensureMasterPanel();
    Object.keys(EFM_FIELD_MAP).forEach(fieldId=>{
      const el=document.getElementById(fieldId); if(!el) return;
      el.addEventListener('focus',()=>{efmAcField=fieldId;renderEfmAC(fieldId,el.value);});
      el.addEventListener('click',()=>{efmAcField=fieldId;renderEfmAC(fieldId,el.value);});
      el.addEventListener('input',()=>{if(efmAcField===fieldId)renderEfmAC(fieldId,el.value);});
      el.addEventListener('keydown',e=>{
        if(e.key==='Escape'){closeEfmAC();return;}
        const d=document.getElementById('efmAcDropdown'); if(!d||d.style.display==='none') return;
        const items=d.querySelectorAll('.efm-ac-item'); const active=d.querySelector('.efm-ac-item.ac-active');
        let idx=-1; items.forEach((it,i)=>{if(it===active)idx=i;});
        if(e.key==='ArrowDown'){e.preventDefault();const next=idx<items.length-1?idx+1:0;items.forEach(i=>{i.classList.remove('ac-active');i.style.background='';});items[next].classList.add('ac-active');items[next].style.background='#f4f3ee';items[next].scrollIntoView({block:'nearest'});}
        if(e.key==='ArrowUp'){e.preventDefault();const prev=idx>0?idx-1:items.length-1;items.forEach(i=>{i.classList.remove('ac-active');i.style.background='';});items[prev].classList.add('ac-active');items[prev].style.background='#f4f3ee';items[prev].scrollIntoView({block:'nearest'});}
        if(e.key==='Enter'&&active){e.preventDefault();active.dispatchEvent(new MouseEvent('mousedown'));}
      });
    });
    document.addEventListener('click',e=>{
      const d=document.getElementById('efmAcDropdown');
      if(d&&!d.contains(e.target)&&!Object.keys(EFM_FIELD_MAP).some(id=>document.getElementById(id)===e.target)) closeEfmAC();
    });
    window.addEventListener('scroll',()=>{
      const d=document.getElementById('efmAcDropdown');
      if(efmAcField&&d&&d.style.display!=='none') posEfmAC(document.getElementById(efmAcField));
    },true);
  },300);
});

