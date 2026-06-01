# CRM Gestoría — Pendientes aparcados

Lista viva de tareas diferidas entre bloques. Se revisa al cerrar cada bloque.
No borrar entradas sin confirmación del owner; marcar como hechas con `[x]` y fecha.

## Aparcadas (esperando su momento)

- [ ] **Manual de ayuda in-app.** Botón "?" / "Ayuda" en la barra superior que abre un
  manual desplegable DENTRO de la app (panel lateral o modal), con secciones consultables
  y buscador. Contenido en Markdown editable. NO un PDF descargable (se desfasa y nadie lo
  vuelve a bajar). Enfoque: explicar EL SOFTWARE, no el oficio (los usuarios son gestorías
  que ya saben tramitar; lo que no conocen es la herramienta).
  Secciones previstas: qué es un expediente y cómo va el Kanban · la bandeja de matches
  (aceptar/descartar) · los estados y por qué un movimiento se bloquea · documentos
  (checklist, qué bloquea la presentación, caducidades) · panel de plazos y alertas ·
  notificación al cliente · honorarios.
  → Hacer cuando la herramienta esté COMPLETA (si no, el manual queda obsoleto enseguida).

- [ ] **Retirar o reubicar el botón provisional "＋ Nuevo expediente".** Es temporal para
  pruebas. Cuando llegue la bandeja de matches (origen real de los expedientes), retirarlo
  o reubicarlo como alta manual secundaria.

## Surgidas durante el desarrollo

- [ ] (vacío de momento)

## Hechas

- [x] 2026-06-01 — Bloque 2 + cierre: ficha de expediente (Resumen/Actividad/Honorarios),
  modal de captura de hito (Presentada/Concedida/Denegada) con red de seguridad en
  fecha_inicio_tramite, validación SAP en módulo compartido `lib/expedientes-estados.js`
  (Kanban y ficha hablan el mismo idioma), honorarios como registro interno sin Stripe,
  API de actividad. Redirect `/gestor`→Kanban aplicado; Clientes movido a `/gestor/clientes`;
  botón "Mi panel" en la home para gestor logado.

- [x] 2026-06-01 — Bloque 1: tabla `expedientes` + 4 tablas relacionadas (RLS), API
  `/api/gestor/expedientes`, tablero Kanban, navegación cruzada Expedientes↔Clientes,
  botón provisional de alta. `gestor.js` movido a `gestor/index.js` (colisión de rutas).

