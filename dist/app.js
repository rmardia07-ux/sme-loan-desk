import {providers,sampleApplications,money,checkStatus,runChecks,buildReport,chatPrompt} from "./workflow.js";

const paths = {
  brand:'<path d="M3 18h18M5 15V9m5 6V5m5 10v-4m4 4V7" />',
  inbox:'<path d="M4 4h16l2 10v5H2v-5L4 4Z"/><path d="M2 14h6l2 2h4l2-2h6"/>',
  file:'<path d="M6 3h8l4 4v14H6zM13 3v5h5M9 12h6m-6 4h6"/>',
  link:'<path d="m10 13 4-4m-6 6-2 2a3 3 0 0 1-4-4l4-4a3 3 0 0 1 4 0m4 0 2-2a3 3 0 0 1 4 4l-4 4a3 3 0 0 1-4 0"/>',
  grid:'<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/>',
  info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v5m0-8h.01"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  check:'<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
  next:'<path d="m9 6 6 6-6 6"/>',
  pin:'<path d="M18 10c0 4-6 9-6 9s-6-5-6-9a6 6 0 1 1 12 0Z"/><circle cx="12" cy="10" r="2"/>',
  shield:'<path d="m12 3 7 3v5c0 5-7 9-7 9s-7-4-7-9V6l7-3Z"/><path d="m9 11 2 2 4-4"/>',
  bank:'<path d="m3 8 9-5 9 5H3Zm2 4v5m5-5v5m4-5v5m5-5v5M3 21h18"/>',
  play:'<path d="m9 5 10 7-10 7z"/>',
  spark:'<path d="m12 3 2.7 6.3L21 12l-6.3 2.7L12 21l-2.7-6.3L3 12l6.3-2.7L12 3Z"/>'
};
const icon = name => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+paths[name]+'</svg>';
const escape = value => String(value).replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);
const tile = (name,theme="")=>'<span class="tile '+theme+'">'+icon(name)+'</span>';
const pill = (text,tone="wait")=>'<span class="pill '+tone+'">'+text+'</span>';
const button = (label,action,glyph,primary=false,disabled=false)=>'<button type="button" class="button'+(primary?' primary':'')+'" data-action="'+action+'" '+(disabled?'disabled':'')+'>'+icon(glyph)+label+'</button>';
const heading = (title,sub,end="")=>'<div class="title-row"><div><h1>'+title+'</h1><p>'+sub+'</p></div>'+end+'</div>';
const notice = text=>'<div class="notice">'+icon("info")+'<p>'+text+'</p></div>';
const view = document.querySelector("#view");
const records = structuredClone(sampleApplications);
const reports = new Map();
let activeId = records[0].id;
let toastId;

for(const el of document.querySelectorAll("[data-icon]")) el.innerHTML=icon(el.dataset.icon);

function toast(message) {
  const el=document.querySelector("#toast");
  el.textContent=message;
  clearTimeout(toastId);
  toastId=setTimeout(()=>{el.textContent="";},3500);
}

function queue() {
  return '<section class="card queue"><div class="section-head"><h2>Application queue</h2><p>Select a case to review</p></div><div class="queue-list">'+records.map(app=>{
    const initials=app.business.split(/\s+/).slice(0,2).map(word=>word[0]).join("").toUpperCase();
    return '<button type="button" class="row" data-case="'+app.id+'" aria-pressed="'+(app.id===activeId)+'"><span class="avatar">'+escape(initials)+'</span><span><strong>'+escape(app.business)+'</strong><small>'+app.id+' · '+escape(app.city)+'</small></span>'+icon("next")+'</button>';
  }).join("")+'</div></section>';
}

function reportPanel(app) {
  const report=reports.get(app.id);
  const body=report ? '<div class="report-body"><p><strong>Request</strong> · '+escape(report.overview)+'</p>'+report.checks.map(check=>'<p><strong>'+check.source+'</strong> · '+check.label+' · '+escape(check.detail)+'</p>').join("")+'<p><strong>Follow-up</strong> · '+escape(report.followUp.join(" "))+'</p></div><div class="report-actions">'+button("Copy ChatGPT prompt","copy","file")+'<a class="button" href="https://chatgpt.com/" target="_blank" rel="noopener noreferrer">Open ChatGPT</a>'+button("Download summary","download","inbox")+'</div>'
    : '<p class="empty">Create a summary of the application, sample findings, and open items for your reviewer.</p>';
  return '<section class="card panel report"><div class="panel-top"><div><h2>Review report</h2><p class="panel-sub">Case summary and ChatGPT handoff</p></div>'+button(report?"Refresh summary":"Create summary","report","spark")+'</div>'+body+'</section>';
}

