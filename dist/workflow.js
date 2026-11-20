export const providers = [
  {id:"landeed", name:"Landeed", label:"Property records", icon:"pin", theme:"blue", url:"https://www.landeed.com/contact?topic=research", access:"Request enterprise API access and confirm the property identifiers and document types supported for your lending locations."},
  {id:"cibil", name:"TransUnion CIBIL", label:"Credit report and score", icon:"shield", theme:"", url:"https://www.transunioncibil.com/solution/credit-information-reports", access:"Confirm lender access and select the appropriate consumer or commercial credit report product for your borrowers."},
  {id:"precisa", name:"Precisa", label:"Bank statement analysis", icon:"bank", theme:"green", url:"https://precisa.in/api-integration", access:"Request API credentials and confirm the supported statement submission method and result format."}
];

export const sampleApplications = [
  {id:"SME-1001", business:"Kaveri Machine Works", city:"Chennai", type:"Equipment finance", amount:2500000, secured:true, property:"TN-DEMO-019", consents:{landeed:true,cibil:true,precisa:true}, results:{}},
  {id:"SME-1002", business:"Meridian Textile Co.", city:"Coimbatore", type:"Working capital", amount:1800000, secured:false, property:"", consents:{landeed:false,cibil:true,precisa:true}, results:{cibil:"Illustrative score 736",precisa:"Illustrative average monthly credits ₹8.2 lakh"}},
  {id:"SME-1003", business:"Blue Banyan Traders", city:"Bengaluru", type:"Loan against property", amount:4200000, secured:true, property:"KA-DEMO-024", consents:{landeed:true,cibil:true,precisa:false}, results:{}}
];
const fixtures = {
  landeed:"Illustrative property record located. Title and encumbrances require review.",
  cibil:"Illustrative score 748",
  precisa:"Illustrative average monthly credits ₹12.4 lakh"
};
export const money = value => new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(value);

export function checkStatus(app, provider) {
  if (provider.id==="landeed" && !app.secured) return {label:"Not applicable",tone:"skip",detail:"No property collateral"};
  if (!app.consents[provider.id]) return {label:"Consent missing",tone:"skip",detail:"Demo consent was not recorded"};
  if (app.results[provider.id]) return {label:"Sample result",tone:"done",detail:app.results[provider.id]};
  return {label:"Pending",tone:"wait",detail:provider.label};
}

export function runChecks(app) {
  for (const provider of providers) {
    if (checkStatus(app,provider).tone==="wait") app.results[provider.id]=fixtures[provider.id];
  }
}

export function buildReport(app) {
  const checks = providers.map(provider => ({source:provider.name,...checkStatus(app,provider)}));
  return {
    overview: app.type + " • " + money(app.amount) + " • " + (app.secured ? "Property collateral" : "No property collateral"),
    checks,
    followUp: [
      ...checks.filter(check=>check.tone==="wait").map(check=>"Obtain the " + check.source + " result."),
      ...checks.filter(check=>check.label==="Consent missing").map(check=>"Confirm whether " + check.source + " consent can be obtained."),
      ...(app.secured ? ["Have the lending team review title and encumbrances."] : []),
      "Verify all figures against original sources before any lending decision."
    ]
  };
}

export function chatPrompt(report) {
  return [
    "Draft a concise internal SME loan review memo from the synthetic demo inputs below. Use sections for application, source results, missing information, and reviewer follow-up. Attribute each finding to its source. Treat sample results as illustrative and preserve missing checks. Do not invent facts, approve or reject the loan, or provide a risk rating.",
    "Application: " + report.overview,
    ...report.checks.map(check=>check.source + ": " + check.label + " — " + check.detail),
    "Reviewer follow-up: " + report.followUp.join(" ")
  ].join("\n");
}
