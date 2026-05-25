#!/bin/bash
# ══════════════════════════════════════════════════════════════
# Cobratelo.es — Deploy agente v2 en Hetzner
# Ejecutar como root: bash deploy.sh
# ══════════════════════════════════════════════════════════════
set -e

DIR="/home/claude/ayuda-es-agent"
LOG="/var/log/ayuda-es-agent.log"

echo ""
echo "══════════════════════════════════════════════════════"
echo "  COBRATELO.ES — Deploy agente v2"
echo "══════════════════════════════════════════════════════"

# 1. Actualizar agente
echo ""
echo "▶ 1. Actualizando agente..."
mkdir -p $DIR
cp agent_v2.py $DIR/agent.py
echo "  ✅ agent.py actualizado"

# 2. Instalar/actualizar dependencias
echo ""
echo "▶ 2. Instalando dependencias..."
pip3 install anthropic supabase python-dotenv --break-system-packages -q
echo "  ✅ Dependencias OK"

# 3. Verificar .env
echo ""
echo "▶ 3. Verificando configuración..."
if [ ! -f "$DIR/.env" ]; then
    echo "  ⚠️  No existe $DIR/.env"
    echo "  Crea el archivo con estas variables:"
    echo ""
    echo "    ANTHROPIC_API_KEY=sk-ant-..."
    echo "    SUPABASE_URL=https://pcuomumijpzgatpfgtyo.supabase.co"
    echo "    SUPABASE_SERVICE_KEY=eyJ..."
    echo ""
    echo "  Luego vuelve a ejecutar: bash deploy.sh"
    exit 1
fi
echo "  ✅ .env encontrado"

# 4. Test de conexión
echo ""
echo "▶ 4. Verificando conexión a Supabase..."
cd $DIR
export $(grep -v '^#' .env | xargs)
python3 -c "
from supabase import create_client
import os
sb = create_client(os.environ['SUPABASE_URL'], os.environ['SUPABASE_SERVICE_KEY'])
r = sb.table('ayudas').select('id').limit(1).execute()
total = sb.table('ayudas').select('*', count='exact').execute()
print(f'  ✅ Supabase OK — {total.count} ayudas en BD')
"

# 5. Actualizar cron
echo ""
echo "▶ 5. Configurando cron..."
touch $LOG
CRON_INGESTA="0 3 * * 1 cd $DIR && export \$(grep -v '^#' .env | xargs) && python3 agent.py ingesta >> $LOG 2>&1"
CRON_BACKFILL="30 3 * * 1 cd $DIR && export \$(grep -v '^#' .env | xargs) && python3 agent.py backfill >> $LOG 2>&1"
(crontab -l 2>/dev/null | grep -v 'ayuda-es\|agent.py'; echo "$CRON_INGESTA"; echo "$CRON_BACKFILL") | crontab -
echo "  ✅ Cron configurado (lunes 3:00 ingesta + 3:30 backfill URLs)"

# 6. Ejecutar backfill inmediato
echo ""
echo "▶ 6. Ejecutando backfill de URLs en las 218 ayudas existentes..."
echo "  (esto puede tardar 5-10 minutos)"
echo ""
python3 agent.py backfill

echo ""
echo "══════════════════════════════════════════════════════"
echo "  ✅ Deploy completado"
echo ""
echo "  Comandos útiles:"
echo "  python3 agent.py backfill   → solo añadir URLs"
echo "  python3 agent.py ingesta    → solo buscar ayudas nuevas"
echo "  python3 agent.py            → todo (ingesta + backfill)"
echo "  tail -f $LOG               → ver logs en tiempo real"
echo "══════════════════════════════════════════════════════"
