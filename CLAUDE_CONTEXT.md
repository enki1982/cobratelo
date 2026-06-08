# CLAUDE CONTEXT — Miki (actualizado 29 mayo 2026)

> Lee este archivo al inicio de cualquier conversación nueva para ponerte al día sin preguntar.

## MENSAJE DE INICIO PARA NUEVA CONVERSACIÓN

Pega esto exactamente al abrir una conversación nueva con Claude:

```
Lee el archivo CLAUDE_CONTEXT.md del repo https://github.com/enki1982/cobratelo rama main — haz un web_fetch directo al raw para asegurarte de leer la versión más reciente. Una vez leído, clona el repo en /home/claude/cobratelo para tener acceso al mecanismo .hetzner-cmd. Antes de proponer nada, asegúrate de tener en cuenta tanto los pendientes técnicos como los estratégicos del documento.
```

---

## QUIÉN ES MIKI

- **Nombre:** Miki, 43 años, Mataró (Barcelona)
- **Rol principal:** COO de Urban Self Storage Projects SL (urbanss.es)
- **Holding personal:** Volta Grup (voltagrup.com)
- **Perfil:** Emprendedor serial, técnico-estratégico, construye él mismo los proyectos digitales con Claude

**Estilo de trabajo:** directo, sin rodeos, prefiere un solo push cuando es posible. Habla castellano, a veces catalán.

---

## PROYECTOS ACTIVOS

### 1. COBRATELO.ES — Plataforma de ayudas públicas españolas

**URLs:**
- Producción: https://www.cobratelo.es
- Vercel preview: cobratelo-five.vercel.app
- Repo: https://github.com/enki1982/cobratelo (rama `main`)

**Stack:**
- Frontend: Next.js en Vercel
- BD: Supabase (`pcuomumijpzgatpfgtyo.supabase.co`)
- Pagos: Stripe (live mode)
- Email: Forward Email (SMTP)
- Agente ingesta: Hetzner VPS `46.224.184.13`

**Variables de entorno Vercel:**
- `NEXT_PUBLIC_GA_ID` → G-8JCGD1CG67
- `STRIPE_WEBHOOK_SECRET` → whsec_3CYTzgT79GDY3drwWQ5RWWm9i2GFBDf7
- `NEXT_PUBLIC_STRIPE_PRICE_STARTER` → price_1TatI9RcjgMq3SnyPhsdIxYC (149€/mes)
- `NEXT_PUBLIC_STRIPE_PRICE_PRO` → price_1TatJ8RcjgMq3Sny71IyZJGr (399€/mes)
- `STRIPE_SECRET_KEY` → sk_live_... (configurada)
- `SUPABASE_SERVICE_KEY` → configurada
- `NEXT_PUBLIC_GOOGLE_PLACES_KEY` → AIzaSyCaNU_QX4KpRNVqP8ZM441VFHlRE0_Yc78
- `CRON_SECRET` → cobratelo2026alertas
- `SMTP_*` → configuradas

**Webhook Stripe:** `we_1TatVmRcjgMq3SnyLrmnT4vu` → `https://www.cobratelo.es/api/webhook-stripe`

---

## SUPABASE — TABLAS

| Tabla | Descripción |
|-------|-------------|
| `usuarios` | id, email, plan, perfil (JSONB), ayudas_calculadas (JSONB), session_token (TEXT), stripe_customer_id (TEXT), alertas_enviadas, ayudas_alertadas |
| `ayudas` | 233 ayudas activas con slug único |
| `gestoria_clientes` | CRM gestorías — clientes por gestor, con RLS |
| `gestoria_invitaciones` | invitaciones pendientes cuando ciudadano envía email a gestoría |

---

## PLANES Y PRECIOS

| Plan | Precio | Descripción |
|------|--------|-------------|
| `free` | 0€ | Ciudadano particular — acceso limitado |
| `starter` | 149€/mes | Gestoría Básico — hasta 50 clientes, trial 7 días |
| `pro` | 399€/mes | Gestoría Pro — ilimitado, trial 7 días |
| `enterprise` | Próximamente | — |

---

## PRODUCTO — FUNCIONALIDADES IMPLEMENTADAS

### Flujo ciudadano
- Cuestionario de perfil (situación laboral, familiar, vivienda, ingresos, población, vehículo, etc.)
- Resultados personalizados con relevancia calculada client-side + caché en `ayudas_calculadas`
- Edición inline de perfil en `/cuenta` — cada campo clicable abre el modal correcto
- Invalidación de caché al editar perfil → recálculo en próxima visita a resultados
- Envío de ayudas a gestoría desde `/cuenta` + copia al usuario por email
- Alertas email semanales cuando aparecen ayudas nuevas