function applications() {
  const app=records.find(record=>record.id===activeId);
  const completed=records.filter(record=>providers.every(provider=>checkStatus(record,provider).tone!=="wait")).length;
  const pending=providers.some(provider=>checkStatus(app,provider).tone==="wait");
  const metrics=[[records.length,"Applications","inbox",""],[records.length-completed,"Awaiting checks","clock","blue"],[reports.size,"Reports drafted","file","green"]];
  return heading("Loan applications","Review SME loan requests and track verification in one place.",'<a class="button primary" href="#apply">'+icon("plus")+'New application</a>')+
    notice("Use fictional information to try the workflow. Demo checks make no provider requests.")+
    '<section class="metrics" aria-label="Workspace totals">'+metrics.map(([count,label,glyph,theme])=>'<div class="metric">'+tile(glyph,theme)+'<div><strong>'+count+'</strong><small>'+label+'</small></div></div>').join("")+'</section>'+
    '<div class="workbench">'+queue()+'<div class="details"><section class="case-head"><div class="case-top"><div><small class="case-ref">'+app.id+'</small><h2>'+escape(app.business)+'</h2></div>'+pill(app.secured?"Property-backed":"Unsecured")+'</div><div class="facts"><div><span>Loan amount</span><strong>'+money(app.amount)+'</strong></div><div><span>Product</span><strong>'+escape(app.type)+'</strong></div><div><span>City</span><strong>'+escape(app.city)+'</strong></div></div></section>'+
    '<section class="card panel"><div class="panel-top"><div><h2>Verification checks</h2><p class="panel-sub">Consent, status and findings by source</p></div>'+button("Run demo checks","run","play",true,!pending)+'</div>'+
    providers.map(provider=>{const status=checkStatus(app,provider);return '<div class="provider"><div class="provider-name">'+tile(provider.icon,provider.theme)+'<div><strong>'+provider.name+'</strong><small>'+escape(status.detail)+'</small></div></div>'+pill(status.label,status.tone)+'</div>';}).join("")+'</section>'+
    reportPanel(app)+'</div></div>';
}

function applicant() {
  return heading("Apply for an SME loan","Enter a trial application to see how it appears in the review queue.")+
    notice("Demo form. Use fictional business details. The case is cleared when you reload this page.")+
    '<form class="card form-card" id="intake"><h2>Business and loan details</h2><div class="form-grid">'+
    '<label class="field">Business name<input name="business" required maxlength="80" placeholder="e.g. Riverbend Components" autocomplete="off"></label>'+
    '<label class="field">Business city<input name="city" required maxlength="60" placeholder="e.g. Chennai" autocomplete="off"></label>'+
    '<label class="field">Loan product<select name="type"><option>Working capital</option><option>Equipment finance</option><option>Loan against property</option></select></label>'+
    '<label class="field">Requested amount (₹)<input name="amount" type="number" required min="1" max="1000000000" step="1" placeholder="e.g. 2500000"></label>'+
    '<label class="field">Property collateral<select name="security"><option value="no">No property collateral</option><option value="yes">Yes, property collateral</option></select></label>'+
    '<label class="field" id="property-field" hidden>Fictional property reference<input name="property" maxlength="50" placeholder="e.g. TN-DEMO-001" autocomplete="off"></label></div>'+
    '<fieldset><legend>Demo verification consent</legend><label class="check"><input type="checkbox" name="cibil"> <span>Allow the demo CIBIL credit check.</span></label><label class="check"><input type="checkbox" name="precisa"> <span>Allow the demo Precisa bank statement check.</span></label><label class="check" id="property-consent" hidden><input type="checkbox" name="landeed"> <span>Allow the demo Landeed property record check.</span></label></fieldset>'+
    '<div class="form-actions"><button class="button primary" type="submit">'+icon("plus")+'Submit demo application</button>'+button("Fill example","example","file")+'</div></form>';
}

function integrations() {
  const cards=providers.map(p=>'<article class="card integration"><div class="provider-name">'+tile(p.icon,p.theme)+'<div><strong>'+p.name+'</strong><small>'+p.label+'</small></div></div><p>'+p.access+'</p><a href="'+p.url+'" target="_blank" rel="noopener noreferrer">Provider information</a></article>');
  cards.push('<article class="card integration"><div class="provider-name">'+tile("spark","orange")+'<div><strong>ChatGPT</strong><small>Manual handoff</small></div></div><p>Create a review summary, copy the synthetic-data prompt and paste it into ChatGPT for a narrative memo. Automated drafting requires an OpenAI API connection.</p><a href="https://chatgpt.com/" target="_blank" rel="noopener noreferrer">Open ChatGPT</a></article>');
  return heading("Integrations","Review what each service contributes to the loan file.")+
    notice("Provider connections are pending. This workspace uses sample responses.")+'<div class="integration-grid">'+cards.join("")+'</div>';
}

