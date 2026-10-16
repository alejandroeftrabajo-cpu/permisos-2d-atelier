/* PERMISOS 2D · motor determinista de laboratorio, sin efectos administrativos. */
(function(root){'use strict';
const finalStates=new Set(['CONCEDIDO','APROBADA','DISFRUTADA','DISFRUTADO']);
const pendingStates=new Set(['SOLICITADO','ACEPTADA']);
function surname(name){const a=String(name||'').trim().split(/\s+/);return a.length>=2?a.slice(1).join(' '):'';}
function rankKey(name,letter){const alphabet='ABCDEFGHIJKLMNÑOPQRSTUVWXYZ';const start=alphabet.indexOf(String(letter).toUpperCase());if(start<0)return null;const rotated=alphabet.slice(start)+alphabet.slice(0,start);const s=surname(name).toUpperCase().replace(/Ñ/g,'~').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/~/g,'Ñ');return [...s].map(c=>String(rotated.indexOf(c)<0?99:rotated.indexOf(c)).padStart(2,'0')).join('-');}
function evaluate({date,requests,users,capacity=4,tieLetter='Ñ',historyComplete=true,identityComplete=true,calendarComplete=true}){
 const issues=[];if(!/^\d{4}-\d{2}-\d{2}$/.test(date))issues.push('Fecha inválida');if(!Number.isInteger(capacity)||capacity<1)issues.push('Cupo inválido');
 if(!historyComplete)issues.push('Histórico de concesiones incompleto');if(!identityComplete)issues.push('Identidades incompletas');if(!calendarComplete)issues.push('Calendario lectivo incompleto');
 const lookup=new Map(users.map(u=>[u.id,u]));const daily=requests.filter(r=>r.dateRequested===date);
 const fixed=daily.filter(r=>finalStates.has(r.status)||r.status==='ACEPTADA');const candidates=daily.filter(r=>r.status==='SOLICITADO');
 const free=Math.max(0,capacity-fixed.length);
 const enriched=candidates.map(r=>{const u=lookup.get(r.userId);const grants=requests.filter(x=>x.userId===r.userId&&(finalStates.has(x.status)||x.status==='ACEPTADA')).length;const key=u&&rankKey(u.name,tieLetter);if(!u||!key)issues.push('Identidad o apellidos ausentes en '+r.id);return {...r,teacherName:u?.name||'Identidad desconocida',previousGrants:grants,key};});
 enriched.sort((a,b)=>a.previousGrants-b.previousGrants||(a.key||'').localeCompare(b.key||'','en')||a.id.localeCompare(b.id));
 for(let i=1;i<enriched.length;i++){if(enriched[i].previousGrants===enriched[i-1].previousGrants&&enriched[i].key===enriched[i-1].key)issues.push('Empate alfabético exacto: revisión manual');}const eligible=issues.length===0;
 const ranked=enriched.map((r,i)=>({id:r.id,userId:r.userId,teacherName:r.teacherName,previousGrants:r.previousGrants,position:i+1,proposal:eligible?(i<free?'PROPONER_ACEPTACION':'SIN_PLAZA'):'REVISION',reason:eligible?(i<free?'Prioridad según concesiones previas y desempate alfabético':'Sin plaza disponible tras aplicar prioridades'):'Datos insuficientes para adjudicar con garantías'}));
 const duplicates=new Set();for(const r of daily){if(duplicates.has(r.userId))issues.push('Solicitudes duplicadas del mismo docente');duplicates.add(r.userId)}
 if(fixed.length>capacity)issues.push('Concesiones existentes superan el cupo');
 if(issues.length)ranked.forEach(r=>{r.proposal='REVISION';r.reason='Revisión obligatoria: '+[...new Set(issues)].join('; ')});
 return {date,capacity,granted:fixed.length,free,ranked,issues:[...new Set(issues)],safeToPropose:issues.length===0,algorithm:'Prioridad 0 concesiones; menor número de concesiones; desempate alfabético circular desde '+tieLetter+'. Sin prioridad por orden de llegada.'};
}
root.PermisosRules={evaluate,rankKey,surname};
})(typeof globalThis==='object'?globalThis:this);
