'use strict';
/* PERMISOS 2D — motor puro de laboratorio. No registra permisos oficiales. */
const STATES=Object.freeze({
 REQUESTED:'SOLICITADA',ACCEPTED:'ACEPTADA',FILED:'PRESENTADA_EN_SENECA',
 APPROVED:'APROBADA',DENIED:'DENEGADA',ENJOYED:'DISFRUTADA',
 CHANGE_REQUESTED:'CAMBIO_SOLICITADO',CANCELLATION_REQUESTED:'CANCELACION_SOLICITADA'
});
const MAX_CONCURRENT=4, MAX_DAYS=2, TIE_LETTER='Ñ', SCHOOL_YEAR='2026/2027';
const isDate=s=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(s))return false;const d=new Date(s+'T12:00:00Z');return !Number.isNaN(d.getTime())&&d.toISOString().slice(0,10)===s};
const isInYear=s=>isDate(s)&&s>='2026-09-01'&&s<='2027-08-31';
function assertValidRequest(r,all=[]){
 if(!r?.id||!r?.userId||!isInYear(r.dateRequested))throw Error('Solicitud inválida o fuera del curso');
 if(all.some(x=>x.id===r.id))throw Error('Identificador duplicado');
 if(all.some(x=>x.userId===r.userId&&x.dateRequested===r.dateRequested&&!['DENEGADA'].includes(x.status)))throw Error('Solicitud duplicada para la fecha');
}
function countGranted(userId,all){return all.filter(x=>x.userId===userId&&[STATES.APPROVED,STATES.ENJOYED].includes(x.status)).length}
function concurrent(date,all){return all.filter(x=>x.dateRequested===date&&[STATES.REQUESTED,STATES.ACCEPTED,STATES.FILED,STATES.APPROVED].includes(x.status))}
function warning(date,all){return concurrent(date,all).length>MAX_CONCURRENT}
const transitions=Object.freeze({
 [STATES.REQUESTED]:[STATES.ACCEPTED,STATES.DENIED,STATES.CHANGE_REQUESTED,STATES.CANCELLATION_REQUESTED],
 [STATES.ACCEPTED]:[STATES.FILED,STATES.DENIED,STATES.CHANGE_REQUESTED,STATES.CANCELLATION_REQUESTED],
 [STATES.FILED]:[STATES.APPROVED,STATES.DENIED],
 [STATES.APPROVED]:[STATES.ENJOYED],
 [STATES.ENJOYED]:[],[STATES.DENIED]:[],
 [STATES.CHANGE_REQUESTED]:[STATES.REQUESTED,STATES.DENIED],
 [STATES.CANCELLATION_REQUESTED]:[STATES.REQUESTED,STATES.DENIED]
});
function changeStatus(r,next,{role,officialResolution=false,now,actor}={}){
 if(role!=='director')throw Error('Solo Dirección puede modificar estados');
 if(!transitions[r.status]?.includes(next))throw Error('Transición no permitida');
 if(next===STATES.APPROVED&&!officialResolution)throw Error('Falta constancia de resolución oficial en Séneca');
 if(next===STATES.ENJOYED&&(!isDate(now)||now<=r.dateRequested))throw Error('El día no ha transcurrido');
 const entry={from:r.status,to:next,actor:actor||'direccion-demo',at:now||null};
 return {...r,status:next,history:[...(r.history||[]),entry]};
}
function autoEnjoy(r,now){
 if(r.status!==STATES.APPROVED||!isDate(now)||now<=r.dateRequested)return r;
 return {...r,status:STATES.ENJOYED,history:[...(r.history||[]),{from:STATES.APPROVED,to:STATES.ENJOYED,actor:'sistema-demo',at:now}]};
}
function safeNotification(type,r){
 if(!['NEW_REQUEST','ACCEPTED','DECIDED','CONCURRENCY'].includes(type))throw Error('Aviso no admitido');
 return {type,requestId:r.id,date:r.dateRequested,reason:null,attachments:[],dispatch:'SIMULATED'};
}
module.exports={STATES,MAX_CONCURRENT,MAX_DAYS,TIE_LETTER,SCHOOL_YEAR,isDate,isInYear,assertValidRequest,countGranted,concurrent,warning,changeStatus,autoEnjoy,safeNotification};
