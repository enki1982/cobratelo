# CRM Gestoría — Pendientes aparcados

Lista viva de tareas diferidas entre bloques. Se revisa al cerrar cada bloque.
No borrar entradas sin confirmación del owner; marcar como hechas con `[x]` y fecha.

## Aparcadas (esperando su momento)

- [x] 2026-06-08 — Retirar o reubicar el botón provisional "＋ Nuevo expediente".**
  Es temporal para pruebas. Cuando el flujo Bandeja de matches → Expediente esté
  consolidado con clientes reales, retirarlo o dejarlo como alta manual secundaria — HECHO, se quitó
  bien integrada (no provisional).

## Surgidas durante el desarrollo

- [ ] (vacío de momento)

## Hechas

- [x] 2026-06-08 — Manual de ayuda in-app. Componente `ManualAyuda` construido e
  integrado. Botón "? Ayuda" visible en la barra del Kanban. 10 secciones con acordeón
  y buscador. Pendientes del archivo anterior desactualizado — el manual sí existe.

- [x] 2026-06-05 — Fase C: notificación al cliente con un clic en Concedida/Denegada,
  email preformateado, log en `expediente_actividad`.

- [x] 2026-06-05 — Fase B: onboarding de clientes como usuarios Auth reales,
  checkbox de consentimiento con trazabilidad legal, editor de perfil de cliente vía
  `/perfil?cliente=ID`, flujo de invitación con magic link, bandeja de matches usando
  `calcularRelevancia`, flujo Aceptar/Descartar.

- [x] 2026-06-05 — Fase A: checklist de documentos por tipo de ayuda con lógica de
  bloqueo y caducidad, tareas, motor de vencimientos con panel in-app y alertas email
  los lunes, columna `alertas_emails` en usuarios.

- [x] 2026-06-01 — Bloque 2 + cierre: ficha de expediente (Resumen/Actividad/Honorarios),
  modal de captura de hito (Presentada/Concedida/Denegada) con red de seguridad en
  fecha_inicio_tramite, validación SAP en módulo compartido `lib/expedientes-estados.js`,
  honorarios como registro interno sin Stripe, API de actividad.
  Redirect `/gestor`→Kanban aplicado; Clientes movido a `/gestor/clientes`;
  botón "Mi panel" en la home para gestor logado.

- [x] 2026-06-01 — Bloque 1: tabla `expedientes` + 4 tablas relacionadas (RLS), API
  `/api/gestor/expedientes`, tablero Kanban, navegación cruzada Expedientes↔Clientes,
  botón provisional de alta. `gestor.js` movido a `gestor/index.js` (colisión de rutas).