### Flujo gestoría
- Checkout con trial 7 días para planes starter/pro
- Portal de facturación Stripe (live mode, funcional)
- Panel CRM en `/gestor` — solo accesible para planes starter/pro
  - Lista de clientes con filtros, búsqueda, stats
  - Panel lateral detalle con edición inline
  - Sistema de tramitación por ayuda tipo SAP:
    - 5 fechas con dependencias validadas: solicitud cliente → inicio trámite → presentación → resolución
    - `fecha_plazo_maximo` libre (sin bloqueo)
    - Estados bloqueados si faltan fechas previas (⚠ en opciones no disponibles)
    - Al borrar fecha padre: avisa y borra fechas hijas
  - Buscador de ayudas para añadir manualmente al cliente
  - Exportación CSV con BOM UTF-8 (compatible Excel)
  - Límite 50 clientes plan Básico, ilimitado Pro
- Control de sesiones concurrentes (token UUID en `usuarios.session_token`) — al entrar en otro dispositivo cierra el anterior con aviso
- Enlace "Panel gestoría" en nav de `/cuenta` solo para starter/pro

### Flujo email gestoría (captación)
- Ciudadano envía sus ayudas al email de su gestoría desde `/resultados` o `/cuenta`
- Email con resumen de ayudas, pitch de cobratelo, links a convocatorias OFICIALES, CTA trial 7 días
- Copia al ciudadano confirmando el envío
- Invitación guardada en `gestoria_invitaciones` → cuando la gestoría se registra, ve al cliente

### Técnico
- Google Places nueva API (`AutocompleteSuggestion`) para municipio + fallback Nominatim
- Badge con número de ayudas en "Ver mis ayudas" (desde caché, sin recalcular)
- `/admin` con stats, usuarios, MRR real (149€/399€), distribución de planes con nombres correctos

---

## AGENTE VPS — ESTADO ACTUAL

**Ruta:** `/root/ayuda-es-agent/`
**Crontab:** `0 3 * * 1` → python3 agent.py (lunes 3am)
**Log:** `/var/log/ayuda-es.log`

**Imports confirmados (líneas 8-15):**
```
import os
import unicodedata
import re
import json
import logging
import time
from datetime import datetime
import anthropic
from supabase import create_client
```

**Sleeps:**
- Línea 229: `time.sleep(15)` — entre lotes de backfill
- Línea 289: `time.sleep(60)` — entre categorías de ingesta

