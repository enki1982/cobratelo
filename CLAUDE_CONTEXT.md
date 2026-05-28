# CLAUDE CONTEXT — Miki (actualizado mayo 2026)

> Lee este archivo al inicio de cualquier conversación nueva para ponerte al día sin preguntar.

## MENSAJE DE INICIO PARA NUEVA CONVERSACIÓN

Pega esto exactamente al abrir una conversación nueva con Claude:

```
Lee el archivo CLAUDE_CONTEXT.md del repo https://github.com/enki1982/cobratelo rama main — haz un web_fetch directo al raw para asegurarte de leer la versión más reciente. Una vez leído, clona el repo en /home/claude/cobratelo para tener acceso al mecanismo .hetzner-cmd. Antes de proponer nada, asegúrate de tener en cuenta tanto los pendientes técnicos como los estratégicos del documento.
```

**Por qué funciona así:**
- `web_fetch` al raw garantiza la versión actual, sin caché
- Clonar el repo activa el mecanismo `.hetzner-cmd` para ejecutar comandos en el VPS
- La frase final sobre "técnico y estratégico" evita que Claude vaya directo al VPS check ignorando el contexto de Laborai, AEAT y el bot

---

---

## QUIÉN ES MIKI

- **Nombre:** Miki, 43 años, Mataró (Barcelona)
- **Rol principal:** COO de Urban Self Storage Projects SL (urbanss.es)
- **Holding personal:** Volta Grup (voltagrup.com) — advisory y proyectos propios
- **Perfil:** Emprendedor serial, técnico-estratégico, construye él mismo los proyectos digitales con Claude como colaborador técnico

---

## PROYECTOS ACTIVOS

### 1. COBRATELO.ES — Plataforma de ayudas públicas

**URLs:**
- Producción: https://www.cobratelo.es
- Vercel preview: cobratelo-five.vercel.app

**Repositorio GitHub:** https://github.com/enki1982/cobratelo (rama `main`)

**Stack:**
- Frontend: Next.js desplegado en Vercel
- Base de datos: Supabase (`pcuomumijpzgatpfgtyo.supabase.co`)
- Pagos: Stripe
- Email: Forward Email (SMTP configurado)
- Servidor agente: Hetzner VPS (`46.224.184.13`)

**Variables de entorno Vercel (configuradas):**
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

**Supabase — tablas principales:**
- `usuarios` — perfiles, planes, suscripciones
- `ayudas` — base de datos de ayudas públicas (sincronizada desde SQLite Hetzner)
- `informes` — informes generados

**Agente VPS (Hetzner):**
- Ruta: `/root/ayuda-es-agent/`
- Base de datos SQLite local con ~218 ayudas
- El agente busca, scrape y sincroniza ayudas a Supabase
- Script ampliación CCAA: `/root/ayuda-es-agent/ampliar_fuentes.py`

**Google Search Console:** verificado `sc-domain:cobratelo.es`, sitemap enviado

---

### 2. BOT DE TRADING — BTC/USDC en Binance Spot

**Servidor:** Hetzner VPS `46.224.184.13`

**Ruta del bot:** `/opt/bot/auto_trader_bot_v1/`

**Archivos clave:**
- `main.py` — punto de entrada
- `core/execution.py` — lógica de ejecución de órdenes (aquí está el fix de fees)
- `core/orchestrator.py` — orquestador principal
- `core/strategies.py` — estrategias
- `core/risk.py` — gestión de riesgo

**Servicio systemd:** `auto-trader-bot.service`
- Arrancar: `systemctl start auto-trader-bot.service`
- Parar: `systemctl stop auto-trader-bot.service`
- Reiniciar: `systemctl restart auto-trader-bot.service`
- Logs: `journalctl -u auto-trader-bot.service --no-pager -n 30`

**Control Telegram:** `/opt/bot/auto_trader_bot_v1/core/telegram_control.py`

**Dashboard live:** https://voltagrup.com/trading.html

**Fix aplicado (mayo 2026):** `core/execution.py` línea ~431
- Bug: el bot intentaba vender `0.00019000 BTC` pero Binance solo tenía `0.00018994` (diferencia = fees de la compra)
- Fix: antes del submit SELL, si `free_base < normalized_qty`, se capea la qty al balance real flooreado a 5 decimales

**Estado tras el fix:**
- `RECONCILE_OK`, `IN_POSITION qty=0.00018994`
- Win rate actual: 28.6% (18 de 63 trades)
- PnL total: +0.28 USDC (capital ~90 USDC — demasiado pequeño para ser significativo)

---

### 3. VOLTA GRUP — Holding personal

- Web: https://voltagrup.com (Nginx en Hetzner, HTTPS)
- Email: ImprovMX forwarding
- LinkedIn company page: activa

---

### 4. URBAN SELF STORAGE PROJECTS SL

- Web: urbanss.es
- COO: Miki
- Mercados: España (~70% cuota), Portugal, Suiza, Francia, Italia
- Fabricante: Jinka (filial)
- Aplicación interna: Python + pywebview (presupuestos, AutoCAD via LISP, SQLite, PDFs)

---

## ACCESO A HETZNER VPS (46.224.184.13)

**Mecanismo de acceso desde Claude:**

Claude no puede hacer SSH directo (puerto 22 bloqueado por whitelist de red).
El acceso se hace a través de **GitHub Actions** via el repo `enki1982/cobratelo`:

1. Escribir el comando a ejecutar en `.hetzner-cmd`
2. Hacer commit y push a `main`
3. El workflow `.github/workflows/hetzner.yml` se dispara automáticamente
4. Ejecuta el comando via `appleboy/ssh-action@v1.0.3` en el servidor
5. El output aparece en GitHub → Actions → último run → paso "Ejecutar en Hetzner"

