/* ============================================================
   cbm.js — CBM Calculation Logic + Step Navigation
   IMPEXIO v2
   ============================================================ */

let cbmRecords  = JSON.parse(localStorage.getItem('cbm_records') || '[]');
let editingId   = null;
let currentStep = 1;
const TOTAL_STEPS = 5;
let cbmRowCount = 0;
let cftRowCount = 0;

document.addEventListener('DOMContentLoaded', () => {
  loadSess();
  populateTopbar();
  renderRecords();
  buildNavDots();
  document.getElementById('f_cbmdate').value = todayStr();
  autoSetCbmNo();
  addCbmRow();
  addCftRow();
});

function todayStr() { return new Date().toISOString().split('T')[0]; }

function autoSetCbmNo() {
  const el = document.getElementById('f_cbmno');
  if (el && !el.value) {
    el.value = `CBM/2026/${(cbmRecords.length+1).toString().padStart(4,'0')}`;
  }
}

function populateTopbar() {
  const s = sess;
  if (!s.username) return;
  setTxt('dtbUname', s.username);
  setTxt('dtbRole',  s.role || 'Administrator');
  const av = document.getElementById('dtbAv');
  if (av) av.textContent = (s.username||'A')[0].toUpperCase();
  const meta = document.getElementById('dtbMeta');
  if (meta && s.company && s.year) {
    meta.innerHTML = `
      <div class="dtb-chip">🏷️ <strong>${s.clientCode}</strong></div>
      <div class="dtb-chip">🏢 <strong>${s.company.name.split(' ').slice(0,3).join(' ')}</strong></div>
      <div class="dtb-chip">📅 <strong>FY ${s.year.label}</strong></div>`;
  }
}

function setTxt(id, v) { const el = document.getElementById(id); if (el) el.textContent = v; }

function doLogout() {
  if (confirm('Logout from IMPEXIO?')) {
    sessionStorage.removeItem('impexio');
    window.location.href = 'index.html';
  }
}

// ── View switching ────────────────────────────────────────────
function showForm(id = null) {
  editingId = id;
  document.getElementById('viewList').style.display = 'none';
  document.getElementById('viewForm').style.display = 'flex';
  document.body.style.overflow = 'hidden';
  if (id !== null) {
    const rec = cbmRecords.find(r => r.id === id);
    if (rec) loadFormData(rec);
  } else {
    clearForm(false);
    autoSetCbmNo();
  }
  goStep(1);
}

function showList() {
  document.getElementById('viewForm').style.display = 'none';
  document.getElementById('viewList').style.display = 'block';
  document.body.style.overflow = '';
  editingId = null;
}

// ── Step Navigation ───────────────────────────────────────────
function buildNavDots() {
  const wrap = document.getElementById('navDots');
  if (!wrap) return;
  wrap.innerHTML = '';
  for (let i = 1; i <= TOTAL_STEPS; i++) {
    const d = document.createElement('div');
    d.className = 'cbm-ndot' + (i===1?' active':'');
    d.id = `nd${i}`;
    d.onclick = () => goStep(i);
    wrap.appendChild(d);
  }
}

function goStep(n) {
  document.getElementById(`panel${currentStep}`)?.classList.remove('active');
  document.getElementById(`sd${currentStep}`)?.classList.remove('active');
  for (let i=1; i<=TOTAL_STEPS; i++) {
    const si = document.getElementById(`sd${i}`);
    const nd = document.getElementById(`nd${i}`);
    if (i < n) {
      si?.classList.add('done'); si?.classList.remove('active');
      nd?.classList.add('done'); nd?.classList.remove('active');
    } else if (i === n) {
      si?.classList.add('active'); si?.classList.remove('done');
      nd?.classList.add('active'); nd?.classList.remove('done');
    } else {
      si?.classList.remove('active','done');
      nd?.classList.remove('active','done');
    }
  }
  document.querySelectorAll('.cbm-sline').forEach((l,idx) => l.classList.toggle('done', idx < n-1));
  currentStep = n;
  document.getElementById(`panel${n}`)?.classList.add('active');
  const prev = document.getElementById('btnPrev');
  const next = document.getElementById('btnNext');
  if (prev) prev.disabled = n===1;
  if (next) next.disabled = n===TOTAL_STEPS;
  if (n===5) refreshSummary();
}

function nextStep() { if (currentStep < TOTAL_STEPS) goStep(currentStep+1); }
function prevStep() { if (currentStep > 1) goStep(currentStep-1); }

// ── Container totals ──────────────────────────────────────────
function calcContainerTotal() {
  const rows=[{cbm:'c20_cbm',mt:'c20_mt',qty:'c20_qty'},{cbm:'c40gp_cbm',mt:'c40gp_mt',qty:'c40gp_qty'},{cbm:'c40hq_cbm',mt:'c40hq_mt',qty:'c40hq_qty'},{cbm:'lcl_cbm',mt:'lcl_mt',qty:'lcl_qty'}];
  let tC=0,tM=0,tQ=0;
  rows.forEach(r=>{ tC+=parseFloat(gv(r.cbm))||0; tM+=parseFloat(gv(r.mt))||0; tQ+=parseInt(gv(r.qty))||0; });
  setTxt('tot_cbm',tC.toFixed(3)); setTxt('tot_mt',tM.toFixed(3)); setTxt('tot_qty',tQ.toString());
  setTxt('ls_cbm',tC.toFixed(3)); setTxt('ls_mt',tM.toFixed(3)); setTxt('ls_qty',tQ.toString());
}

function gv(id) { return document.getElementById(id)?.value||''; }

// ── CBM rows ──────────────────────────────────────────────────
function addCbmRow() {
  const n=++cbmRowCount;
  const tb=document.getElementById('cbmRows');
  const tr=document.createElement('tr');
  tr.id=`cbmR${n}`;
  tr.innerHTML=`
    <td><input type="text" class="cbm-ci" style="text-align:left;min-width:100px;" id="cbm_d${n}" placeholder="Item / Product"/></td>
    <td><input type="number" class="cbm-ci" id="cbm_l${n}" placeholder="0.00" step="0.01" oninput="calcCbmRow(${n})"/></td>
    <td><input type="number" class="cbm-ci" id="cbm_w${n}" placeholder="0.00" step="0.01" oninput="calcCbmRow(${n})"/></td>
    <td><input type="number" class="cbm-ci" id="cbm_h${n}" placeholder="0.00" step="0.01" oninput="calcCbmRow(${n})"/></td>
    <td><input type="number" class="cbm-ci" id="cbm_b${n}" placeholder="1" min="1" oninput="calcCbmRow(${n})"/></td>
    <td><span class="cbm-calc-res" id="cbm_r${n}">0.000000</span></td>
    <td><button class="cbm-row-del" onclick="delCbmRow(${n})">✕</button></td>`;
  tb.appendChild(tr);
}
function delCbmRow(n){ document.getElementById(`cbmR${n}`)?.remove(); calcCbmTotals(); }
function calcCbmRow(n){
  const l=parseFloat(document.getElementById(`cbm_l${n}`)?.value)||0;
  const w=parseFloat(document.getElementById(`cbm_w${n}`)?.value)||0;
  const h=parseFloat(document.getElementById(`cbm_h${n}`)?.value)||0;
  const b=parseInt(document.getElementById(`cbm_b${n}`)?.value)||1;
  const el=document.getElementById(`cbm_r${n}`); if(el) el.textContent=((l*w*h*b)/1000000).toFixed(6);
  calcCbmTotals();
}
function calcCbmTotals(){
  let total=0,boxes=0;
  document.getElementById('cbmRows').querySelectorAll('tr').forEach(tr=>{
    const id=tr.id.replace('cbmR','');
    const l=parseFloat(document.getElementById(`cbm_l${id}`)?.value)||0;
    const w=parseFloat(document.getElementById(`cbm_w${id}`)?.value)||0;
    const h=parseFloat(document.getElementById(`cbm_h${id}`)?.value)||0;
    const b=parseInt(document.getElementById(`cbm_b${id}`)?.value)||0;
    total+=(l*w*h*b)/1000000; boxes+=b;
  });
  setTxt('cbm_total_result',total.toFixed(6)); setTxt('cbm_total_boxes',boxes.toString());
}