const pages={applications:["Applications",applications],apply:["Applicant form",applicant],connections:["Integrations",integrations]};

function render() {
  const hash=location.hash.slice(1);
  const page=Object.hasOwn(pages,hash)?hash:"applications";
  document.querySelector("#breadcrumb").textContent=pages[page][0];
  for(const link of document.querySelectorAll("[data-nav]")) {
    if(link.dataset.nav===page) link.setAttribute("aria-current","page");
    else link.removeAttribute("aria-current");
  }
  view.innerHTML=pages[page][1]();
}

function syncProperty(form) {
  const isPropertyLoan=form.elements.type.value==="Loan against property";
  const field=form.elements.security;
  if(isPropertyLoan) field.value="yes";
  field.disabled=isPropertyLoan;
  const secured=field.value==="yes";
  form.querySelector("#property-field").hidden=!secured;
  form.querySelector("#property-consent").hidden=!secured;
  form.elements.property.required=secured;
}

view.addEventListener("change",event=>{
  const form=event.target.closest("#intake");
  if(form) syncProperty(form);
});

view.addEventListener("input",event=>{
  if(event.target.matches("#intake input[type=text], #intake input:not([type])")) event.target.setCustomValidity("");
});

view.addEventListener("submit",event=>{
  if(event.target.id!=="intake") return;
  event.preventDefault();
  const fields=event.target.elements;
  const secured=fields.security.value==="yes";
  const requiredText=[fields.business,fields.city,...(secured?[fields.property]:[])];
  for(const field of requiredText) {
    if(!field.value.trim()) {
      field.setCustomValidity("Enter a fictional value to continue.");
      field.reportValidity();
      return;
    }
  }
  const id="SME-"+(1001+records.length);
  records.push({id,business:fields.business.value.trim(),city:fields.city.value.trim(),type:fields.type.value,amount:Number(fields.amount.value),secured,property:secured?fields.property.value.trim():"",consents:{landeed:secured&&fields.landeed.checked,cibil:fields.cibil.checked,precisa:fields.precisa.checked},results:{}});
  activeId=id;
  location.hash="applications";
  toast("Demo application "+id+" submitted.");
});

view.addEventListener("click",async event=>{
  const caseButton=event.target.closest("[data-case]");
  if(caseButton) {
    activeId=caseButton.dataset.case;
    render();
    view.querySelector('[aria-pressed="true"]').focus();
    return;
  }
  const action=event.target.closest("[data-action]")?.dataset.action;
  if(!action) return;
  if(action==="example") {
    const form=view.querySelector("#intake");
    const fields=form.elements;
    fields.business.value="Riverbend Components";
    fields.city.value="Chennai";
    fields.amount.value="2500000";
    fields.type.value="Equipment finance";
    fields.security.value="yes";
    fields.property.value="TN-DEMO-001";
    for(const field of [fields.business,fields.city,fields.property]) field.setCustomValidity("");
    syncProperty(form);
    return;
  }
  const app=records.find(record=>record.id===activeId);
  if(action==="run") {
    runChecks(app);
    reports.delete(app.id);
    render();
    view.querySelector('[data-action="report"]').focus();
    toast("Sample results added for checks with demo consent.");
  }
  if(action==="report") {
    reports.set(app.id,buildReport(app));
    render();
    view.querySelector('[data-action="copy"]').focus();
    toast("Review summary created.");
  }
  const report=reports.get(app.id);
  if(action==="copy" && report) {
    try {
      await navigator.clipboard.writeText(chatPrompt(report));
      toast("Prompt copied. Paste it into ChatGPT.");
    } catch {
      const area=document.createElement("textarea");
      area.className="prompt-box";
      area.setAttribute("aria-label","ChatGPT prompt");
      area.readOnly=true;
      area.value=chatPrompt(report);
      view.querySelector(".prompt-box")?.remove();
      view.querySelector(".report").append(area);
      area.select();
      toast("Select and copy the prompt to ChatGPT.");
    }
  }
  if(action==="download" && report) {
    const content=["SME Loan Desk • Demo review summary",app.id,report.overview,"",...report.checks.map(check=>check.source+" — "+check.label+" — "+check.detail),"","Reviewer follow-up",...report.followUp].join("\n");
    const url=URL.createObjectURL(new Blob([content],{type:"text/plain;charset=utf-8"}));
    const link=document.createElement("a");
    link.href=url;
    link.download=app.id+"-demo-review.txt";
    link.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
});

window.addEventListener("hashchange",()=>{render();window.scrollTo(0,0);});
render();