**Ejemplo de uso:**
```bash
# En Claude:
cat > /home/claude/cobratelo/.hetzner-cmd << 'HCMD'
echo "hola desde Hetzner"
ls /root/
HCMD

cd /home/claude/cobratelo && git add .hetzner-cmd && git commit -m "ops: descripción" && git push
```

**Rutas importantes en el servidor:**
- `/root/ayuda-es-agent/` — agente cobratelo
- `/root/ayuda-es-agent/.env` — variables de entorno del agente
- `/opt/bot/auto_trader_bot_v1/` — bot de trading
- `/opt/bot/auto_trader_bot_v1/core/` — módulos del bot
- `/opt/bot/auto_trader_bot_v1/venv/` — entorno virtual Python

**Nota sobre scripts Python via hetzner-cmd:**
Los heredocs anidados fallan por conflictos de quoting. Solución: codificar el script en base64 y decodificarlo en el servidor:
```bash
echo "BASE64_AQUI" | base64 -d > /tmp/script.py && python3 /tmp/script.py
```

---

## GITHUB — REPOS Y ACCESO

- **cobratelo:** https://github.com/enki1982/cobratelo
- **Secrets configurados en cobratelo:** `HETZNER_HOST`, `HETZNER_USERNAME`, `HETZNER_KEY`, `VERCEL_TOKEN`, `HETZNER_API_TOKEN`, `FORWARD_EMAIL_API`, `STRIPE_API_KEY`

Claude puede hacer push al repo directamente desde `/home/claude/cobratelo/` en el entorno de herramientas.

---

## SERVICIOS CONECTADOS (MCP)

- **Gmail** → gmailmcp.googleapis.com
- **Google Drive** → drivemcp.googleapis.com
- **Stripe** → mcp.stripe.com
- **Claude in Chrome** → browser automation activo

---

## PENDIENTES COBRATELO (mayo 2026)

- [ ] Verificar que agente VPS añadió ayudas de Valencia, PV, ICO tras fix
- [ ] Sincronización SQLite → Supabase de ayudas nuevas
- [ ] Panel multi-cliente gestorías (feature Pro 399€/mes, no implementada)
- [ ] Alertas email cuando aparecen ayudas nuevas para el perfil del usuario
- [ ] Backfill URLs — 24 ayudas sin URL oficial
- [ ] Revisar Google Search Console (indexación tras envío sitemap)
- [ ] Aplicar mejoras UI inspiradas en Holded (scroll analizado, conclusiones pendientes de implementar)

---

## BOT TRADING — FIX APLICADO (mayo 2026)

**Bug corregido:** `core/execution.py` línea ~431

El bot compraba BTC y luego no podía cerrar la posición porque Binance descontaba las fees del BTC recibido. El bot intentaba vender `0.00019000` pero Binance solo tenía `0.00018994` (diferencia = fees de compra). Binance devolvía "insufficient balance" y el bot quedaba bloqueado en loop HALT.

**Fix:** Antes del submit SELL, si `free_base < normalized_qty`, la cantidad se capa al balance real flooreado a 5 decimales. Se loguea como `FEE_ADJUST SELL capped`.

**Estado post-fix:** `RECONCILE_OK`, `IN_POSITION qty=0.00018994`, bot operativo.

**Reflexión sobre rendimiento:** Con ~90 USDC de capital y 0.50% de fees round-trip, el bot es matemáticamente casi inviable. El TP actual (~0.35%) no cubre las fees (0.50%). Para resultados reales se necesita:
- Mínimo ~2.000€ de capital para que las fees sean proporcionalmente pequeñas
- O subir el TP a ≥0.70% para que cada trade ganador cubra varias fees

---

## REFLEXIÓN ESTRATÉGICA — COMPETENCIA (mayo 2026)

**Laborai.es** — plataforma que tramita declaraciones de renta con acceso directo a datos AEAT (Colaborador Social). Sin pedir nada al usuario — acceso fiscal automático.

**Riesgo:** Podrían replicar cobratelo en días (tienen AEAT + gestoría).

**Oportunidad:** Posible colaboración — ellos ponen acceso AEAT + tramitación, cobratelo pone la base de datos de ayudas + motor de matching. Modelo de referido o API con revenue share.

**Moat real de cobratelo:** La base de datos de ayudas curada y estructurada — no es replicable en días, es trabajo editorial continuo.

**Vía AEAT para cobratelo:** Convertirse en Colaborador Social (requiere gestoría) o partnering con una ya registrada.

---

## NOTAS RÁPIDAS

- Miki habla castellano, a veces catalán ("fet!", "halo")
- Le gusta ir directo al grano, sin rodeos
- Prefiere soluciones en un solo push cuando es posible
- El `.hetzner-cmd` es el único canal de acceso al VPS desde Claude
- Las conversaciones largas ralentizan las respuestas — abrir conversación nueva y leer este archivo
- Al clonar el repo en conversación nueva: `git clone https://github.com/enki1982/cobratelo /home/claude/cobratelo`
- Scripts Python via `.hetzner-cmd`: usar base64 para evitar conflictos de quoting en heredocs anidados

---

## DEUDA TÉCNICA — REFACTOR PENDIENTE

Los siguientes archivos han acumulado demasiados parches y deben reescribirse limpios en una sesión dedicada:

- `/root/ayuda-es-agent/agent.py` — prioridad alta, muchos parches sobre parches
- `pages/gestor.js` — CRM construido en capas sucesivas
- `pages/resultados.js` — lógica de caché añadida sobre código original
- `pages/cuenta.js` — múltiples patches de edición inline, envío gestor, etc.

**Criterio:** usar el código actual como referencia funcional, reescribir desde cero limpio, sin perder funcionalidad.
