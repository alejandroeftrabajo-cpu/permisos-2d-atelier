/* PERMISOS 2D — pure authorization policy, lab only. No real authentication. */
'use strict';
const ROLES = Object.freeze({TEACHER:'teacher',DIRECTOR:'director',TECHNICIAN:'technician'});
const ACTIONS = Object.freeze({
 VIEW_CALENDAR:'view_calendar',VIEW_OWN:'view_own',REQUEST:'request',REQUEST_CHANGE:'request_change',
 VIEW_CASES:'view_cases',DECIDE:'decide',IMPORT:'import',VIEW_PRIVATE:'view_private',
 VIEW_DIAGNOSTICS:'view_diagnostics',CONFIGURE:'configure',RUN_SYNTHETIC_TESTS:'run_synthetic_tests'
});
const POLICY = Object.freeze({
 [ROLES.TEACHER]:[ACTIONS.VIEW_CALENDAR,ACTIONS.VIEW_OWN,ACTIONS.REQUEST,ACTIONS.REQUEST_CHANGE],
 [ROLES.DIRECTOR]:[ACTIONS.VIEW_CALENDAR,ACTIONS.VIEW_OWN,ACTIONS.REQUEST,ACTIONS.REQUEST_CHANGE,ACTIONS.VIEW_CASES,ACTIONS.DECIDE,ACTIONS.IMPORT,ACTIONS.VIEW_PRIVATE,ACTIONS.RUN_SYNTHETIC_TESTS],
 [ROLES.TECHNICIAN]:[ACTIONS.VIEW_DIAGNOSTICS,ACTIONS.CONFIGURE,ACTIONS.RUN_SYNTHETIC_TESTS]
});
function authorize({identity, action, ownerId, roster}) {
 if (!identity || typeof identity.email !== 'string' || !Array.isArray(roster)) return false;
 const email=identity.email.trim().toLowerCase();
 if(!email.endsWith('@g.educaand.es')) return false;
 const member=roster.find(x=>x.email.toLowerCase()===email && x.active===true);
 if(!member || !Object.values(ROLES).includes(member.role)) return false;
 if(!POLICY[member.role].includes(action)) return false;
 if(action===ACTIONS.VIEW_OWN && ownerId!==member.id) return false;
 return true;
}
function safeDiagnostic(error) { return {code:String(error?.code||'UNEXPECTED').replace(/[^A-Z0-9_]/g,'').slice(0,40),category:'application',message:'Incidencia técnica registrada sin datos personales'}; }
if(typeof module!=='undefined') module.exports={ROLES,ACTIONS,POLICY,authorize,safeDiagnostic};
