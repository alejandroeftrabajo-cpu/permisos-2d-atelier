# PERMISOS 2D · Fase 2 de laboratorio

Módulo independiente para verificar las reglas del circuito de solicitudes y la separación de roles. No modifica el repositorio de producción, no envía correos ni accede a Google Sheets.

## Ejecutar pruebas
Requiere Node.js 18 o superior:

```bash
node --test tests/workflow.test.js tests/access-control.test.js
```

## Alcance
- Cupo de demostración ajustado a 75 docentes: 4 simultáneos.
- Referencia de desempate Ñ, **sin automatizar adjudicaciones**.
- Flujo: SOLICITADA → ACEPTADA → PRESENTADA_EN_SENECA → APROBADA → DISFRUTADA.
- Aprobación requiere constancia de resolución oficial; el servidor real deberá verificarla.
- Avisos solo simulados, sin datos privados.
- RBAC aislado, **no autenticación corporativa real**.

## Limitaciones
El cálculo de plazos hábiles, el calendario oficial, las excepciones de cupo, la identidad corporativa y las transiciones administrativas requieren validación e integración. `officialResolution` es un indicador de prueba, nunca debe aceptarse como prueba aportada por el navegador. Las rectificaciones excepcionales no se automatizan.

No utilizar con datos personales ni desplegar como gestor institucional.