// ── CFT rows ──────────────────────────────────────────────────
function addCftRow(){
  const n=++cftRowCount;
  const tb=document.getElementById('cftRows');
  const tr=document.createElement('tr');
  tr.id=`cftR${n}`;
  tr.innerHTML=`
    <td><input type="text" class="cbm-ci" style="text-align:left;min-width:100px;" id="cft_d${n}" placeholder="Item / Product"/></td>
    <td><input type="number" class="cbm-ci" id="cft_l${n}" placeholder="0.00" step="0.01" oninput="calcCftRow(${n})"/></td>
    <td><input type="number" class="cbm-ci" id="cft_w${n}" placeholder="0.00" step="0.01" oninput="calcCftRow(${n})"/></td>
    <td><input type="number" class="cbm-ci" id="cft_h${n}" placeholder="0.00" step="0.01" oninput="calcCftRow(${n})"/></td>
    <td><input type="number" class="cbm-ci" id="cft_b${n}" placeholder="1" min="1" oninput="calcCftRow(${n})"/></td>
    <td><span class="cbm-calc-res" id="cft_r${n}">0.0000</span></td>
    <td><button class="cbm-row-del" onclick="delCftRow(${n})">✕</button></td>`;
  tb.appendChild(tr);
}
function delCftRow(n){ document.getElementById(`cftR${n}`)?.remove(); calcCftTotals(); }
function calcCftRow(n){
  const l=parseFloat(document.getElementById(`cft_l${n}`)?.value)||0;
  const w=parseFloat(document.getElementById(`cft_w${n}`)?.value)||0;
  const h=parseFloat(document.getElementById(`cft_h${n}`)?.value)||0;
  const b=parseInt(document.getElementById(`cft_b${n}`)?.value)||1;
  const el=document.getElementById(`cft_r${n}`); if(el) el.textContent=((l*w*h*b)/1728).toFixed(4);
  calcCftTotals();
}
function calcCftTotals(){
  let total=0,boxes=0;
  document.getElementById('cftRows').querySelectorAll('tr').forEach(tr=>{
    const id=tr.id.replace('cftR','');
    const l=parseFloat(document.getElementById(`cft_l${id}`)?.value)||0;
    const w=parseFloat(document.getElementById(`cft_w${id}`)?.value)||0;
    const h=parseFloat(document.getElementById(`cft_h${id}`)?.value)||0;
    const b=parseInt(document.getElementById(`cft_b${id}`)?.value)||0;
    total+=(l*w*h*b)/1728; boxes+=b;
  });
  setTxt('cft_total_result',total.toFixed(4)); setTxt('cft_total_boxes',boxes.toString());
}

// ── Summary ───────────────────────────────────────────────────
function refreshSummary(){
  const cbmVal=parseFloat(document.getElementById('cbm_total_result')?.textContent)||0;
  const cftVal=parseFloat(document.getElementById('cft_total_result')?.textContent)||0;
  setTxt('sum_cbm',cbmVal.toFixed(6)); setTxt('sum_cft',cftVal.toFixed(4));
  setTxt('sum_cbm2cft',(cbmVal*35.3147).toFixed(4)+' CFT');
  setTxt('sum_cft2cbm',(cftVal*0.028317).toFixed(6)+' CBM');
  setTxt('sum_boxes_cbm',document.getElementById('cbm_total_boxes')?.textContent||'0');
  setTxt('sum_boxes_cft',document.getElementById('cft_total_boxes')?.textContent||'0');
  setTxt('sum_cont_cbm',(parseFloat(document.getElementById('tot_cbm')?.textContent)||0).toFixed(3));
  setTxt('sum_cont_mt',(parseFloat(document.getElementById('tot_mt')?.textContent)||0).toFixed(3));
  setTxt('sum_cont_qty',document.getElementById('tot_qty')?.textContent||'0');
  const dr=document.getElementById('docRef');
  if(dr) dr.innerHTML=`
    <div class="cbm-docref-item"><span>Company:</span><strong>${gv('f_company')||'—'}</strong></div>
    <div class="cbm-docref-item"><span>CBM No:</span><strong>${gv('f_cbmno')||'—'}</strong></div>
    <div class="cbm-docref-item"><span>Date:</span><strong>${gv('f_cbmdate')||'—'}</strong></div>
    <div class="cbm-docref-item"><span>Exporter:</span><strong>${gv('f_exporter')||'—'}</strong></div>`;
}

// ── Clear ─────────────────────────────────────────────────────
function clearForm(resetId=true){
  ['f_company','f_branch','f_location','f_daybook','f_cbmno','f_cbmdate','f_listno','f_exporter','f_remarks','f_preparedby','f_signatory',
   'c20_cbm','c20_mt','c20_qty','c40gp_cbm','c40gp_mt','c40gp_qty','c40hq_cbm','c40hq_mt','c40hq_qty','lcl_cbm','lcl_mt','lcl_qty']
  .forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
  document.getElementById('f_cbmdate').value=todayStr();
  calcContainerTotal();
  document.getElementById('cbmRows').innerHTML=''; document.getElementById('cftRows').innerHTML='';
  cbmRowCount=0; cftRowCount=0;
  addCbmRow(); addCftRow();
  calcCbmTotals(); calcCftTotals();
  if(resetId){editingId=null;autoSetCbmNo();}
}

