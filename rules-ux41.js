/* PERMISOS 2D UX 4.1 — pure, deterministic, synthetic advisory engine. */
(function(root){'use strict';
const ALPHABET='ABCDEFGHIJKLMNÑOPQRSTUVWXYZ';
const FINAL=new Set(['CONCEDIDO','APROBADA','DISFRUTADA','DISFRUTADO']);
const HOLDS=new Set(['ACEPTADA','PRESENTADA_EN_SENECA']);
const PENDING=new Set(['SOLICITADO']);
const KNOWN=new Set([...FINAL,...HOLDS,...PENDING,'DENEGADO','CANCELADA','CAMBIO_SOLICITADO','CANCELACION_SOLICITADA']);
function validDate(s){if(typeof s!=='string'||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(s))return false;const d=new Date(s+'T12:00:00Z');return !Number.isNaN(d.getTime())&&d.toISOString().slice(0,10)===s;}
function norm(s){return String(s||'').trim().toLocaleUpperCase('es-ES').replace(/Ñ/g,'~').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/~/g,'Ñ').replace(/\s+/g,' ');}
function key(s,letter){const v=norm(s),pos=ALPHABET.indexOf(norm(letter));if(pos<0||!v||!/^[A-ZÑ][A-ZÑ '\-]*$/.test(v))return null;const alpha=ALPHABET.slice(pos)+ALPHABET.slice(0,pos);return Array.from(v).map(c=>c===' '||c==='-'||c==="'"?-1:alpha.indexOf(c));}
function cmp(a,b){const len=Math.min(a.length,b.length);for(let i=0;i<len;i++){if(a[i]!==b[i])return a[i]-b[i];}return a.length-b.length;}
function evaluate({date,requests,users,capacity=4,tieLetter='Ñ',historyComplete=true,identityComplete=true,calendarComplete=true}={}){
 const issues=[];const add=s=>{if(!issues.includes(s))issues.push(s)};
 if(!validDate(date))add('Fecha imposible o inválida');
 if(!Number.isInteger(capacity)||capacity<1)add('Cupo inválido');
 if(!Array.isArray(requests)||!Array.isArray(users)){add('Datos no disponibles');requests=Array.isArray(requests)?requests:[];users=Array.isArray(users)?users:[];}
 if(!historyComplete)add('Histórico de concesiones incompleto');
 if(!identityComplete)add('Identidades incompletas');
 if(!calendarComplete)add('Calendario oficial o plazos no verificados');
 if(!ALPHABET.includes(norm(tieLetter))||norm(tieLetter).length!==1)add('Letra de desempate inválida');
 const people=new Map(users.map(u=>[u.id,u]));const ids=new Set();
 for(const r of requests){if(!r||!r.id||ids.has(r.id))add('Identificador duplicado o ausente');else ids.add(r.id);if(!r||!KNOWN.has(r.status))add('Estado desconocido');if(!validDate(r?.dateRequested))add('Fecha de expediente inválida');if(!people.has(r?.userId))add('Docente sin identidad');}
 const day=requests.filter(r=>r&&r.dateRequested===date),sameUsers=new Set();
 for(const r of day){if(sameUsers.has(r.userId))add('Dos expedientes para el mismo docente y fecha');sameUsers.add(r.userId);}
 const fixed=day.filter(r=>FINAL.has(r.status));const held=day.filter(r=>HOLDS.has(r.status));const pending=day.filter(r=>PENDING.has(r.status));
 if(fixed.length+held.length>capacity)add('Cupo sobrepasado por concesiones o aceptaciones previas');
 const free=Math.max(0,capacity-fixed.length-held.length);
 const ranked=pending.map(r=>{
  const u=people.get(r.userId),surname=u?.surname1,second=u?.surname2;
  const sortKey=key([surname,second].filter(Boolean).join(' '),tieLetter);
  if(!sortKey)add('Apellidos estructurados ausentes o inválidos');
  const prev=requests.filter(x=>x&&x.userId===r.userId&&x.id!==r.id&&FINAL.has(x.status)).length;
  if(prev>=2)add('Un candidato tiene dos concesiones en el curso');
  return {id:r.id,userId:r.userId,teacherName:u?.name||'Identidad desconocida',previousGrants:prev,sortKey};
 });
 ranked.sort((a,b)=>(Number(a.previousGrants>0)-Number(b.previousGrants>0))||cmp(a.sortKey||[],b.sortKey||[])||a.id.localeCompare(b.id));
 for(let i=1;i<ranked.length;i++)if(Number(ranked[i].previousGrants>0)===Number(ranked[i-1].previousGrants>0)&&cmp(ranked[i].sortKey||[],ranked[i-1].sortKey||[])===0)add('Empate exacto de apellidos: revisión manual');
 const safe=issues.length===0;
 return {date,capacity,granted:fixed.length,acceptedHolds:held.length,free,ranked:ranked.map((r,i)=>({id:r.id,userId:r.userId,teacherName:r.teacherName,previousGrants:r.previousGrants,position:i+1,proposal:!safe?'REVISION':i<free?'PROPONER_ACEPTACION':'SIN_PLAZA',reason:!safe?'Revisión humana por incidencias':i<free?'Orden por ausencia de concesiones y apellidos':'Sin plaza disponible'})),issues,safeToPropose:safe,algorithm:'Primero sin concesiones en el curso; empate: apellidos desde '+tieLetter+'. ACEPTADA reserva provisionalmente plaza pero no es concesión oficial. Sin prioridad por orden de entrada.'};
}
root.PermisosRules={evaluate,validDate,key,compareKeys:cmp};
if(typeof module==='object'&&module.exports)module.exports=root.PermisosRules;
})(typeof globalThis==='object'?globalThis:this);
