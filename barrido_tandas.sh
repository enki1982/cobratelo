#!/usr/bin/env bash
# barrido_tandas.sh — Lanza el agente BDNS en tandas encadenadas hasta repoblar.
#
# Qué hace:
#   - Ejecuta el agente en tandas de PAGES_POR_TANDA páginas, una tras otra
#     (secuencial: cada tanda espera a que termine la anterior; nunca en paralelo,
#     para no saturar la API de BDNS).
#   - Tras cada tanda, mira cuántas convocatorias NUEVAS guardó. Si una tanda
#     aporta menos de MIN_NUEVAS nuevas, asume que ya está casi todo capturado
#     y PARA solo.
#   - Tope de seguridad: MAX_TANDAS para no correr indefinidamente.
#   - Escribe todo el progreso en barrido_tandas.log, con marcas de inicio/fin
#     de cada tanda y un "BARRIDO COMPLETO" al final.
#
# Uso:   ./barrido_tandas.sh
#   o en segundo plano:   nohup ./barrido_tandas.sh > /dev/null 2>&1 &
#   y vas mirando:        tail -f barrido_tandas.log

cd "$(dirname "$0")" || exit 1
export $(grep -v '^#' .env | xargs)

PAGES_POR_TANDA=200     # páginas por tanda (~10.000 convocatorias)
MAX_TANDAS=10           # tope de tandas (por seguridad)
MIN_NUEVAS=20           # si una tanda trae menos nuevas que esto, paramos
LOG=barrido_tandas.log

echo "================================================================" >> "$LOG"
echo "BARRIDO POR TANDAS — inicio $(date)" >> "$LOG"
echo "================================================================" >> "$LOG"

for tanda in $(seq 1 $MAX_TANDAS); do
    echo "" >> "$LOG"
    echo ">>> TANDA $tanda/$MAX_TANDAS — inicio $(date)" >> "$LOG"

    # Ejecutar una tanda. Sin corte temprano (reprocesa y reactiva vigentes),
    # con tope de páginas por tanda.
    TMPLOG=$(mktemp)
    BDNS_MAX_PAGES=$PAGES_POR_TANDA BDNS_SIN_CORTE=1 python3 bdns_agent.py > "$TMPLOG" 2>&1

    # Volcar el log de la tanda al log general
    cat "$TMPLOG" >> "$LOG"

    # Contar cuántas "201 Created" (inserts nuevos) hubo en esta tanda
    NUEVAS=$(grep -c "201 Created" "$TMPLOG")
    rm -f "$TMPLOG"

    echo ">>> TANDA $tanda terminada $(date) — nuevas (201 Created): $NUEVAS" >> "$LOG"

    if [ "$NUEVAS" -lt "$MIN_NUEVAS" ]; then
        echo "" >> "$LOG"
        echo ">>> La tanda $tanda trajo solo $NUEVAS nuevas (< $MIN_NUEVAS). Parando." >> "$LOG"
        break
    fi
done

echo "" >> "$LOG"
echo "================================================================" >> "$LOG"
echo "BARRIDO COMPLETO — fin $(date)" >> "$LOG"
echo "================================================================" >> "$LOG"