// ── Save ──────────────────────────────────────────────────────
function saveRecord(){
  const company=gv('f_company').trim(), cbmno=gv('f_cbmno').trim(), cbmdate=gv('f_cbmdate');
  if(!company){alert('Please enter Company Name.');goStep(1);document.getElementById('f_company').focus();return;}
  if(!cbmno){alert('Please enter CBM No.');goStep(1);return;}
  if(!cbmdate){alert('Please select CBM Date.');goStep(1);return;}
  const cbmVal=parseFloat(document.getElementById('cbm_total_result')?.textContent)||0;
  const cftVal=parseFloat(document.getElementById('cft_total_result')?.textContent)||0;
  let containers=[];
  if(parseFloat(gv('c20_cbm'))>0) containers.push("20'");
  if(parseFloat(gv('c40gp_cbm'))>0) containers.push("40'GP");
  if(parseFloat(gv('c40hq_cbm'))>0) containers.push("40'HQ");
  if(parseFloat(gv('lcl_cbm'))>0) containers.push("LCL");
  const record={
    id:editingId??Date.now(), company, branch:gv('f_branch'), location:gv('f_location'),
    daybook:gv('f_daybook'), cbmno, cbmdate, listno:gv('f_listno'), exporter:gv('f_exporter'),
    remarks:gv('f_remarks'), preparedby:gv('f_preparedby'), signatory:gv('f_signatory'),
    containers:containers.join(', ')||'—', totalCbm:cbmVal, totalCft:cftVal,
    cbm2cft:cbmVal*35.3147, cft2cbm:cftVal*0.028317,
    cbmBoxes:document.getElementById('cbm_total_boxes')?.textContent||'0',
    cftBoxes:document.getElementById('cft_total_boxes')?.textContent||'0',
    contDetail:{
      c20:{cbm:gv('c20_cbm'),mt:gv('c20_mt'),qty:gv('c20_qty')},
      c40gp:{cbm:gv('c40gp_cbm'),mt:gv('c40gp_mt'),qty:gv('c40gp_qty')},
      c40hq:{cbm:gv('c40hq_cbm'),mt:gv('c40hq_mt'),qty:gv('c40hq_qty')},
      lcl:{cbm:gv('lcl_cbm'),mt:gv('lcl_mt'),qty:gv('lcl_qty')}
    },
    cbmRows:getCbmRows(), cftRows:getCftRows()
  };
  if(editingId!==null){const idx=cbmRecords.findIndex(r=>r.id===editingId);if(idx>-1)cbmRecords[idx]=record;else cbmRecords.unshift(record);}
  else cbmRecords.unshift(record);
  localStorage.setItem('cbm_records',JSON.stringify(cbmRecords));
  renderRecords(); showToastCbm('✅',`Record ${cbmno} saved!`); showList();
}

function getCbmRows(){
  const rows=[];
  document.getElementById('cbmRows').querySelectorAll('tr').forEach(tr=>{
    const id=tr.id.replace('cbmR','');
    rows.push({desc:document.getElementById(`cbm_d${id}`)?.value||'',l:document.getElementById(`cbm_l${id}`)?.value||'',w:document.getElementById(`cbm_w${id}`)?.value||'',h:document.getElementById(`cbm_h${id}`)?.value||'',boxes:document.getElementById(`cbm_b${id}`)?.value||'',res:document.getElementById(`cbm_r${id}`)?.textContent||'0.000000'});
  });
  return rows;
}
function getCftRows(){
  const rows=[];
  document.getElementById('cftRows').querySelectorAll('tr').forEach(tr=>{
    const id=tr.id.replace('cftR','');
    rows.push({desc:document.getElementById(`cft_d${id}`)?.value||'',l:document.getElementById(`cft_l${id}`)?.value||'',w:document.getElementById(`cft_w${id}`)?.value||'',h:document.getElementById(`cft_h${id}`)?.value||'',boxes:document.getElementById(`cft_b${id}`)?.value||'',res:document.getElementById(`cft_r${id}`)?.textContent||'0.0000'});
  });
  return rows;
}

function loadFormData(rec){
  const sv=(id,v)=>{const el=document.getElementById(id);if(el)el.value=v||'';};
  sv('f_company',rec.company);sv('f_branch',rec.branch);sv('f_location',rec.location);sv('f_daybook',rec.daybook);sv('f_cbmno',rec.cbmno);sv('f_cbmdate',rec.cbmdate);sv('f_listno',rec.listno);sv('f_exporter',rec.exporter);sv('f_remarks',rec.remarks);sv('f_preparedby',rec.preparedby);sv('f_signatory',rec.signatory);
  const d=rec.contDetail||{};
  sv('c20_cbm',d.c20?.cbm);sv('c20_mt',d.c20?.mt);sv('c20_qty',d.c20?.qty);sv('c40gp_cbm',d.c40gp?.cbm);sv('c40gp_mt',d.c40gp?.mt);sv('c40gp_qty',d.c40gp?.qty);sv('c40hq_cbm',d.c40hq?.cbm);sv('c40hq_mt',d.c40hq?.mt);sv('c40hq_qty',d.c40hq?.qty);sv('lcl_cbm',d.lcl?.cbm);sv('lcl_mt',d.lcl?.mt);sv('lcl_qty',d.lcl?.qty);
  calcContainerTotal();
  document.getElementById('cbmRows').innerHTML='';cbmRowCount=0;
  (rec.cbmRows||[]).forEach(r=>{addCbmRow();const n=cbmRowCount;const sv2=(id,v)=>{const el=document.getElementById(id);if(el)el.value=v||'';};sv2(`cbm_d${n}`,r.desc);sv2(`cbm_l${n}`,r.l);sv2(`cbm_w${n}`,r.w);sv2(`cbm_h${n}`,r.h);sv2(`cbm_b${n}`,r.boxes);calcCbmRow(n);});
  if(!cbmRowCount)addCbmRow();
  document.getElementById('cftRows').innerHTML='';cftRowCount=0;
  (rec.cftRows||[]).forEach(r=>{addCftRow();const n=cftRowCount;const sv2=(id,v)=>{const el=document.getElementById(id);if(el)el.value=v||'';};sv2(`cft_d${n}`,r.desc);sv2(`cft_l${n}`,r.l);sv2(`cft_w${n}`,r.w);sv2(`cft_h${n}`,r.h);sv2(`cft_b${n}`,r.boxes);calcCftRow(n);});
  if(!cftRowCount)addCftRow();
}

function renderRecords(list=null){
  const data=list||cbmRecords, tbody=document.getElementById('recordsTbody');
  tbody.innerHTML='';
  if(!data.length){tbody.innerHTML=`<tr class="cbm-empty-row"><td colspan="8"><div class="cbm-empty"><div class="cbm-empty-icon">📐</div><div class="cbm-empty-text">No CBM records yet</div><div class="cbm-empty-sub">Click "New CBM Entry" to get started</div></div></td></tr>`;return;}
  data.forEach(rec=>{
    const tr=document.createElement('tr');
    tr.innerHTML=`<td><strong>${rec.cbmno}</strong></td><td>${fmtDate(rec.cbmdate)}</td><td>${rec.company}</td><td>${rec.branch||'—'}</td><td><span style="font-family:var(--font-mono);font-weight:700;color:var(--navy);">${(rec.totalCbm||0).toFixed(4)}</span></td><td><span style="font-family:var(--font-mono);color:var(--text-mid);">${(rec.totalCft||0).toFixed(4)}</span></td><td><span style="font-size:0.78rem;color:var(--text-soft);">${rec.containers||'—'}</span></td><td><div class="cbm-action-btns"><button class="cbm-act-btn edit" onclick="showForm(${rec.id})">✏️ Edit</button><button class="cbm-act-btn print" onclick="printById(${rec.id})">🖨 Print</button><button class="cbm-act-btn delete" onclick="deleteRecord(${rec.id})">🗑 Delete</button></div></td>`;
    tbody.appendChild(tr);
  });
}

function filterRecords(){
  const q=document.getElementById('searchInput')?.value.toLowerCase()||'';
  if(!q){renderRecords();return;}
  renderRecords(cbmRecords.filter(r=>r.cbmno?.toLowerCase().includes(q)||r.company?.toLowerCase().includes(q)||r.branch?.toLowerCase().includes(q)||r.exporter?.toLowerCase().includes(q)));
}

function deleteRecord(id){
  if(!confirm('Delete this CBM record?'))return;
  cbmRecords=cbmRecords.filter(r=>r.id!==id);
  localStorage.setItem('cbm_records',JSON.stringify(cbmRecords));
  renderRecords(); showToastCbm('🗑','Record deleted.');
}

