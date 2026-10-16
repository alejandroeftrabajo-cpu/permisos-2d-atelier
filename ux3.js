
(()=>{'use strict';
const $=id=>document.getElementById(id);
const users=structuredClone(DEMO_USERS),reqs=structuredClone(DEMO_REQUESTS);
let role='teacher',tab='calendar',user='u-a',year=2026,month=9,selected='2026-10-20';
const CAP=DEMO_CAPACITY,ALLOW=DEMO_ALLOWANCE;
const who=id=>users.find(u=>u.id===id)?.name||'Ficticio';
const date=d=>prettyDate(d);
const on=d=>reqs.filter(r=>r.dateRequested===d);
const approved=r=>['CONCEDIDO','APROBADA','DISFRUTADA'].includes(r.status);
const active=r=>['SOLICITADO','ACEPTADA','CONCEDIDO','APROBADA','DISFRUTADA'].includes(r.status);
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
function queue(){
 const pending=reqs.filter(r=>r.status==='SOLICITADO').sort((a,b)=>a.dateRequested.localeCompare(b.dateRequested));
 return `<div class="summary"><div><strong>${pending.length}</strong><small>Por validar</small></div><div><strong>${pending.filter(r=>!proposed(r).ok).length}</strong><small>Requieren revisión</small></div><div><strong>${pending.filter(r=>proposed(r).ok).length}</strong><small>Propuesta favorable</small></div></div><div class="grid"><section class="card"><h2>Bandeja de validación</h2>${pending.map(r=>{const pr=proposed(r);return `<article class="request"><div class="row"><strong>${safe(who(r.userId))}</strong><span class="pill">${r.id}</span></div><p>${date(r.dateRequested)}</p><div class="notice ${pr.ok?'':'warn'}"><b>${pr.label}</b><br>${pr.why}</div><div class="actions"><button class="primary" data-accept="${r.id}">Validar aceptación previa</button><button class="secondary" data-review="${r.id}">Marcar para revisión</button></div></article>`}).join('')||'<div class="empty">No hay pendientes</div>'}</section><aside><section class="card"><h2>Qué hace el sistema</h2><p class="muted">Comprueba el cupo, las concesiones registradas y la concurrencia.</p><div class="notice">La letra Ñ y la prioridad por no haber obtenido permisos requieren datos completos y un cálculo auditado. Las propuestas no constituyen resoluciones oficiales.</div><p class="muted">Aceptar aquí solo cambia el estado ficticio a ACEPTADA. APROBADA requiere registrar la resolución oficial de Séneca (P27).</p></section></aside></div>`;
}
function directorCalendar(){return `<div class="grid"><section class="card"><h2>Ocupación por fecha</h2>${calendar()}${dateDetails().replace(/<button class="primary" id="submitRequest"[^>]*>.*?<\/button>/,'')}</section><aside><section class="card"><h2>Resumen del día</h2><p>${date(selected)}</p><strong>${on(selected).length} solicitudes</strong><p class="muted">${granted(selected).length} concedidas · ${Math.max(0,CAP-granted(selected).length)} plazas orientativas</p></section></aside></div>`}
function allRecords(){return `<section class="card"><h2>Solicitudes y estados</h2>${reqs.slice().sort((a,b)=>a.dateRequested.localeCompare(b.dateRequested)).map(r=>`<div class="listrow"><div><strong>${safe(who(r.userId))}</strong><div class="muted">${date(r.dateRequested)} · ${r.id}</div></div>${badge(r.status)}</div>`).join('')}</section>`}
function render(){
 const teacher=role==='teacher',dir=role==='director';
 $('title').textContent=teacher?'Mis permisos':dir?'Validación de solicitudes':role==='technical'?'Diagnóstico técnico':'Acceso no autorizado';
 $('subtitle').textContent=teacher?'Fechas, solicitudes y perfil. Todo en tres pantallas.':dir?'Propuestas automáticas justificadas, decisión final de Dirección.':'Acceso simulado sin expedientes.';
 const tabs=teacher?[['calendar','Calendario'],['mine','Mis solicitudes'],['profile','Mi perfil']]:dir?[['queue','Por validar'],['occupancy','Calendario'],['records','Todas las solicitudes']]:[];
 $('nav').innerHTML=tabs.map(([id,label])=>`<button data-tab="${id}" class="${tab===id?'active':''}">${label}</button>`).join('');
 $('app').innerHTML=teacher?(tab==='calendar'?teacherCalendar():tab==='mine'?teacherMine():teacherProfile()):dir?(tab==='queue'?queue():tab==='occupancy'?directorCalendar():allRecords()):role==='technical'?'<section class="card"><h2>Diagnóstico</h2><p>Solo datos sintéticos. Sin conexión a Google Workspace, Sheets ni Séneca. Sin funciones de aprobación.</p></section>':'<section class="card"><h2>Sin acceso</h2><p>La cuenta ficticia no está autorizada.</p></section>';
 bind();
}
function bind(){
 document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{tab=b.dataset.tab;render()});
 document.querySelectorAll('[data-month]').forEach(b=>b.onclick=()=>{month+=Number(b.dataset.month);if(month<0){month=11;year--}if(month>11){month=0;year++}render()});
 document.querySelectorAll('[data-date]').forEach(b=>b.onclick=()=>{selected=b.dataset.date;render()});
 const us=$('userSelect');if(us)us.onchange=()=>{user=us.value;render()};
 const submit=$('submitRequest');if(submit)submit.onclick=()=>{
  if(role!=='teacher'||isOff(selected)||own().filter(active).length>=ALLOW||on(selected).some(r=>r.userId===user&&active(r)))return;
  reqs.push({id:'S-'+String(reqs.length+1).padStart(3,'0'),userId:user,dateRequested:selected,submittedAt:'2026-10-16',status:'SOLICITADO'});render();alert('Solicitud ficticia registrada. No se ha enviado a Dirección ni a Séneca.');
 };
 document.querySelectorAll('[data-accept]').forEach(b=>b.onclick=()=>{
  if(role!=='director')return;const r=reqs.find(x=>x.id===b.dataset.accept);if(!r||r.status!=='SOLICITADO')return;if(!proposed(r).ok){alert('La propuesta requiere revisión; no puede validarse automáticamente en esta demostración.');return;}
  if(!confirm(`¿Registrar ACEPTADA para ${who(r.userId)} (${date(r.dateRequested)}) en esta simulación? No equivale a APROBADA.`))return;
  r.status='ACEPTADA';render();
 });
 document.querySelectorAll('[data-review]').forEach(b=>b.onclick=()=>{if(role!=='director')return;alert('Revisión manual señalada en la demostración. No se modifica el estado ni se emite resolución.')});
}
$('role').onchange=e=>{role=e.target.value;tab=role==='teacher'?'calendar':'queue';render()};
render();
})();
