import fs from 'node:fs/promises';
import { Workbook } from '@oai/artifact-tool';
const wb = await Workbook.fromCSV(await fs.readFile('C:/Users/rashe/Downloads/looplily-contacts-template (6).csv','utf8'),{sheetName:'Contacts'});
const sheet = wb.worksheets.getItemAt(0);
const headers = sheet.getRange('A1:K1').values[0];
const contacts = JSON.parse(await fs.readFile('tmp/crm-export/contacts.json','utf8'));
contacts.sort((a,b)=>(a.fullName||'').localeCompare(b.fullName||''));
let unparsedBirthdays = 0;
const rows = contacts.map(c=>{
  const notes = [c.notes||''];
  if(c.city) notes.push(`City: ${c.city}`);
  const consent = c.emailConsentStatus||'unknown';
  if(consent==='unknown') notes.push('Original email consent: unknown');
  let birthday='';
  if(c.birthdayMonth && c.birthdayDay) birthday=`${String(c.birthdayMonth).padStart(2,'0')}-${String(c.birthdayDay).padStart(2,'0')}`;
  else if(c.birthdayRaw) { notes.push(`Original birthday: ${c.birthdayRaw}`); unparsedBirthdays++; }
  if(c.birthdayYear) notes.push(`Birth year: ${c.birthdayYear}`);
  return [c.firstName||'',c.lastName||'',c.email||'',c.phone||'',c.company||'',c.industry||'',birthday,(c.tags||[]).join('; '),notes.filter(Boolean).join('\n'),c.isActive===false?'inactive':'active',consent==='unsubscribed'?'unsubscribed':consent==='subscribed'?'active':'do_not_email'];
});
sheet.getRange('A2:K2').clear({applyTo:'contents'});
sheet.getRange(`A2:K${rows.length+1}`).values=rows;
wb.recalculate();
const matrix=sheet.getRange(`A1:K${rows.length+1}`).values;
if(JSON.stringify(matrix)!==JSON.stringify([headers,...rows])) throw new Error('Value verification failed');
const csv=matrix.map(r=>r.map(v=>'"'+String(v??'').replaceAll('"','""')+'"').join(',')).join('\r\n')+'\r\n';
await fs.mkdir('outputs/crm-export',{recursive:true});
await fs.writeFile('outputs/crm-export/looplily-contacts-filled.csv',csv,'utf8');
console.log(JSON.stringify({exported:rows.length,columns:headers.length,unparsedBirthdays}));