function fmtDate(str){if(!str)return'—';return new Date(str).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'});}

function printRecord(){doPrint(buildTempRec());}
function printById(id){const rec=cbmRecords.find(r=>r.id===id);if(rec)doPrint(rec);}
function buildTempRec(){
  const cbmVal=parseFloat(document.getElementById('cbm_total_result')?.textContent)||0;
  const cftVal=parseFloat(document.getElementById('cft_total_result')?.textContent)||0;
  return{company:gv('f_company'),branch:gv('f_branch'),location:gv('f_location'),daybook:gv('f_daybook'),cbmno:gv('f_cbmno'),cbmdate:gv('f_cbmdate'),listno:gv('f_listno'),exporter:gv('f_exporter'),remarks:gv('f_remarks'),preparedby:gv('f_preparedby'),signatory:gv('f_signatory'),totalCbm:cbmVal,totalCft:cftVal,cbm2cft:cbmVal*35.3147,cft2cbm:cftVal*0.028317,cbmBoxes:document.getElementById('cbm_total_boxes')?.textContent||'0',cftBoxes:document.getElementById('cft_total_boxes')?.textContent||'0',contDetail:{c20:{cbm:gv('c20_cbm'),mt:gv('c20_mt'),qty:gv('c20_qty')},c40gp:{cbm:gv('c40gp_cbm'),mt:gv('c40gp_mt'),qty:gv('c40gp_qty')},c40hq:{cbm:gv('c40hq_cbm'),mt:gv('c40hq_mt'),qty:gv('c40hq_qty')},lcl:{cbm:gv('lcl_cbm'),mt:gv('lcl_mt'),qty:gv('lcl_qty')}},cbmRows:getCbmRows(),cftRows:getCftRows()};
}

function doPrint(rec){
  const conts=[{label:"20' Container",d:rec.contDetail?.c20},{label:"40' GP Container",d:rec.contDetail?.c40gp},{label:"40' HQ Container",d:rec.contDetail?.c40hq},{label:"LCL Shipment",d:rec.contDetail?.lcl}];
  const totC=conts.reduce((s,r)=>s+(parseFloat(r.d?.cbm)||0),0);
  const totM=conts.reduce((s,r)=>s+(parseFloat(r.d?.mt)||0),0);
  const totQ=conts.reduce((s,r)=>s+(parseInt(r.d?.qty)||0),0);
  const client=sess.clientCode||'Demo001', user=sess.username||'Admin';
  document.getElementById('printArea').innerHTML=`<div class="print-doc">
    <div class="print-header"><div class="print-header-title">IMPEXIO &mdash; CBM CALCULATION REPORT</div><div class="print-header-sub">Export Import Document Portal | Client: ${client}</div></div>
    <div class="print-meta-grid">
      <div class="print-meta-item"><span class="print-meta-label">Company:&nbsp;</span><span class="print-meta-val">${rec.company||''}</span></div>
      <div class="print-meta-item"><span class="print-meta-label">Branch:&nbsp;</span><span class="print-meta-val">${rec.branch||''}</span></div>
      <div class="print-meta-item"><span class="print-meta-label">CBM No:&nbsp;</span><span class="print-meta-val">${rec.cbmno||''}</span></div>
      <div class="print-meta-item"><span class="print-meta-label">Location:&nbsp;</span><span class="print-meta-val">${rec.location||''}</span></div>
      <div class="print-meta-item"><span class="print-meta-label">Day Book:&nbsp;</span><span class="print-meta-val">${rec.daybook||''}</span></div>
      <div class="print-meta-item"><span class="print-meta-label">CBM Date:&nbsp;</span><span class="print-meta-val">${fmtDate(rec.cbmdate)}</span></div>
      <div class="print-meta-item"><span class="print-meta-label">Exporter:&nbsp;</span><span class="print-meta-val">${rec.exporter||''}</span></div>
      <div class="print-meta-item"><span class="print-meta-label">Listing No:&nbsp;</span><span class="print-meta-val">${rec.listno||''}</span></div>
      <div class="print-meta-item"><span class="print-meta-label">Print User:&nbsp;</span><span class="print-meta-val">${user}</span></div>
    </div>
    <div class="print-section-head">A. Container Detail Summary</div>
    <table class="print-table"><thead><tr><th>Container Type</th><th>CBM</th><th>MT</th><th>Product Qty</th></tr></thead><tbody>
      ${conts.map(r=>`<tr><td>${r.label}</td><td style="text-align:right">${parseFloat(r.d?.cbm||0).toFixed(3)}</td><td style="text-align:right">${parseFloat(r.d?.mt||0).toFixed(3)}</td><td style="text-align:right">${parseInt(r.d?.qty||0)}</td></tr>`).join('')}
      <tr class="total-row"><td>TOTAL</td><td style="text-align:right">${totC.toFixed(3)}</td><td style="text-align:right">${totM.toFixed(3)}</td><td style="text-align:right">${totQ}</td></tr>
    </tbody></table>
    <div class="print-section-head">B. CBM Calculation (L&times;W&times;H &divide; 1,000,000 | cm)</div>
    <table class="print-table"><thead><tr><th>Description</th><th>L(cm)</th><th>W(cm)</th><th>H(cm)</th><th>Boxes</th><th>CBM</th></tr></thead><tbody>
      ${(rec.cbmRows||[]).map(r=>`<tr><td>${r.desc||'—'}</td><td style="text-align:right">${r.l||'—'}</td><td style="text-align:right">${r.w||'—'}</td><td style="text-align:right">${r.h||'—'}</td><td style="text-align:right">${r.boxes||'—'}</td><td style="text-align:right;font-weight:700">${r.res}</td></tr>`).join('')}
      <tr class="total-row"><td colspan="4">Total CBM</td><td style="text-align:right">${rec.cbmBoxes||0}</td><td style="text-align:right">${parseFloat(rec.totalCbm||0).toFixed(6)} CBM</td></tr>
    </tbody></table>
    <div class="print-section-head">C. CFT Calculation (L&times;W&times;H &divide; 1,728 | inch)</div>
    <table class="print-table"><thead><tr><th>Description</th><th>L(in)</th><th>W(in)</th><th>H(in)</th><th>Boxes</th><th>CFT</th></tr></thead><tbody>
      ${(rec.cftRows||[]).map(r=>`<tr><td>${r.desc||'—'}</td><td style="text-align:right">${r.l||'—'}</td><td style="text-align:right">${r.w||'—'}</td><td style="text-align:right">${r.h||'—'}</td><td style="text-align:right">${r.boxes||'—'}</td><td style="text-align:right;font-weight:700">${r.res}</td></tr>`).join('')}
      <tr class="total-row"><td colspan="4">Total CFT</td><td style="text-align:right">${rec.cftBoxes||0}</td><td style="text-align:right">${parseFloat(rec.totalCft||0).toFixed(4)} CFT</td></tr>
    </tbody></table>
    <div class="print-section-head">D. Calculation Summary</div>
    <div class="print-summary-grid">
      <div class="print-summary-item"><span class="print-summary-label">Total CBM</span><span class="print-summary-val">${parseFloat(rec.totalCbm||0).toFixed(6)} CBM</span></div>
      <div class="print-summary-item"><span class="print-summary-label">Total CFT</span><span class="print-summary-val">${parseFloat(rec.totalCft||0).toFixed(4)} CFT</span></div>
      <div class="print-summary-item"><span class="print-summary-label">CBM &rarr; CFT</span><span class="print-summary-val">${parseFloat(rec.cbm2cft||0).toFixed(4)} CFT</span></div>
      <div class="print-summary-item"><span class="print-summary-label">CFT &rarr; CBM</span><span class="print-summary-val">${parseFloat(rec.cft2cbm||0).toFixed(6)} CBM</span></div>
      <div class="print-summary-item"><span class="print-summary-label">Total Boxes (CBM)</span><span class="print-summary-val">${rec.cbmBoxes||0}</span></div>
      <div class="print-summary-item"><span class="print-summary-label">Total Boxes (CFT)</span><span class="print-summary-val">${rec.cftBoxes||0}</span></div>
    </div>
    <div class="print-section-head">E. Remarks</div>
    <div class="print-remarks">${rec.remarks||'&nbsp;'}</div>
    <div class="print-signatories">
      <div class="print-sig-item"><div class="print-sig-line">Prepared By: ${rec.preparedby||'__________________'}</div></div>
      <div class="print-sig-item"><div class="print-sig-line">Authorised Signatory: ${rec.signatory||'__________________'}</div></div>
    </div>
    <div class="print-footer">IMPEXIO | Export-Import Document Portal | Client: ${client} | Printed: ${new Date().toLocaleString('en-IN')}</div>
  </div>`;
  window.print();
}

function showToastCbm(icon,msg){
  let t=document.getElementById('toast');
  if(!t){t=document.createElement('div');t.id='toast';document.body.appendChild(t);}
  t.innerHTML=`<span>${icon}</span><span>${msg}</span>`;
  t.classList.add('show'); clearTimeout(t._t); t._t=setTimeout(()=>t.classList.remove('show'),3000);
}

/* ════════════════════════════════════════════
   IMPEXIO — MASTER DATA SYSTEM
   All 11 masters: Company, Branch, Location,
   Port, Exporter, Importer, Expense, Bank,
   Product, HS Code, Currency
════════════════════════════════════════════ */

// ── Master config ──────────────────────────
const MASTER_CONFIG = {
  company:  {
    label: 'Company', icon: '🏢', key: 'master_company',
    fields: [
      { id:'name',     label:'Company Name',    req:true,  placeholder:'e.g. Impexio Trade Solutions' },
      { id:'addr1',    label:'Address Line 1',  req:false, placeholder:'Building, Street' },
      { id:'addr2',    label:'Address Line 2',  req:false, placeholder:'Area, City' },
      { id:'gst',      label:'GST Number',      req:false, placeholder:'24AABCI1234A1Z5' },
      { id:'contact',  label:'Contact / Phone', req:false, placeholder:'+91 98765 43210' },
      { id:'email',    label:'Email',           req:false, placeholder:'info@company.com' },
    ],
    display: r => r.name,
    sub:     r => [r.addr1, r.addr2].filter(Boolean).join(', '),
    tags:    r => [r.gst, r.contact].filter(Boolean),
    fill:    (r, targetId) => {
      setFieldVal(targetId, r.name);
      // Also fill branch if empty
      const b = document.getElementById('f_branch');
      if (b && !b.value && r.addr1) b.value = r.addr1.split(',')[0];
    }
  },
  branch: {
    label: 'Branch', icon: '🏗️', key: 'master_branch',
    fields: [
      { id:'name',    label:'Branch Name',    req:true,  placeholder:'e.g. Ahmedabad Branch' },
      { id:'company', label:'Company',        req:false, placeholder:'Parent company name' },
      { id:'addr',    label:'Address',        req:false, placeholder:'Branch address' },
      { id:'contact', label:'Contact',        req:false, placeholder:'+91 98765 43210' },
    ],
    display: r => r.name,
    sub:     r => r.company || '',
    tags:    r => [r.addr, r.contact].filter(Boolean),
    fill:    (r, targetId) => setFieldVal(targetId, r.name)
  },
  location: {
    label: 'Location', icon: '📍', key: 'master_location',
    fields: [
      { id:'name',    label:'Location Name',  req:true,  placeholder:'e.g. Mundra, Gujarat' },
      { id:'state',   label:'State',          req:false, placeholder:'e.g. Gujarat' },
      { id:'country', label:'Country',        req:false, placeholder:'e.g. India' },
      { id:'pincode', label:'Pincode',        req:false, placeholder:'e.g. 370421' },
    ],
    display: r => r.name,
    sub:     r => [r.state, r.country].filter(Boolean).join(', '),
    tags:    r => [r.pincode].filter(Boolean),
    fill:    (r, targetId) => setFieldVal(targetId, r.name)
  },
  port: {
    label: 'Port', icon: '⚓', key: 'master_port',
    fields: [
      { id:'name',    label:'Port Name',      req:true,  placeholder:'e.g. Mundra Port' },
      { id:'code',    label:'Port Code',      req:false, placeholder:'e.g. INMUN' },
      { id:'country', label:'Country',        req:false, placeholder:'e.g. India' },
      { id:'type',    label:'Type',           req:false, placeholder:'Sea / Air / ICD' },
    ],
    display: r => r.name,
    sub:     r => [r.code, r.country].filter(Boolean).join(' · '),
    tags:    r => [r.type].filter(Boolean),
    fill:    (r, targetId) => setFieldVal(targetId, r.name)
  },
  exporter: {
    label: 'Exporter', icon: '🏭', key: 'master_exporter',
    fields: [
      { id:'name',    label:'Exporter Name',  req:true,  placeholder:'e.g. Impexio Trade Solutions' },
      { id:'addr1',   label:'Address Line 1', req:false, placeholder:'Building, Street' },
      { id:'addr2',   label:'Address Line 2', req:false, placeholder:'City, State' },
      { id:'gst',     label:'GST Number',     req:false, placeholder:'24AABCI1234A1Z5' },
      { id:'iec',     label:'IEC Code',       req:false, placeholder:'IEC Number' },
      { id:'contact', label:'Contact',        req:false, placeholder:'+91 98765 43210' },
      { id:'email',   label:'Email',          req:false, placeholder:'exports@company.com' },
    ],
    display: r => r.name,
    sub:     r => [r.addr1, r.addr2].filter(Boolean).join(', '),
    tags:    r => [r.gst, r.iec].filter(Boolean),
    fill:    (r, targetId) => setFieldVal(targetId, r.name)
  },
  importer: {
    label: 'Importer', icon: '🌍', key: 'master_importer',
    fields: [
      { id:'name',    label:'Importer / Buyer Name', req:true,  placeholder:'e.g. Global Traders LLC' },
      { id:'addr1',   label:'Address Line 1',        req:false, placeholder:'Building, Street' },
      { id:'addr2',   label:'City, Country',         req:false, placeholder:'Dubai, UAE' },
      { id:'country', label:'Country',               req:false, placeholder:'e.g. UAE' },
      { id:'contact', label:'Contact',               req:false, placeholder:'+971 50 123 4567' },
      { id:'email',   label:'Email',                 req:false, placeholder:'buyer@company.ae' },
    ],
    display: r => r.name,
    sub:     r => [r.addr2, r.country].filter(Boolean).join(', '),
    tags:    r => [r.contact].filter(Boolean),
    fill:    (r, targetId) => setFieldVal(targetId, r.name)
  },
  expense: {
    label: 'Expense', icon: '💸', key: 'master_expense',
    fields: [
      { id:'name',    label:'Expense Name',   req:true,  placeholder:'e.g. THC Charges' },
      { id:'category',label:'Category',       req:false, placeholder:'Local / Customs / Port' },
      { id:'amount',  label:'Default Amount', req:false, placeholder:'e.g. 5000' },
      { id:'notes',   label:'Notes',          req:false, placeholder:'Any notes...' },
    ],
    display: r => r.name,
    sub:     r => r.category || '',
    tags:    r => [r.amount ? '₹'+r.amount : null].filter(Boolean),
    fill:    (r, targetId) => setFieldVal(targetId, r.name)
  },
  bank: {
    label: 'Bank', icon: '🏦', key: 'master_bank',
    fields: [
      { id:'name',    label:'Bank Name',      req:true,  placeholder:'e.g. HDFC Bank' },
      { id:'branch',  label:'Branch',         req:false, placeholder:'e.g. Navrangpura Branch' },
      { id:'account', label:'Account No.',    req:false, placeholder:'Account number' },
      { id:'ifsc',    label:'IFSC Code',      req:false, placeholder:'e.g. HDFC0001234' },
      { id:'swift',   label:'SWIFT Code',     req:false, placeholder:'e.g. HDFCINBB' },
      { id:'currency',label:'Currency',       req:false, placeholder:'e.g. INR / USD' },
    ],
    display: r => r.name,
    sub:     r => r.branch || '',
    tags:    r => [r.ifsc, r.swift].filter(Boolean),
    fill:    (r, targetId) => setFieldVal(targetId, r.name)
  },
  product: {
    label: 'Product', icon: '📦', key: 'master_product',
    fields: [
      { id:'name',    label:'Product Name',   req:true,  placeholder:'e.g. Ceramic Floor Tiles' },
      { id:'hscode',  label:'HS Code',        req:false, placeholder:'e.g. 6907.21' },
      { id:'unit',    label:'Unit',           req:false, placeholder:'e.g. PCS / KGS / MT' },
      { id:'rate',    label:'Default Rate',   req:false, placeholder:'e.g. 12.50' },
      { id:'desc',    label:'Description',    req:false, placeholder:'Detailed product description' },
    ],
    display: r => r.name,
    sub:     r => r.desc || '',
    tags:    r => [r.hscode, r.unit].filter(Boolean),
    fill:    (r, targetId) => setFieldVal(targetId, r.name)
  },
  hscode: {
    label: 'HS Code', icon: '🔖', key: 'master_hscode',
    fields: [
      { id:'code',    label:'HS Code',        req:true,  placeholder:'e.g. 6907.21' },
      { id:'desc',    label:'Description',    req:true,  placeholder:'Product description for this HS code' },
      { id:'duty',    label:'Basic Duty %',   req:false, placeholder:'e.g. 10' },
      { id:'notes',   label:'Notes',          req:false, placeholder:'Any notes...' },
    ],
    display: r => r.code,
    sub:     r => r.desc || '',
    tags:    r => [r.duty ? 'Duty: '+r.duty+'%' : null].filter(Boolean),
    fill:    (r, targetId) => setFieldVal(targetId, r.code)
  },
  currency: {
    label: 'Currency', icon: '💱', key: 'master_currency',
    fields: [
      { id:'name',    label:'Currency Name',  req:true,  placeholder:'e.g. US Dollar' },
      { id:'code',    label:'Currency Code',  req:true,  placeholder:'e.g. USD' },
      { id:'symbol',  label:'Symbol',         req:false, placeholder:'e.g. $' },
      { id:'rate',    label:'Exchange Rate',  req:false, placeholder:'e.g. 85.40 (1 USD = INR)' },
    ],
    display: r => r.name + ' (' + (r.code||'') + ')',
    sub:     r => r.rate ? '1 ' + (r.code||'') + ' = ₹' + r.rate : '',
    tags:    r => [r.symbol].filter(Boolean),
    fill:    (r, targetId) => setFieldVal(targetId, r.code || r.name)
  }
};

// ── State ──────────────────────────────────
let currentMasterTab = 'company';
let currentPickTarget = null;   // field id to fill on pick
let currentEditMasterKey = null;
let currentEditMasterIdx = null;
let currentEditMasterType = null;

// ── Helper ─────────────────────────────────
function getMasterData(type) {
  const cfg = MASTER_CONFIG[type];
  try { return JSON.parse(localStorage.getItem(cfg.key) || '[]'); } catch { return []; }
}
function saveMasterData(type, data) {
  localStorage.setItem(MASTER_CONFIG[type].key, JSON.stringify(data));
}
function setFieldVal(id, val) {
  const el = document.getElementById(id);
  if (el) { el.value = val; el.dispatchEvent(new Event('input')); }
}

// ── Open / Close panel ─────────────────────
function openMaster(tab) {
  currentPickTarget = null;
  const panel = document.getElementById('masterPanel');
  const overlay = document.getElementById('masterOverlay');
  panel.classList.remove('pick-mode');
  panel.classList.add('open');
  overlay.classList.add('open');
  switchMasterTab(tab || 'company');
}

function openMasterPanel(tab) { openMaster(tab); }   // alias used by trigger buttons

function openMasterPick(type, targetFieldId) {
  currentPickTarget = targetFieldId;
  const panel = document.getElementById('masterPanel');
  const overlay = document.getElementById('masterOverlay');
  panel.classList.add('pick-mode');
  panel.classList.add('open');
  overlay.classList.add('open');
  // Update header to show pick mode
  const sub = panel.querySelector('.master-head-sub');
  if (sub) sub.textContent = 'Click a record to auto-fill the field';
  switchMasterTab(type);
}

function closeMaster() {
  document.getElementById('masterPanel').classList.remove('open');
  document.getElementById('masterOverlay').classList.remove('open');
  currentPickTarget = null;
}

// ── Tab switching ──────────────────────────
function switchMasterTab(type) {
  currentMasterTab = type;
  document.querySelectorAll('.master-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.master-section').forEach(s => s.classList.remove('active'));
  const tab = document.getElementById('mt-' + type);
  const sec = document.getElementById('ms-' + type);
  if (tab) tab.classList.add('active');
  if (sec) sec.classList.add('active');
  renderMasterList(type);
  // Scroll tab into view
  if (tab) tab.scrollIntoView({ behavior:'smooth', block:'nearest', inline:'center' });
}

// ── Render list ────────────────────────────
function renderMasterList(type) {
  const cfg = MASTER_CONFIG[type];
  const data = getMasterData(type);
  const listEl = document.getElementById('ml-' + type);
  if (!listEl) return;

  if (!data.length) {
    listEl.innerHTML = `<div class="master-empty">
      <div class="master-empty-icon">${cfg.icon}</div>
      <div class="master-empty-text">No ${cfg.label} records yet</div>
      <div class="master-empty-sub">Click "+ Add ${cfg.label}" to create your first record</div>
    </div>`;
    return;
  }

  listEl.innerHTML = data.map((r, i) => {
    const tags = (cfg.tags(r) || []).map(t => `<span class="master-item-tag">${t}</span>`).join('');
    const fillBtn = currentPickTarget
      ? `<button class="mi-btn fill" onclick="pickMasterRecord('${type}',${i})">✓ Use</button>`
      : `<button class="mi-btn fill" onclick="pickMasterRecord('${type}',${i})">↗ Fill</button>`;
    return `<div class="master-item" onclick="pickMasterRecord('${type}',${i})">
      <div class="master-item-info">
        <div class="master-item-name">${cfg.icon} ${cfg.display(r)}</div>
        <div class="master-item-sub">${cfg.sub(r)}</div>
        ${tags ? `<div class="master-item-tags">${tags}</div>` : ''}
      </div>
      <div class="master-item-actions" onclick="event.stopPropagation()">
        ${fillBtn}
        <button class="mi-btn edit" onclick="openMasterForm('${type}',${i})">✏️</button>
        <button class="mi-btn del"  onclick="deleteMasterRecord('${type}',${i})">🗑</button>
      </div>
    </div>`;
  }).join('');
}

// ── Pick / Fill ────────────────────────────
function pickMasterRecord(type, idx) {
  const cfg = MASTER_CONFIG[type];
  const data = getMasterData(type);
  const r = data[idx];
  if (!r) return;

  if (currentPickTarget) {
    cfg.fill(r, currentPickTarget);
    closeMaster();
    showToastCbm(cfg.icon, cfg.label + ' selected: ' + cfg.display(r));
  } else {
    // No specific target — show toast with info
    showToastCbm(cfg.icon, 'Select a field first, then click Fill');
  }
}

// ── Add / Edit form ────────────────────────
function openMasterForm(type, idx) {
  currentEditMasterType = type;
  currentEditMasterIdx  = (idx !== undefined) ? idx : null;
  const cfg  = MASTER_CONFIG[type];
  const data = getMasterData(type);
  const rec  = (idx !== undefined) ? data[idx] : null;

  document.getElementById('mfTitle').textContent = rec
    ? `✏️ Edit ${cfg.label}`
    : `+ Add ${cfg.label}`;

  // Build form fields
  const body = document.getElementById('mfBody');
  body.innerHTML = cfg.fields.map(f => `
    <div class="mf-fgroup">
      <label class="mf-lbl">${f.label}${f.req ? ' *' : ''}</label>
      <input class="mf-inp" id="mff_${f.id}" type="text"
        placeholder="${f.placeholder}"
        value="${rec ? (rec[f.id] || '') : ''}"/>
    </div>`).join('');

  document.getElementById('mfOverlay').classList.add('open');
  // Focus first field
  setTimeout(() => { const first = body.querySelector('.mf-inp'); if (first) first.focus(); }, 100);
}

function closeMasterForm() {
  document.getElementById('mfOverlay').classList.remove('open');
  currentEditMasterType = null;
  currentEditMasterIdx  = null;
}

function saveMasterRecord() {
  const type = currentEditMasterType;
  if (!type) return;
  const cfg  = MASTER_CONFIG[type];
  const data = getMasterData(type);

  // Build record from fields
  const rec = {};
  let valid = true;
  cfg.fields.forEach(f => {
    const el = document.getElementById('mff_' + f.id);
    if (el) rec[f.id] = el.value.trim();
    if (f.req && !rec[f.id]) { valid = false; el?.classList.add('mf-inp-err'); }
    else el?.classList.remove('mf-inp-err');
  });

  if (!valid) { showToastCbm('⚠️', 'Please fill all required fields!'); return; }

  if (currentEditMasterIdx !== null) {
    data[currentEditMasterIdx] = rec;
  } else {
    data.push(rec);
  }

  saveMasterData(type, data);
  closeMasterForm();
  renderMasterList(type);
  showToastCbm(cfg.icon, cfg.label + ' saved successfully!');
}

function deleteMasterRecord(type, idx) {
  const cfg = MASTER_CONFIG[type];
  if (!confirm('Delete this ' + cfg.label + ' record?')) return;
  const data = getMasterData(type);
  data.splice(idx, 1);
  saveMasterData(type, data);
  renderMasterList(type);
  showToastCbm('🗑️', cfg.label + ' deleted.');
}

// ── Default seed data ──────────────────────
function seedMasterDefaults() {
  // Company
  if (!getMasterData('company').length) {
    saveMasterData('company', [
      { name:'Impexio Trade Solutions Pvt. Ltd.', addr1:'401, Trade Tower', addr2:'GIFT City, Gandhinagar', gst:'24AABCI1234A1Z5', contact:'+91 79 1234 5678', email:'info@impexio.in' },
      { name:'Global Exim Enterprises', addr1:'12, Export House', addr2:'Ashram Road, Ahmedabad', gst:'24BBCGE5678B2Y6', contact:'+91 79 8765 4321', email:'contact@globalexim.in' }
    ]);
  }
  // Port
  if (!getMasterData('port').length) {
    saveMasterData('port', [
      { name:'Mundra Port', code:'INMUN', country:'India', type:'Sea' },
      { name:'JNPT Mumbai', code:'INJNP', country:'India', type:'Sea' },
      { name:'Pipavav Port', code:'INPAV', country:'India', type:'Sea' },
      { name:'Ahmedabad Airport', code:'AMD', country:'India', type:'Air' }
    ]);
  }
  // Currency
  if (!getMasterData('currency').length) {
    saveMasterData('currency', [
      { name:'US Dollar', code:'USD', symbol:'$', rate:'85.40' },
      { name:'Euro', code:'EUR', symbol:'€', rate:'92.50' },
      { name:'UAE Dirham', code:'AED', symbol:'AED', rate:'23.25' },
      { name:'British Pound', code:'GBP', symbol:'£', rate:'108.60' }
    ]);
  }
  // Location
  if (!getMasterData('location').length) {
    saveMasterData('location', [
      { name:'Ahmedabad', state:'Gujarat', country:'India', pincode:'380001' },
      { name:'Mundra', state:'Gujarat', country:'India', pincode:'370435' },
      { name:'GIFT City, Gandhinagar', state:'Gujarat', country:'India', pincode:'382355' }
    ]);
  }
}

// ── Init on DOMContentLoaded ───────────────
document.addEventListener('DOMContentLoaded', function() {
  seedMasterDefaults();
}, { once: false });

// Also add CSS for error state
(function(){
  const s = document.createElement('style');
  s.textContent = '.mf-inp-err{border-color:#ef4444!important;box-shadow:0 0 0 3px rgba(239,68,68,0.12)!important;}';
  document.head.appendChild(s);
})();

// ══════════════════════════════════════════════════════════════
//  AUTOCOMPLETE DROPDOWN — Click field → show saved options
//  Maps each input field ID → master type
// ══════════════════════════════════════════════════════════════

const FIELD_MASTER_MAP = {
  'f_company':    { type: 'company',    display: r => r.name,        sub: r => [r.branch, r.addr1].filter(Boolean).join(' · ') },
  'f_branch':     { type: 'branch',     display: r => r.name,        sub: r => r.office || '' },
  'f_location':   { type: 'location',   display: r => r.name,        sub: r => r.state  || '' },
  'f_exporter':   { type: 'exporter',   display: r => r.name,        sub: r => r.city   || '' },
  'f_preparedby': { type: 'exporter',   display: r => r.name,        sub: r => r.designation || '' },
  'f_signatory':  { type: 'exporter',   display: r => r.name,        sub: r => r.designation || '' },
};

// ── Create dropdown element ───────────────────────────────────
function createACDropdown() {
  const el = document.createElement('div');
  el.id = 'acDropdown';
  el.style.cssText = `
    position: fixed; z-index: 99999;
    background: #fff;
    border: 1.5px solid #dde3f0;
    border-radius: 12px;
    box-shadow: 0 16px 48px rgba(15,37,64,0.16);
    min-width: 260px; max-width: 380px;
    max-height: 280px; overflow-y: auto;
    display: none;
    font-family: 'Outfit', sans-serif;
  `;
  document.body.appendChild(el);
  return el;
}

const acDropdown = createACDropdown();
let acCurrentField = null;
let acCurrentType  = null;

// ── Position dropdown below input ────────────────────────────
function positionDropdown(inputEl) {
  const rect = inputEl.getBoundingClientRect();
  acDropdown.style.left  = rect.left + 'px';
  acDropdown.style.top   = (rect.bottom + 4) + 'px';
  acDropdown.style.width = Math.max(rect.width, 260) + 'px';
}

// ── Render dropdown items ─────────────────────────────────────
function renderACDropdown(fieldId, query) {
  const map = FIELD_MASTER_MAP[fieldId];
  if (!map) return closeACDropdown();

  const data = getMasterData(map.type);
  if (!data.length) return closeACDropdown();

  // Filter by query
  const q = (query || '').toLowerCase().trim();
  const filtered = q
    ? data.filter(r => map.display(r).toLowerCase().includes(q))
    : data;

  if (!filtered.length) return closeACDropdown();

  acDropdown.innerHTML = `
    <div style="padding:0.45rem 0.75rem;font-size:0.62rem;font-weight:700;text-transform:uppercase;
      letter-spacing:0.1em;color:#6b7fa3;border-bottom:1px solid #eef1f8;
      display:flex;align-items:center;justify-content:space-between;">
      <span>📋 Saved ${map.type.charAt(0).toUpperCase()+map.type.slice(1)} Records</span>
      <span style="color:#9aadcc;">${filtered.length} found</span>
    </div>
    ${filtered.map((r, i) => {
      const sub = map.sub(r);
      return `<div class="ac-item" data-idx="${data.indexOf(r)}"
        onmousedown="event.preventDefault();pickACItem('${fieldId}',${data.indexOf(r)})"
        style="padding:0.6rem 0.85rem;cursor:pointer;transition:background 0.15s;
          border-bottom:1px solid #f4f3ee;display:flex;align-items:center;gap:0.65rem;">
        <div style="width:28px;height:28px;border-radius:7px;background:#f0f2f8;
          display:flex;align-items:center;justify-content:center;font-size:0.85rem;flex-shrink:0;">
          ${MASTER_CONFIG[map.type]?.icon || '📋'}
        </div>
        <div style="flex:1;min-width:0;">
          <div style="font-size:0.82rem;font-weight:600;color:#0f2540;
            white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${map.display(r)}</div>
          ${sub ? `<div style="font-size:0.68rem;color:#6b7fa3;margin-top:0.1rem;
            white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${sub}</div>` : ''}
        </div>
        <div style="font-size:0.65rem;color:#c9a84c;font-weight:700;flex-shrink:0;">↗ Use</div>
      </div>`;
    }).join('')}
  `;

  // Hover effect
  acDropdown.querySelectorAll('.ac-item').forEach(el => {
    el.addEventListener('mouseover', () => el.style.background = '#f4f3ee');
    el.addEventListener('mouseout',  () => el.style.background = '');
  });

  acDropdown.style.display = 'block';
  positionDropdown(document.getElementById(fieldId));
}

// ── Pick item from dropdown ───────────────────────────────────
function pickACItem(fieldId, dataIdx) {
  const map = FIELD_MASTER_MAP[fieldId];
  if (!map) return;
  const data = getMasterData(map.type);
  const r = data[dataIdx];
  if (!r) return;

  // For company field — fill multiple fields
  if (fieldId === 'f_company' && MASTER_CONFIG['company']) {
    MASTER_CONFIG['company'].fill(r, fieldId);
  } else {
    setFieldVal(fieldId, map.display(r));
  }

  closeACDropdown();
  showToastCbm(MASTER_CONFIG[map.type]?.icon || '✅', map.display(r) + ' selected');
}

// ── Close dropdown ────────────────────────────────────────────
function closeACDropdown() {
  acDropdown.style.display = 'none';
  acCurrentField = null;
}

// ── Attach events to all mapped fields ───────────────────────
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    Object.keys(FIELD_MASTER_MAP).forEach(fieldId => {
      const el = document.getElementById(fieldId);
      if (!el) return;

      // Click → show all saved options
      el.addEventListener('focus', () => {
        acCurrentField = fieldId;
        renderACDropdown(fieldId, el.value);
      });

      // Type → filter options
      el.addEventListener('input', () => {
        if (acCurrentField === fieldId) {
          renderACDropdown(fieldId, el.value);
        }
      });

      // Click on already focused field → reopen
      el.addEventListener('click', () => {
        acCurrentField = fieldId;
        renderACDropdown(fieldId, el.value);
      });
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!acDropdown.contains(e.target) &&
          !Object.keys(FIELD_MASTER_MAP).some(id => document.getElementById(id) === e.target)) {
        closeACDropdown();
      }
    });

    // Reposition on scroll/resize
    window.addEventListener('scroll', () => {
      if (acCurrentField && acDropdown.style.display !== 'none') {
        positionDropdown(document.getElementById(acCurrentField));
      }
    }, true);

    window.addEventListener('resize', () => {
      if (acCurrentField && acDropdown.style.display !== 'none') {
        positionDropdown(document.getElementById(acCurrentField));
      }
    });

    // Keyboard navigation
    Object.keys(FIELD_MASTER_MAP).forEach(fieldId => {
      const el = document.getElementById(fieldId);
      if (!el) return;
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') { closeACDropdown(); return; }
        if (acDropdown.style.display === 'none') return;

        const items = acDropdown.querySelectorAll('.ac-item');
        const active = acDropdown.querySelector('.ac-item.ac-active');
        let idx = -1;
        items.forEach((item, i) => { if (item === active) idx = i; });

        if (e.key === 'ArrowDown') {
          e.preventDefault();
          const next = idx < items.length - 1 ? idx + 1 : 0;
          items.forEach(i => i.classList.remove('ac-active'));
          items[next].classList.add('ac-active');
          items[next].style.background = '#f4f3ee';
          items[next].scrollIntoView({ block: 'nearest' });
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          const prev = idx > 0 ? idx - 1 : items.length - 1;
          items.forEach(i => i.classList.remove('ac-active'));
          items[prev].classList.add('ac-active');
          items[prev].style.background = '#f4f3ee';
          items[prev].scrollIntoView({ block: 'nearest' });
        }
        if (e.key === 'Enter' && active) {
          e.preventDefault();
          active.dispatchEvent(new MouseEvent('mousedown'));
        }
      });
    });

  }, 300); // small delay to ensure DOM is ready
});

// ── Inject AC styles ─────────────────────────────────────────
(function(){
  const s = document.createElement('style');
  s.textContent = `
    #acDropdown { scrollbar-width: thin; scrollbar-color: #dde3f0 transparent; }
    #acDropdown::-webkit-scrollbar { width: 4px; }
    #acDropdown::-webkit-scrollbar-thumb { background: #dde3f0; border-radius: 4px; }
    .ac-item.ac-active { background: #f4f3ee !important; }
  `;
  document.head.appendChild(s);
})();