**Problema conocido — rate limit 429:**
- Límite Anthropic: 50.000 input tokens/minuto (Haiku, tier 1)
- Con 60s sleep + 18 categorías: debería funcionar, pero los reintentos automáticos del SDK acumulan tokens extra
- `guardadas: 0` en última ejecución — posiblemente por errores previos de `re` no importado (ya corregido)
- **Solución real:** subir tier en Anthropic Console añadiendo créditos (https://console.anthropic.com/settings/billing)

**Errores resueltos:**
- `name 're' is not defined` → añadido `import re` en línea 10
- `name 'unicodedata' is not defined` → añadido `import unicodedata` en línea 9
- URL privadas (infoautonomos.com) → corregida Tarifa Plana a seg-social.es + prompt actualizado con lista negra de dominios privados y lista blanca de dominios oficiales

**Reglas de URL en el prompt:**
- ✅ Válidos: .gob.es, seg-social.es, sepe.es, boe.es, dogc.cat, sede.*.es, gencat.cat, comunidad.madrid, juntaandalucia.es, infosubvenciones.es, bdns.*, agenciatributaria.es
- ❌ Prohibidos: infoautonomos.com, iberley.es, wolterskluwer.es, expansion.com, eleconomista.es, emprendedores.es, sage.com, holded.com, declarando.com, noticias.juridicas.com, y cualquier web privada
- Si no hay URL oficial → dejar vacío, NUNCA poner URL privada

---

## ACCESO A HETZNER VPS (46.224.184.13)

Claude no puede hacer SSH directo. Acceso via **GitHub Actions**:

1. Escribir comando en `.hetzner-cmd`
2. Commit + push a `main`
3. Workflow `.github/workflows/hetzner.yml` ejecuta via `appleboy/ssh-action@v1.0.3`
4. Output en GitHub → Actions → último run → "Ejecutar en Hetzner"

**Scripts Python via hetzner-cmd:** usar base64 para evitar conflictos de quoting:
```bash
echo "BASE64_AQUI" | base64 -d > /tmp/script.py && python3 /tmp/script.py
```

---

## DEUDA TÉCNICA — REFACTOR PENDIENTE (PRIORIDAD ALTA)

Los siguientes archivos tienen demasiados parches acumulados y deben reescribirse limpios:

1. **`/root/ayuda-es-agent/agent.py`** — prioridad máxima
2. **`pages/gestor.js`** — CRM construido en capas sucesivas
3. **`pages/resultados.js`** — lógica de caché parcheada
4. **`pages/cuenta.js`** — múltiples patches de edición inline, envío gestor, etc.

**Criterio:** código actual = spec funcional → reescritura limpia sin perder funcionalidad.

---

## PENDIENTES TÉCNICOS

- [ ] **Agente `guardadas: 0`** — verificar si ya se resolvió tras fix de `import re`. Próxima ejecución lunes 3am. Comprobar con `grep "Error upsert\|guardadas\|encontradas" /var/log/ayuda-es.log | tail -30`
- [ ] **Subir tier Anthropic** → https://console.anthropic.com/settings/billing (solución real al rate limit)
- [ ] **Refactor agent.py** — reescritura limpia como sesión dedicada
- [ ] **Google Places municipio** — verificar que `AutocompleteSuggestion` funciona en producción (puede necesitar que el usuario actualice la página para cargar el SDK)
- [ ] **Backfill URLs** — 28 ayudas sin URL oficial, pendiente de completar
- [ ] **`fecha_plazo_maximo` en agente** — que el agente extraiga también esta fecha de las convocatorias
- [ ] **Refactor gestor.js, resultados.js, cuenta.js** — sesión dedicada

---

## PENDIENTES ESTRATÉGICOS

- Laborai.es como competencia/partner potencial (tienen acceso AEAT vía Colaborador Social)
- Vía Colaborador Social para cobratelo — requiere partnering con gestoría registrada
- Enterprise plan (próximamente) — definir funcionalidades
- Captación activa de gestorías — el flujo email→trial ya está operativo

---

## REFLEXIÓN ESTRATÉGICA

**Moat real:** La base de datos de ayudas curada y estructurada — no replicable en días.
**Riesgo Laborai:** Podrían replicar cobratelo. Oportunidad de colaboración: ellos AEAT + tramitación, cobratelo base de datos + matching.

---

## OTROS PROYECTOS

### Bot de trading BTC/USDC
- Servidor: Hetzner VPS `46.224.184.13`
- Ruta: `/opt/bot/auto_trader_bot_v1/`
- Servicio: `auto-trader-bot.service`
- Dashboard: https://voltagrup.com/trading.html
- Fix aplicado: `core/execution.py` — fee adjustment en SELL para evitar HALT por balance insuficiente
- Pendiente: capital mínimo ~2.000€ para que fees sean proporcionales

### Urban Self Storage Projects SL
- COO: Miki
- App interna: Python + pywebview, SQLite, AutoCAD via LISP, PDFs
- Mercados: España (~70% cuota), Portugal, Suiza, Francia, Italia

### Volta Grup
- Web: voltagrup.com (Nginx en Hetzner, HTTPS)
- Email: ImprovMX forwarding

---

## ROADMAP REAL HACIA PRODUCTO OPERATIVO (análisis Miki, jun 2026)

### 🔴 BLOQUEANTE — sin esto no se puede cobrar a clientes reales

**1. Cobertura de datos completa (el trabajo más largo)**
- Agente de ingesta BDNS: recorre la API pública de subvenciones (todas las CCAA, provincias y municipios). El mapeador de campos ya está hecho y validado. Falta el agente que recorre la API y carga en Supabase desde el VPS.
- Confirmar/mantener fuentes estatales: prestaciones (SEPE), deducciones (AEAT), bonificaciones (Seg. Social) — determinar si se mantienen solas o necesitan ingesta manual.
- Migración de tabla `ayudas`: añadir campos `provincia` y `comarca`.
- Cruce municipio→comarca para desglose territorial.

**2. Validación legal**
- Texto de consentimiento (hoy borrador) → revisión por abogado
- Contrato DPA (Data Processing Agreement) gestoría↔Cóbratelo
- Revisar que los textos legales cubren el lado B2B

### 🟠 IMPORTANTE — antes de escalar / abrir al público

**3. Navegación territorial**
- Páginas para explorar por estatal / comunidad / provincia / comarca / pueblo
- Depende de que estén los datos del punto 1

**4. Piloto con gestor real**
- Una gestoría real usando el flujo completo durante una semana antes de cobrar
- Todo hasta ahora testeado solo por Miki con su propia cuenta

**5. Rendimiento con volumen**
- La bandeja de matches recalcula relevancia para todos los clientes en cada apertura. Con pocos va en 2s; con cientos hay que ver si aguanta o necesita caché.
- Igual para el motor de vencimientos.

### 🟢 OPERATIVO / NEGOCIO — no es código pero sin esto no hay producto vendible

**6. Onboarding de gestorías** — el manual cubre el "cómo se usa", no el "cómo entra"
**7. Precios y planes publicados** — qué incluye starter vs pro en la web
**8. Canal de soporte** para incidencias de clientes

### ⚪ MENOR / DEUDA TÉCNICA

- Verificar scroll con tablero lleno de expedientes
- Cron de alertas de vencimientos: solo probado en código, no en lunes real
- Comportamiento cuando un cliente pertenece a varias gestorías

### RESUMEN DEL CAMINO MÁS CORTO

El CRM está terminado. Lo que separa el producto del mercado:
1. **Los datos** (cobertura nacional real) — trabajo más largo, determina si sirve a una gestoría de Sevilla o solo de Barcelona
2. **Lo legal** — rápido para un abogado, imprescindible

Con esos dos resueltos, hay producto. El resto se pule con los primeros clientes.
