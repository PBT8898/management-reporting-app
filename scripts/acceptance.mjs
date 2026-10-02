import { strict as assert } from 'node:assert';
const base = process.env.ACCEPTANCE_URL || 'http://127.0.0.1:3000';
const requireAI=process.argv.includes('--require-ai');
let propertyId;
async function snapshot(){const r=await fetch(base+'/api/workspace');const body=await r.json();assert.equal(r.status,200,body.error);return body;}
async function act(operation,values){const r=await fetch(base+'/api/workspace',{method:'POST',headers:{'Content-Type':'application/json',Origin:base},body:JSON.stringify({operation,values})});const body=await r.json();assert.equal(r.status,200,`${operation}: ${body.error}`);return body.result;}
try {
 const initial=await snapshot(),period=initial.periods.find(p=>p.period_year===2025 && p.period_month===3);
 assert.ok(period,'PRD March 2025 period exists');assert.equal(period.status,'open','PRD period is open');
 const property=await act('property.save',{name:`Acceptance Riverside ${Date.now()}`,property_type:'office',location:'Sydney',acquisition_date:'2021-06-01',purchase_price:15000000});propertyId=property.id;
 const scope={property_id:propertyId,period_id:period.id};
 const csv='account_name,category,actual,budget,prior_month,prior_ytd,ytd_actual\nRental Income,revenue,450000,400000,445000,1300000,1350000\nProperty Operating Expenses,opex,80000,60000,78000,230000,240000\nUtilities,opex,15000,6000,14000,40000,42000';
 const form=new FormData();form.set('property_id',propertyId);form.set('period_id',period.id);form.set('file',new Blob([csv],{type:'text/csv'}),'march-2025-acceptance.csv');
 const uploadResponse=await fetch(base+'/api/uploads',{method:'POST',headers:{Origin:base},body:form}),upload=await uploadResponse.json();assert.equal(uploadResponse.status,200,upload.error);
 const download=await fetch(base+`/api/uploads?id=${upload.result.id}`);assert.equal(download.status,200);assert.equal(await download.text(),csv);
 await act('income.paste',{...scope,rows:csv});
 await act('balance.save',{...scope,account_name:'Investment Property',account_category:'asset',actual:12000000,prior_period:11500000});
 let data=await snapshot();const lines=data.income.filter(l=>l.property_id===propertyId),movements=data.explanations.filter(e=>e.property_id===propertyId && e.is_material);
 assert.equal(lines.length,3);assert.equal(movements.length,3);assert.equal(data.balance.filter(l=>l.property_id===propertyId).length,1);
 for(let i=0;i<movements.length;i++){
  let row=movements[i];
  if(requireAI){row=await act('ai.draft',{id:row.id,context:'Known facts: a rent review increased rental charges; operating costs include approved one-off maintenance; utility usage rose during an equipment commissioning period.'});assert.equal(row.explanation_source,'ai');assert.equal(row.review_status,'draft');assert.ok(row.explanation?.trim());}
  else {
   const ai=await fetch(base+'/api/workspace',{method:'POST',headers:{'Content-Type':'application/json',Origin:base},body:JSON.stringify({operation:'ai.draft',values:{id:row.id,context:''}})});
   const aiBody=await ai.json();
   if(ai.ok) row=aiBody.result; else assert.match(aiBody.error,/AI drafting unavailable/);
  }
  const explanation=i<2 ? `Finance review: ${lines.find(l=>l.id===row.income_line_id).account_name} movement verified against the source report. Driver confirmed by the property team.` : row.explanation || 'Finance review: higher utility usage verified against the source report.';
  row=await act('explanation.save',{id:row.id,explanation,review_status:'draft',expected_amount:row.variance_amount,expected_percent:row.variance_pct,expected_text:row.explanation});
  await act('explanation.save',{id:row.id,explanation:row.explanation,review_status:'approved',expected_amount:row.variance_amount,expected_percent:row.variance_pct,expected_text:row.explanation});
 }
 data=await snapshot();assert.equal(data.explanations.filter(e=>e.property_id===propertyId && e.review_status==='approved').length,3);
 const revenue=lines.filter(l=>l.account_category==='revenue').reduce((s,l)=>s+Number(l.actual),0),opex=lines.filter(l=>l.account_category==='opex').reduce((s,l)=>s+Number(l.actual),0),yieldPct=lines.filter(l=>l.account_category==='revenue').reduce((s,l)=>s+Number(l.ytd_actual),0)/property.purchase_price*100;
 assert.equal(revenue,450000);assert.equal(opex,95000);assert.equal(yieldPct,9);
 const page=await fetch(base+`/dashboard?property=${propertyId}&period=${period.id}`);assert.equal(page.status,200);assert.match(await page.text(),/Metric/);
 console.log(JSON.stringify({result:'passed',url:base,workflow:'create property → report upload/download → paste 3 income lines → balance entry → 3 material variances → edit two → approve all → dashboard data',realAIRequired:requireAI,revenue,margin:(revenue-opex)/revenue*100,yield:yieldPct,approved:3},null,2));
} finally {
 if(propertyId){await act('property.delete',{id:propertyId,confirm:true,reason:'Remove disposable end-to-end acceptance-test data'});const final=await snapshot();assert.ok(!final.properties.some(p=>p.id===propertyId));console.log('Disposable acceptance property, lines, commentary and source file cleaned up.');}
}
