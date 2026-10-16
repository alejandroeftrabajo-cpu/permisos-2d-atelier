
(()=>{'use strict';
const $=id=>document.getElementById(id);
const users=structuredClone(DEMO_USERS).map(u=>({...u,...({
 'u-a':{surname1:'Arvendel'},'u-b':{surname1:'Velmir'},'u-c':{surname1:'Nereval'},
 'u-d':{surname1:'Solvende'},'u-e':{surname1:'Elevar'},'u-f':{surname1:'Cantelar'},
 'u-g':{surname1:'Montiver'}
}[u.id]||{})})),reqs=structuredClone(DEMO_REQUESTS);
const audit=[];const nowDemo='2026-10-16';

let role='teacher',tab='calendar',user='u-a',year=2026,month=9,selected='2026-10-20';
const CAP=DEMO_CAPACITY,ALLOW=DEMO_ALLOWANCE;
const who=id=>users.find(u=>u.id===id)?.name||'Ficticio';
const date=d=>prettyDate(d);
const on=d=>reqs.filter(r=>r.dateRequested===d);
const approved=r=>['CONCEDIDO','APROBADA','DISFRUTADA','DISFRUTADO'].includes(r.status);
const active=r=>['SOLICITADO','ACEPTADA','PRESENTADA_EN_SENECA','CONCEDIDO','APROBADA','DISFRUTADA','DISFRUTADO'].includes(r.status);
const badge=s=>`<span class="badge ${s}">${s}</span>`;
const own=()=>reqs.filter(r=>r.userId===user);
const granted=d=>on(d).filter(approved);
const monthLabel=()=>new Intl.DateTimeFormat('es-ES',{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(Date.UTC(year,month,1)));
const safe=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function calendar(){
 let html=`<div class="row"><strong style="text-transform:none">${monthLabel()}</strong><div class="actions"><button class="secondary" data-month="-1">‹</button><button class="secondary" data-month="1">›</button></div></div><div class="calendar">`;
 for(const w of ['L','M','X','J','V','S','D'])html+=`<span class="dow">${w}</span>`;
 const offset=(new Date(Date.UTC(year,month,1)).getUTCDay()+6)%7;
 for(let i=0;i<offset;i++)html+='<span></span>';
 const n=new Date(Date.UTC(year,month+1,0)).getUTCDate();
 for(let i=1;i<=n;i++){
  const d=`${year}-${String(month+1).padStart(2,'0')}-${String(i).padStart(2,'0')}`,count=on(d).length;
  html+=`<button class="day ${isOff(d)?'off':''} ${selected===d?'active':''}" data-date="${d}"><strong>${i}</strong>${count?`<small>${count} petición${count===1?'':'es'}</small>`:''}</button>`;
 }
 return html+'</div>';
}
function dateDetails(){
 const list=on(selected),g=granted(selected).length,already=list.some(r=>r.userId===user&&active(r));
 const committed=own().filter(active).length;
 const disabled=isOff(selected)||already||committed>=ALLOW;
 return `<div style="border-top:1px solid #e7eeee;margin-top:18px;padding-top:16px"><div class="row"><strong>${date(selected)}</strong><span class="pill">${g}/${CAP} concedidos</span></div><p class="muted">${list.length} solicitudes registradas · ${Math.max(0,CAP-g)} plazas orientativas</p>${list.map(r=>`<div class="listrow"><strong>${safe(who(r.userId))}</strong>${badge(r.status)}</div>`).join('')||'<p class="muted">Sin solicitudes para esta fecha.</p>'}<div style="margin-top:17px"><button class="primary" id="submitRequest" ${disabled?'disabled':''}>Solicitar este día</button></div><p class="muted">${isOff(selected)?'No lectivo en el calendario ficticio.':already?'Ya existe una solicitud propia para esta fecha.':committed>=ALLOW?'Límite experimental de días comprometidos.':'La solicitud se guarda solo en esta sesión de laboratorio.'}</p></div>`;
}
function teacherCalendar(){
 return `<div class="grid"><section class="card"><h2>Calendario de solicitudes</h2>${calendar()}${dateDetails()}</section><aside><section class="card"><div class="summary"><div><strong>${Math.max(0,ALLOW-own().filter(active).length)}</strong><small>Sin comprometer</small></div><div><strong>${own().length}</strong><small>Mis peticiones</small></div></div><h2>Mis solicitudes</h2>${own().map(r=>`<div class="listrow"><div><strong>${date(r.dateRequested)}</strong><div class="muted">${r.id}</div></div>${badge(r.status)}</div>`).join('')||'<div class="empty">Sin solicitudes</div>'}</section></aside></div>`;
}
function teacherMine(){return `<section class="card"><h2>Mis solicitudes</h2>${own().map(r=>`<div class="listrow"><div><strong>${date(r.dateRequested)}</strong><p class="muted">${r.id} · Presentada ${r.submittedAt}</p></div>${badge(r.status)}</div>`).join('')||'Sin solicitudes'}</section>`}
function teacherProfile(){return `<section class="card" style="max-width:600px"><h2>Mi perfil ficticio</h2><p class="muted">Selector disponible solo en laboratorio.</p><select id="userSelect">${users.map(u=>`<option value="${u.id}" ${u.id===user?'selected':''}>${safe(u.name)}</option>`).join('')}</select><div class="notice">En producción la identidad vendrá de Google Workspace y no podrá cambiarse manualmente.</div></section>`}
function proposed(r){
 const same=on(r.dateRequested),g=same.filter(approved),p=same.filter(x=>x.status==='SOLICITADO');
 const currentGrants=reqs.filter(x=>x.userId===r.userId&&approved(x)).length;
 if(isOff(r.dateRequested))return {label:'Revisión necesaria',why:'Fecha marcada como no lectiva en el calendario parcial de demostración.',ok:false};
 if(g.length>=CAP)return {label:'Revisión necesaria',why:'El cupo de concesiones existentes está completo.',ok:false};
 if(g.length+p.length>CAP)return {label:'Concurrencia: revisar',why:`${g.length} concedidos y ${p.length} pendientes para ${CAP} plazas. Prioridad: 0 concesiones previas; después orden alfabético desde Ñ. No se adjudica automáticamente.`,ok:false};
 if(currentGrants>=ALLOW)return {label:'Revisión necesaria',why:'El docente ya tiene dos concesiones registradas.',ok:false};
 return {label:'Propuesta: aceptar',why:`Cupo disponible (${g.length}/${CAP}). Sin exceso de concurrencia en la muestra. Dirección debe verificar los requisitos y validar.`,ok:true};
}
function concurrence(){
 const dates=[...new Set(reqs.filter(r=>['SOLICITADO','ACEPTADA','PRESENTADA_EN_SENECA'].includes(r.status)).map(r=>r.dateRequested))].sort();
 const d=dates.includes(selected)?selected:dates[0];
 const options=dates.map(x=>`<option value="${x}" ${x===d?'selected':''}>${date(x)}</option>`).join('');if(!d)return '<section class="card">Sin solicitudes pendientes</section>';
 const res=PermisosRules.evaluate({date:d,requests:reqs,users,capacity:CAP,tieLetter:DEMO_TIE_LETTER});
 const table=res.ranked.map(r=>`<tr><td><b>${r.position}</b></td><td><b>${safe(r.teacherName)}</b><small>${r.id}</small></td><td>${r.previousGrants}</td><td><span class="status ${r.proposal}">${r.proposal==='PROPONER_ACEPTACION'?'Propuesta favorable':r.proposal==='SIN_PLAZA'?'Sin plaza':'Revisión'}</span></td><td><button class="secondary" data-accept="${r.id}" ${r.proposal!=='PROPONER_ACEPTACION'?'disabled':''}>Validar</button></td></tr>`).join('');
 return `<div class="statrow"><div><b>${reqs.filter(r=>r.status==='SOLICITADO').length}</b><span>Por validar</span></div><div><b>${res.granted}</b><span>Ya concedidas</span></div><div><b>${res.free}</b><span>Plazas restantes</span></div></div><section class="card"><div class="row"><div><h2>Concurrencias y prioridades</h2><p class="muted">Orden calculado para revisión y validación de Dirección.</p></div><select id="concurrenceDate">${options}</select></div><div class="notice">${safe(res.algorithm)}. Clasificación orientativa sobre datos ficticios. La validación no equivale a aprobación en Séneca.</div><p class="muted">${res.granted} concesiones firmes · ${res.acceptedHolds} aceptaciones provisionales que reservan plaza · ${res.free} plazas sin reservar.</p><div class="tablewrap"><table><thead><tr><th>Orden</th><th>Docente</th><th>Concesiones previas</th><th>Propuesta</th><th>Dirección</th></tr></thead><tbody>${table}</tbody></table></div>${res.issues.length?`<div class="notice warn">${res.issues.map(safe).join(' · ')}</div>`:''}</section><section class="card"><h2>Tramitación oficial simulada · Anexo I P27</h2>${reqs.filter(r=>['ACEPTADA','PRESENTADA_EN_SENECA'].includes(r.status)).map(r=>`<div class="listrow"><div><b>${safe(who(r.userId))}</b><div class="muted">${date(r.dateRequested)} · ${r.id} · ${r.status}</div></div><div class="actions">${r.status==='ACEPTADA'?`<button class="secondary" data-file="${r.id}">Consta Anexo I</button>`:`<button class="secondary" data-approve="${r.id}">Registrar resolución favorable</button>`}</div></div>`).join('')||'<p class="muted">Sin aceptaciones pendientes de tramitación.</p>'}<div class="notice">Los botones registran hechos ficticios declarados por Dirección. No comprueban Séneca ni envían correos.</div></section><section class="card"><h2>Otras fechas pendientes</h2><div class="datestrip">${dates.map(dt=>`<button class="secondary" data-concurrence="${dt}">${date(dt)} · ${on(dt).length} solicitudes</button>`).join('')}</div></section>`;
}
function queue(){return concurrence()}
function analytics(){
 const months=['septiembre','octubre','noviembre','diciembre','enero','febrero','marzo','abril','mayo','junio'];const monthNums=[9,10,11,12,1,2,3,4,5,6];
 const counts=monthNums.map((m,i)=>({name:months[i],count:reqs.filter(r=>Number(r.dateRequested.slice(5,7))===m).length}));const max=Math.max(1,...counts.map(x=>x.count));
 const statuses=[...new Set(reqs.map(r=>r.status))].map(s=>({status:s,count:reqs.filter(r=>r.status===s).length}));
 return `<div class="statrow"><div><b>${reqs.length}</b><span>Solicitudes</span></div><div><b>${reqs.filter(r=>r.status==='SOLICITADO').length}</b><span>Pendientes</span></div><div><b>${reqs.filter(r=>approved(r)).length}</b><span>Concedidas / aprobadas</span></div></div><div class="grid"><section class="card"><h2>Demanda mensual</h2>${counts.map(x=>`<div class="metricrow"><span>${x.name}</span><div class="bar"><i style="width:${x.count/max*100}%"></i></div><b>${x.count}</b></div>`).join('')}</section><section class="card"><h2>Estados de solicitudes</h2>${statuses.map(s=>`<div class="listrow"><span>${badge(s.status)}</span><b>${s.count}</b></div>`).join('')}<div class="notice">Métricas calculadas sobre datos ficticios de la sesión. No se equiparan solicitudes, aceptaciones, resoluciones y disfrutes.</div><button class="primary" id="printReport">Imprimir / guardar resumen en PDF</button></section></div><section class="card"><h2>Historial de decisiones de esta sesión</h2>${audit.map(x=>`<div class="listrow"><span>${safe(x.id)} · ${safe(x.from)} → ${safe(x.to)}</span><span class="muted">${safe(x.actor)}</span></div>`).join('')||'<p class="muted">Todavía no se han registrado actuaciones en esta sesión.</p>'}</section><section class="card"><h2>Fechas más demandadas</h2>${[...new Set(reqs.map(r=>r.dateRequested))].map(d=>({d,count:on(d).length})).sort((a,b)=>b.count-a.count||a.d.localeCompare(b.d)).slice(0,8).map(x=>`<div class="listrow"><b>${date(x.d)}</b><span>${x.count} solicitudes</span></div>`).join('')}</section>`;
}
function directorCalendar(){return `<div class="grid"><section class="card"><h2>Ocupación por fecha</h2>${calendar()}${dateDetails().replace(/<button class="primary" id="submitRequest"[^>]*>.*?<\/button>/,'')}</section><aside><section class="card"><h2>Resumen del día</h2><p>${date(selected)}</p><strong>${on(selected).length} solicitudes</strong><p class="muted">${granted(selected).length} concedidas · ${Math.max(0,CAP-granted(selected).length)} plazas orientativas</p></section></aside></div>`}
function allRecords(){return `<section class="card"><h2>Solicitudes y estados</h2>${reqs.slice().sort((a,b)=>a.dateRequested.localeCompare(b.dateRequested)).map(r=>`<div class="listrow"><div><strong>${safe(who(r.userId))}</strong><div class="muted">${date(r.dateRequested)} · ${r.id}</div></div>${badge(r.status)}</div>`).join('')}</section>`}
function render(){
 const teacher=role==='teacher',dir=role==='director';
 $('title').textContent=teacher?'Mis permisos':dir?'Validación de solicitudes':role==='technical'?'Diagnóstico técnico':'Acceso no autorizado';
 $('subtitle').textContent=teacher?'Fechas, solicitudes y perfil. Todo en tres pantallas.':dir?'Propuestas automáticas justificadas, decisión final de Dirección.':'Acceso simulado sin expedientes.';
 const tabs=teacher?[['calendar','Calendario'],['mine','Mis solicitudes'],['profile','Mi perfil']]:dir?[['queue','Concurrencias'],['occupancy','Calendario'],['records','Expedientes'],['analytics','Analítica y memoria']]:[];
 $('nav').innerHTML=tabs.map(([id,label])=>`<button data-tab="${id}" class="${tab===id?'active':''}">${label}</button>`).join('');
 $('app').innerHTML=teacher?(tab==='calendar'?teacherCalendar():tab==='mine'?teacherMine():teacherProfile()):dir?(tab==='queue'?queue():tab==='occupancy'?directorCalendar():tab==='analytics'?analytics():allRecords()):role==='technical'?'<section class="card"><h2>Diagnóstico</h2><p>Solo datos sintéticos. Sin conexión a Google Workspace, Sheets ni Séneca. Sin funciones de aprobación.</p></section>':'<section class="card"><h2>Sin acceso</h2><p>La cuenta ficticia no está autorizada.</p></section>';
 bind();
}
function bind(){
 document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{tab=b.dataset.tab;render()});
 document.querySelectorAll('[data-month]').forEach(b=>b.onclick=()=>{month+=Number(b.dataset.month);if(month<0){month=11;year--}if(month>11){month=0;year++}render()});
 document.querySelectorAll('[data-date]').forEach(b=>b.onclick=()=>{selected=b.dataset.date;render()});
 const cd=$('concurrenceDate');if(cd)cd.onchange=()=>{selected=cd.value;render()};document.querySelectorAll('[data-concurrence]').forEach(b=>b.onclick=()=>{selected=b.dataset.concurrence;render()});const pr=$('printReport');if(pr)pr.onclick=()=>window.print();const us=$('userSelect');if(us)us.onchange=()=>{user=us.value;render()};
 const submit=$('submitRequest');if(submit)submit.onclick=()=>{
  if(role!=='teacher'||isOff(selected)||own().filter(active).length>=ALLOW||on(selected).some(r=>r.userId===user&&active(r)))return;
  reqs.push({id:'S-'+String(reqs.length+1).padStart(3,'0'),userId:user,dateRequested:selected,submittedAt:'2026-10-16',status:'SOLICITADO'});render();alert('Solicitud ficticia registrada. No se ha enviado a Dirección ni a Séneca.');
 };
 document.querySelectorAll('[data-accept]').forEach(b=>b.onclick=()=>{
  if(role!=='director')return;const r=reqs.find(x=>x.id===b.dataset.accept);if(!r||r.status!=='SOLICITADO')return;const e=PermisosRules.evaluate({date:r.dateRequested,requests:reqs,users,capacity:CAP,tieLetter:DEMO_TIE_LETTER});if(e.ranked.find(x=>x.id===r.id)?.proposal!=='PROPONER_ACEPTACION'){alert('Esta solicitud no figura entre las propuestas favorables; requiere revisión.');return;}
  if(!confirm(`¿Registrar ACEPTADA para ${who(r.userId)} (${date(r.dateRequested)}) en esta simulación? No equivale a APROBADA.`))return;
  audit.push({id:r.id,from:r.status,to:'ACEPTADA',actor:'Dirección ficticia'});r.status='ACEPTADA';render();
 });
 document.querySelectorAll('[data-file]').forEach(b=>b.onclick=()=>{
  if(role!=='director')return;const r=reqs.find(x=>x.id===b.dataset.file);
  if(!r||r.status!=='ACEPTADA')return;
  if(!confirm('¿Confirmar que consta la presentación del Anexo I P27 en Séneca? SIMULACIÓN sin conexión real.'))return;
  audit.push({id:r.id,from:r.status,to:'PRESENTADA_EN_SENECA',actor:'Dirección ficticia'});
  r.status='PRESENTADA_EN_SENECA';render();
 });
 document.querySelectorAll('[data-approve]').forEach(b=>b.onclick=()=>{
  if(role!=='director')return;const r=reqs.find(x=>x.id===b.dataset.approve);
  if(!r||r.status!=='PRESENTADA_EN_SENECA')return;
  const count=reqs.filter(x=>x.dateRequested===r.dateRequested&&approved(x)).length;
  if(count>=CAP){alert('Cupo de concesiones completo. Revisión necesaria.');return;}
  if(!confirm('¿Confirmar que existe resolución oficial favorable comprobada? SIMULACIÓN.'))return;
  audit.push({id:r.id,from:r.status,to:'APROBADA',actor:'Dirección ficticia'});
  r.status='APROBADA';render();
 });
 document.querySelectorAll('[data-review]').forEach(b=>b.onclick=()=>{if(role!=='director')return;alert('Revisión manual señalada en la demostración. No se modifica el estado ni se emite resolución.')});
}
$('role').onchange=e=>{role=e.target.value;tab=role==='teacher'?'calendar':'queue';render()};
render();
})();
