import Head from 'next/head'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'

const TIPO_LABEL = {
  prestacion: 'Prestación', subvencion: 'Subvención', deduccion: 'Deducción fiscal',
  servicio: 'Servicio', bonificacion: 'Bonificación', prestamo: 'Préstamo',
}
const TIPO_COLOR = {
  prestacion: 'bg-blue-50 text-blue-700', subvencion: 'bg-green-50 text-green-700',
  deduccion: 'bg-purple-50 text-purple-700', servicio: 'bg-yellow-50 text-yellow-700',
  bonificacion: 'bg-orange-50 text-orange-700', prestamo: 'bg-gray-50 text-gray-700',
}
const IMPORTE_MAX_CIUDADANO = 30000

function formatImporte(min, max, desc, tipo) {
  if (tipo === 'deduccion') return desc && desc.length <= 40 ? desc : 'Deducción fiscal'
  if (max > 0 && max <= IMPORTE_MAX_CIUDADANO) {
    if (min > 0 && min !== max) return `${min.toLocaleString('es-ES')}€ – ${max.toLocaleString('es-ES')}€`
    if (min === max && min > 0) return `${min.toLocaleString('es-ES')}€`
    return `Hasta ${max.toLocaleString('es-ES')}€`
  }
  if (desc && desc.length <= 40) return desc
  return 'Variable'
}

// Normaliza texto quitando acentos y pasando a minúsculas
const norm = s => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

// ── MOTOR DE MATCHING ────────────────────────────────────────────────────────
// Regla fundamental: score empieza en 0. Una ayuda solo aparece si tiene
// al menos un match positivo EXPLÍCITO con el perfil del usuario.
// Score mínimo para aparecer: 30 puntos.
function calcularRelevancia(ayuda, perfil) {
  if (!perfil) return 0

  const situaciones = perfil.situacion || []
  const situacion  = situaciones[0] || ''  // compatibilidad con lógica existente
  const esPensionista  = situaciones.includes('pensionista')
  const esAutonomo     = situaciones.includes('autonomo')
  const esDesempleado  = situaciones.includes('desempleado')
  const esEstudiante   = situaciones.includes('estudiante')
  const esEmpleado     = situaciones.includes('empleado')
  const esEmprendedor  = situaciones.includes('emprendedor')
  // Calcular edad desde fecha de nacimiento o campo edad legacy
  const nacimientoRaw = (perfil.nacimiento || [])[0] || ''
  const edadNum = nacimientoRaw
    ? (() => { const hoy = new Date(); const nac = new Date(nacimientoRaw); let e = hoy.getFullYear() - nac.getFullYear(); if (hoy.getMonth() < nac.getMonth() || (hoy.getMonth() === nac.getMonth() && hoy.getDate() < nac.getDate())) e--; return e })()
    : parseInt((perfil.edad || [])[0]) || 0
  const familia   = perfil.familia || []
  const viviendas = perfil.vivienda || []
  const ingresos  = (perfil.ingresos || [])[0] || ''
  const especial  = perfil.especial || []
  const extras    = perfil.extras || []
  const ccaa      = (perfil.ccaa || [])[0] || ''
  const comarca   = (perfil.comarca || [])[0] || ''
  const puebloObj = (() => { try { return JSON.parse((perfil.pueblo || ['{}'])[0]) } catch { return {} } })()
  const provincia = (perfil.provincia || [])[0] || ''

  const tieneHijos    = familia.some(v => ['hijos_menores3','hijos_3_18','familia_numerosa','monoparental'].includes(v))
  const tieneEmpresa  = extras.some(v => ['pyme','negocio_digital'].includes(v)) || esAutonomo || esEmprendedor
  const tieneVehiculo  = (perfil.vehiculo || []).some(v => v !== 'sin_vehiculo')
  const vehiculos      = perfil.vehiculo || []
  const tieneGasolina  = vehiculos.includes('coche_gasolina')
  const tieneElectrico = vehiculos.includes('coche_electrico')
  const quiereVehiculo = vehiculos.includes('quiero_vehiculo')
  const alquilerDetalle   = (perfil.alquiler_detalle || [])[0] || ''
  const alquilerMes       = alquilerDetalle === 'alquiler_menos300' ? 250
                          : alquilerDetalle === 'alquiler_300_600'  ? 450
                          : alquilerDetalle === 'alquiler_600_900'  ? 750
                          : alquilerDetalle === 'alquiler_900_1200' ? 1050
                          : alquilerDetalle === 'alquiler_mas1200'  ? 1400 : null
  const alquilerCompartido = (perfil.alquiler_compartido || [])[0] || ''
  const esPisoCompartido   = alquilerCompartido === 'alquiler_compis'
  const tieneHipoteca      = viviendas.includes('hipoteca')
  const inmigrante         = especial.includes('inmigrante')
  // Rural: marcado explícitamente O pueblo detectado como pequeño
  const esRural = especial.includes('rural')
  const esAlquiler    = viviendas.includes('alquiler')
  const esPropietario = viviendas.some(v => ['propietario','hipoteca'].includes(v))
  const quiereComprar = viviendas.some(v => ['busco_vivienda','hipoteca'].includes(v))
  const quiereRehabilitacion = viviendas.includes('rehabilitacion')

  // Texto normalizado para matching
  const t = norm(`${ayuda.nombre} ${ayuda.descripcion} ${(ayuda.palabras_clave||[]).join(' ')} ${ayuda.organismo}`)

  let score = 0

  // ════════════════════════════════════════════════════════════
  // BLOQUE 1: FILTROS GEOGRÁFICOS (retornan 0 si no aplica)
  // ════════════════════════════════════════════════════════════

  if (ayuda.ambito === 'autonomico') {
    if (!ccaa) return 0
    if (ayuda.comunidad_autonoma && ayuda.comunidad_autonoma !== ccaa) return 0
  }

  if (['municipal','comarcal'].includes(ayuda.ambito)) {
    if (!provincia) return 0
  }

  // Exclusión por comarca: si la ayuda es comarcal y menciona otra comarca
  if (ayuda.ambito === 'comarcal' && comarca) {
    const comarcaNorm = norm(comarca)
    if (!t.includes(comarcaNorm) && !norm(ayuda.organismo || '').includes(comarcaNorm)) {
      // Solo excluir si hay mención explícita de otra comarca
    }
  }

  // Exclusión textual: si la ayuda menciona otra provincia/comarca en el texto u organismo
  if (provincia) {
    const OTRAS_PROV = {
      'barcelona':   ['tarragones','tarragona','girona','girones','lleida','sevilla','madrid','valencia','zaragoza','malaga','murcia','baix camp','terra alta','priorat','ribera d ebre','alt camp','baix penedes','montsia'],
      'girona':      ['barcelona','tarragona','tarragones','lleida','madrid','sevilla','baix camp','garraf'],
      'tarragona':   ['barcelona','barcelones','girona','girones','lleida','madrid','maresme','garraf','bages'],
      'lleida':      ['barcelona','girona','tarragona','tarragones','madrid','maresme'],
      'madrid_prov': ['barcelona','valencia','sevilla','zaragoza','bilbao','malaga','girona','tarragona'],
      'sevilla':     ['barcelona','madrid','valencia','malaga','granada','cadiz','cordoba','huelva','jaen','almeria','girona'],
      'malaga':      ['barcelona','madrid','sevilla','granada','cadiz','cordoba','huelva','jaen','almeria'],
      'valencia_c':  ['barcelona','alicante','castellon','madrid','tarragona','girona'],
      'alicante':    ['barcelona','valencia','castellon','madrid'],
      'zaragoza':    ['barcelona','madrid','huesca','teruel','lleida','pamplona'],
      'bilbao':      ['barcelona','madrid','donostia','vitoria','pamplona','zaragoza'],
    }
    const excluir = OTRAS_PROV[provincia] || []
    if (excluir.some(p => t.includes(p))) return 0
  }

  // ════════════════════════════════════════════════════════════
  // BLOQUE 2: EXCLUSIONES DURAS (retornan 0 si no aplica)
  // ════════════════════════════════════════════════════════════

  // ── EXCLUSIONES POR SITUACIÓN LABORAL ──────────────────────────

  // PENSIONISTA/JUBILADO — ya tiene su pensión
  if (esPensionista) {
    // Excluir: solicitar/tramitar jubilación o pensión (ya la tiene)
    if (/solicitar.*jubilac|tramitar.*jubilac|acceder.*jubilac|como.*jubilarse|pedir.*jubila|acces.*jubilaci|solicitud.*pension.*jubila|dar.*(se|se).*alta.*jubil/.test(t)) return 0
    // Excluir: inserción laboral, empleo, paro (no aplica)
    if (/insercio|insercion laboral|tarifa plana.*autono|alta.*autono|cuota.*autono|subsidio.*desempleo|prestacion.*desempleo|sepe |erte |paro.*mayores|desempleo.*mayores/.test(t)) return 0
    // Excluir: becas educativas para el propio usuario (sí pueden tener hijos)
    if (/beca mec|beca universitaria|beca.*educacio|beca.*estudis/.test(t) && !extras.includes('estudios_hijos')) return 0
  }

  // PENSIONISTA + VIUDO/A — probablemente ya tiene pensión de viudedad
  if (esPensionista && familia.includes('viudo')) {
    if (/solicitar.*viudedat|solicitar.*viudedad|tramitar.*viudedad|acceder.*viudedad|pension.*viudedad.*solicitu|alta.*viudedad|com.*accedir.*viudedat/.test(t)) return 0
  }

  // EMPLEADO (cuenta ajena, no autónomo)
  if (esEmpleado && !esAutonomo) {
    if (/tarifa plana.*autono|alta.*autono|cuota.*autono/.test(t)) return 0
    if (/subsidio.*desempleo|prestacion.*desempleo/.test(t) && !esDesempleado) return 0
  }

  // AUTÓNOMO EN ACTIVO — ya tiene empresa, excluir ayudas de "empezar"
  if (esAutonomo && !esEmprendedor) {
    if (/ajuda.*primera.*empresa|ayuda.*primera.*empresa|crear.*primera.*empresa|emprender.*desde.*cero|primera.*alta.*autono/.test(t)) return 0
  }
  // Autónomos y pymes pueden contratar — no filtrar subvenciones de contratación

  // DESEMPLEADO — excluir ayudas exclusivas de empleados o autónomos activos
  if (esDesempleado && !esAutonomo && !esEmpleado) {
    if (/tarifa plana|cuota.*autono.*reducida|bonificacion.*cuota.*autono/.test(t)) return 0
  }

  // ESTUDIANTE — excluir jubilación, pensiones contributivas
  if (esEstudiante && !esEmpleado && !esPensionista) {
    if (/jubilacio|jubilacion|pension.*contributiva|pension.*vejez/.test(t)) return 0
  }

  // EMPRENDEDOR (quiere crear empresa, no tiene aún)
  if (esEmprendedor && !esAutonomo) {
    // Puede ver ayudas de emprender, pero no las de "empresa consolidada" grandes importes
    if ((ayuda.importe_max || 0) > 200000 && !tieneEmpresa) return 0
  }

  // ── EXCLUSIONES POR SITUACIÓN FAMILIAR ──────────────────────────

  // SOLTERO/A sin pareja — excluir ayudas exclusivas de familia numerosa o cónyuge
  if (familia.includes('soltero') && !familia.includes('casado')) {
    if (/benefici.*conyuge|conyuge.*beneficiari|parella.*estable.*obligatori/.test(t)) return 0
  }

  // VIUDO/A — no excluir nada extra por ahora, puede ver ayudas para viudas

  // ── EXCLUSIONES POR VIVIENDA ──────────────────────────

  // PROPIETARIO — excluir ayudas de acceso a primera vivienda
  if (esPropietario && !quiereComprar) {
    if (/primer acces|primer acceso|primera habitatge|primera vivienda|comprar.*primera/.test(t)) return 0
  }

  // SIN VIVIENDA ESTABLE — no excluir nada, puede ver todo

  // ── FILTRO DE IMPORTE DE ALQUILER ──────────────────────────
  // Si el usuario sabe cuánto paga, excluir ayudas cuyo tope sea inferior
  if (esAlquiler && alquilerMes !== null) {
    // Detectar topes en el texto: "alquiler máximo Xe/mes", "renta máxima X€", etc.
    // Detectar topes en la descripción normalizada
    const topeMatch = t.match(/(?:alquiler|renda|renta|arrendament|arrendamiento|lloguer)[^0-9]*(?:max|maxim|maximo|maxima)[^0-9]*(\d[\d.]*)/i)
                   || t.match(/(?:max|maxim|maximo|maxima)[^0-9]*(\d[\d.]*)[^0-9]*(?:alquiler|renda|renta|lloguer)/i)
                   || t.match(/renda[^0-9]*maxima[^0-9]*(\d[\d.]*)/i)
                   || t.match(/fins a[^0-9]*(\d[\d.]*)[^0-9]*(?:mes|mensual)/i)
    if (topeMatch) {
      const tope = parseInt(topeMatch[1].replace(/\./g, '').replace(/,/g, '.'))
      // Si el tope detectado es realista (entre 200€ y 2500€) y el usuario paga más → excluir
      if (tope >= 200 && tope <= 2500 && alquilerMes > tope) return 0
    }
    // Patrones específicos conocidos: Bono Alquiler Joven (≤900€)
    if (/bono.*joven|ajut.*jove.*llogu|bono joven alquiler/.test(t) && alquilerMes > 900) return 0
    // Ayudas de habitación (generalmente < 600€): excluir si paga más de 900€
    if (/habitaci[oó]n.*subvencio|ajut.*habitaci[oó]/.test(t) && alquilerMes > 900) return 0
  }

  // ── EXCLUSIONES POR INGRESOS ──────────────────────────

  // Ingresos altos: excluir ayudas orientadas a rentas bajas
  if (ingresos === 'altos') {
    if (/bono social|bo social|ajut emergencia|vulnerabilitat|vulnerabilidad|sense recursos|sin recursos|exclusio social|exclusion social|renda garantida|renta garantizada|pirmi|risga|rmi |b-minc|recursos? limitat|recursos? limitad|renda baixa|renta baja|baixos? recursos|bajos? recursos/.test(t)) return 0
  }
  if (['medios','altos'].includes(ingresos)) {
    if (/ingres minim vital|ingreso minimo vital|imv |renda minima|renta minima/.test(t)) return 0
    if (/pobreza energetica|pobresa energetica|tarifa social gas|bono termico/.test(t)) return 0
  }
  // Ingresos medios/altos: excluir PNC (pensiones no contributivas)
  if (['medios','altos'].includes(ingresos)) {
    if (/pnc |pension no contributiva|pensio no contributiva/.test(t)) return 0
  }

  // Bono social eléctrico: requiere ingresos bajos
  if (/bono social electr|bo social electric/.test(t) && !['sin_ingresos','bajos'].includes(ingresos)) return 0

  // ── EXCLUSIONES POR VIVIENDA ADICIONALES ──────────────────────────

  // Si tiene hipoteca: no excluir nada — puede ver ayudas hipoteca
  // Si es propietario SIN hipoteca: excluir ayudas específicas de hipoteca
  if (esPropietario && !tieneHipoteca) {
    if (/subvencio.*hipoteca|ayuda.*hipoteca|moratoria.*hipoteca|deduccion.*hipoteca/.test(t)) return 0
  }

  // Bono Alquiler Joven: < 35 años, alquiler, renta ≤ 900€
  if (/bono.*alquiler.*joven|bono joven alquiler|ajut.*lloguer.*jove/.test(t)) {
    if (!esAlquiler) return 0
    if (edadNum > 0 && edadNum > 35) return 0
    if (alquilerMes !== null && alquilerMes > 900) return 0
  }

  // ── EXCLUSIONES POR VEHÍCULO ──────────────────────────

  // MOVES: solo si tiene o quiere vehículo eléctrico/híbrido
  if (/moves iii|moves3|pla moves|plan moves/.test(t) && !tieneElectrico && !quiereVehiculo) return 0
  // Plan Renove gasolina/diésel: solo si tiene coche de combustión
  if (/renove.*gasoil|renove.*diesel|renove.*gasolina|pla renove.*combusti/.test(t) && !tieneGasolina) return 0

  // ── EXCLUSIONES POR SITUACIÓN ESPECIAL ──────────────────────────

  // Violencia de género: excluir si no marcado (ya existe pero reforzamos)
  if (!especial.includes('victima_violencia') && /violencia.*genere|violencia.*genero|victima.*violencia|víctima.*violencia/.test(t)) return 0
  // Inmigrante/extranjero: arraigo, permiso residencia
  if (!inmigrante && /arraigo social|arraigo laboral|permis.*residencia|permiso.*residencia|reagrupacion|reagrupacio/.test(t)) return 0
  // Discapacidad específica: PNC invalidez solo si tiene discapacidad sin pensión contributiva
  if (/pnc.*invalidesa|pnc.*invalidez|pension.*invalidez.*no.*contributiva/.test(t)) {
    if (!especial.includes('discapacidad')) return 0
    if (esPensionista) return 0  // ya tiene pensión contributiva
  }

  // ── EXCLUSIONES POR HIJOS ──────────────────────────

  // Guardería/escuela 0-3: solo si tiene hijos < 3 años
  if (/escola bressol|guarderia|escuela infantil|primer cicle.*educac|0.3 anys|0 a 3 anos/.test(t)) {
    if (!familia.includes('hijos_menores3') && !familia.includes('embarazada')) return 0
  }
  // Cheque bebé / bono nacimiento: solo si tiene hijos < 3 o embarazada
  if (/xec nadal|cheque bebe|bono nacimiento|ajut nasciment|ayuda.*nacimiento.*bebe/.test(t)) {
    if (!familia.includes('hijos_menores3') && !familia.includes('embarazada')) return 0
  }
  // Beca comedor: hijos en edad escolar
  if (/beca.*comedor|ajut.*menjador|beca menjador/.test(t)) {
    if (!familia.includes('hijos_3_18') && !familia.includes('hijos_menores3')) return 0
  }
  // Deducción maternidad IRPF: requiere hijo < 3 años Y estar trabajando
  if (/deduccion.*maternidad|deduccio.*maternitat/.test(t)) {
    if (!familia.includes('hijos_menores3')) return 0
    if (!esEmpleado && !esAutonomo) return 0
  }

  // ── EXCLUSIONES POR EDAD ──────────────────────────
  // Edad
  if (edadNum > 0) {
    // Mayores de 65: cubrir variantes sin "de", con +, etc.
    if (/mayor(es)?( de)? 65|65 anys o mes|a partir dels 65|65\+|\+65|65 o mes|a partir de 65|mes de 65|65 anos o mas/.test(t) && edadNum < 65) return 0
    // También si el texto dice explícitamente "jubilado" o "pensionista" como requisito
    if (/dirigid[oa]s? a (jubilad|pensionist)|exclusiv[oa].*pensionist|destinat.*jubilat/.test(t) && !esPensionista) return 0
    if (/menor(es)? de 3[05]|fins a 3[05]|hasta 3[05]|joves? fins|jovens? fins/.test(t) && edadNum >= 35) return 0
    // Garantía Juvenil / programes joves: máximo 30 años (a veces 35)
    if (/garantia juvenil|garantía juvenil|garantia juvenil|ninis|ni estudia ni trabaja|autoocupacio jove|autoocupació jove|programa.*jove.*emprend|jóvenes emprendedor/.test(t) && edadNum > 35) return 0
    // "Joves" o "Jóvenes" como requisito principal (no solo en el nombre del organismo)
    if (/^(?=.*jove[ns]?)(?=.*emprend)/.test(t) && edadNum > 35) return 0
    if (/18.65|menors? de 65|fins als 65/.test(t) && edadNum >= 65) return 0
    if (/36.64|36 a 64|entre 36 i 64/.test(t) && !(edadNum >= 36 && edadNum <= 64)) return 0
  }

  // Familia
  if (!tieneHijos) {
    if (/famili.* nombrosa|familia numerosa|fill a carrec|hijo a cargo|beca.*comedor|menjador escolar|naix|nacimiento|maternit|paternit/.test(t)
        && !familia.includes('embarazada')) return 0
  }
  if (!familia.includes('embarazada') && !familia.includes('hijos_menores3') && /maternit|paternit|naix|nacimiento/.test(t)) return 0
  if (!familia.includes('familia_numerosa') && /familia nombrosa|familia numerosa/.test(t)) return 0
  if (!familia.includes('viudo') && /viudedat|viudedad|viuvez|alarguntzapen/.test(t)) return 0
  if (!familia.includes('monoparental') && /monoparental/.test(t)) return 0
  if ((!familia.includes('dependiente_cargo') && !especial.includes('dependencia')) && /cuidador no professional|cuidador no profesional/.test(t)) return 0
  if ((!tieneHijos || !especial.includes('discapacidad')) && /fill a carrec.*discapacitat|hijo a cargo.*discapacidad/.test(t)) return 0

  // Vivienda
  const esAyAlquiler = /alquiler|arrendatari|lloguer|ajut al lloguer|aluger|alugueiro|alokairu|alokairua/.test(t) && !/propietari/.test(t)
  if (esAyAlquiler && !esAlquiler) return 0
  if (/primer acces|primer acceso|primera habitatge|primera vivienda/.test(t) && !quiereComprar) return 0
  if (/rehabilitac|reforma energet/.test(t) && !esPropietario && !quiereRehabilitacion) return 0

  // Ingresos
  if (ingresos === 'altos' && /vulnerabilitat|vulnerabilidad|risc.*exclusio|riesgo.*exclusion|sense recursos|sin recursos/.test(t)) return 0
  if (['medios','altos'].includes(ingresos) && /ingres minim vital|ingreso minimo vital|imv|renda minima|renta minima/.test(t)) return 0

  // Situaciones especiales
  if (!especial.includes('discapacidad') && /certificat.*discapacitat|certificado.*discapacidad|pnc.*invalidesa|pnc.*invalidez|protesi|protesis|audiofon|audifon/.test(t)) return 0
  if (!especial.includes('dependencia') && !familia.includes('dependiente_cargo') && /grau.*dependencia|grado.*dependencia|situacio.*dependencia|saad|mendekotasuna/.test(t)) return 0
  if (!especial.includes('victima_violencia') && /violencia.*genere|violencia.*genero/.test(t)) return 0
  if (!especial.includes('rural') && /zona rural|despoblacio|municipio rural/.test(t)) return 0
  if (!especial.includes('inmigrante') && /reagrupacio familiar|reagrupacion familiar|permis.*residencia/.test(t)) return 0

  // Vehículo
  if (!tieneVehiculo && /moves|plan renove|vehicle electric|vehiculo electrico/.test(t)) return 0

  // Mascotas
  if (!extras.includes('mascotas') && /mascota|esterilitzacio|esterilizacion|xip.*obligatori|chip.*obligatorio/.test(t)) return 0

  // Empresa/digital
  if (!tieneEmpresa) {
    if (/kit digital|digitalitzacio.*empresa|persona juridica|empresa beneficiaria/.test(t)) return 0
    if ((ayuda.importe_max || 0) > 500000) return 0
  }

  // Becas universitarias
  if (!['estudiante'].includes(situacion) && !extras.includes('estudios_hijos')) {
    if (/beca mec|beca universitaria|beca.*universitat/.test(t)) return 0
  }

  // Gafas/salud específica
  if (!extras.includes('gafas_audifonos') && !especial.includes('discapacidad')) {
    if (/ajuda optica|ayuda optica|gafas.*subvencio/.test(t)) return 0
  }

  // Energía
  if (!extras.includes('energia') && !quiereRehabilitacion) {
    if (/panells solars|paneles solares|aerotermia|bomba.*calor.*subvencio/.test(t)) return 0
  }

  // ════════════════════════════════════════════════════════════
  // BLOQUE 3: BOOSTS POSITIVOS EXPLÍCITOS
  // Una ayuda DEBE ganar al menos 30 puntos para aparecer.
  // Sin match positivo explícito = no aparece.
  // ════════════════════════════════════════════════════════════

  // Variantes lingüísticas adicionales en el texto normalizado:
  // Gallego: xubilacion, desemprego, vivenda, aluger, familia, discapacidade
  // Euskera: erretiro, langabezia, etxebizitza, alokairu, familia, desgaitasuna
  // Valenciano: (comparte con catalán en gran medida)
  // Asturiano: xubilacion, desemplegu, vivienda
  // Los patrones regex ya cubren estas variantes con raíces compartidas

  // ── BOOSTS POR SITUACIÓN LABORAL ──────────────────────────
  // Pensionista: complementos, descuentos, servicios sociales (NO tramitaciones)
  if (esPensionista && /pensio|pension|jubila|xubila|erretiro|gent gran|tercera edat|majors de 65/.test(t)) {
    if (!/solicitar|tramitar|como.*jubil|pedir.*jubil|acceder.*pension|alta.*jubil|primera.*pension/.test(t)) score += 40
  }
  if (esPensionista && familia.includes('viudo') && /viudedat|viudedad|viuvez|alarguntzapen/.test(t)) {
    if (!/solicitar|tramitar|alta.*viude|primer.*viude/.test(t)) score += 35
  }
  if (esAutonomo && /autono|compte.*propi|cuenta.*propia|trabajador.*independiente/.test(t)) score += 40
  if (esDesempleado && /desempleo|atur|paro|sepe|desemprego|langabezia|desemplegu/.test(t)) score += 40
  if (esEstudiante && /beca|estudi/.test(t)) score += 40
  if (esEmprendedor && /emprendedor|startup|nova empresa|nueva empresa|crear.*empresa|primera.*empresa|emprenedoria/.test(t)) score += 40
  if (esEmpleado && !esAutonomo && /treballador.*compte.*ali|trabajador.*cuenta.*ajena|compte.*ali/.test(t)) score += 30

  // Edad
  // Boost mayores 65 solo si tiene 65+
  if (edadNum >= 65 && /gent gran|major|tercera edat|majors|mayor.*65|65.*anys/.test(t)) score += 35
  // Boost jóvenes solo si tiene menos de 35
  if (edadNum < 35 && /jove|joven|garantia juvenil|programa.*jove/.test(t)) score += 35
  // (boost jóvenes ya cubierto arriba con rango ampliado)
  if (edadNum >= 30 && edadNum < 65 && /persones.*36.64|entre 36 i 64/.test(t)) score += 40

  // Familia
  if (tieneHijos && /fill|hijo|familia|seme.alaba|fillos|fillo/.test(t)) score += 25
  if (familia.includes('familia_numerosa') && /nombrosa|numerosa/.test(t)) score += 40
  if (familia.includes('monoparental') && /monoparental/.test(t)) score += 40
  if (familia.includes('viudo') && /viudedad|viudedat/.test(t)) score += 40
  if (familia.includes('embarazada') && /maternit|naix|nacimiento/.test(t)) score += 40
  if (familia.includes('hijos_menores3') && /naix|nacimiento|maternit|paternit/.test(t)) score += 40
  if (familia.includes('dependiente_cargo') && /dependencia|cuidador/.test(t)) score += 35

  // Vivienda
  if (esAlquiler && /lloguer|alquiler|aluger|alokairu|alugueiro/.test(t)) score += 35
  if (quiereComprar && /primer acces|primera vivienda|compra.*vivienda/.test(t)) score += 35
  if (quiereRehabilitacion && /rehabilita|birgaikuntza/.test(t)) score += 35

  // Ingresos bajos
  if (['sin_ingresos','bajos'].includes(ingresos) && /vulnerab|renda baixa|renta baja|imv|minima/.test(t)) score += 30

  // Situaciones especiales
  if (especial.includes('discapacidad') && /discapacitat|discapacidad|discapacidade|desgaitasuna/.test(t)) score += 40
  if (especial.includes('dependencia') && /dependencia/.test(t)) score += 40
  if (especial.includes('victima_violencia') && /violencia/.test(t)) score += 40
  if (especial.includes('rural') && /rural|despoblacio/.test(t)) score += 35

  // Extras
  if (tieneVehiculo && /moves|vehicle electric|vehiculo electrico/.test(t)) score += 35
  if (extras.includes('mascotas') && /mascota|veterinari/.test(t)) score += 35
  if (extras.includes('energia') && /eficiencia energetica|rehabilita|solar/.test(t)) score += 30
  if (tieneEmpresa && /autono|kit digital|digitalitzacio/.test(t)) score += 30
  if (extras.includes('gafas_audifonos') && /optica|gafes|audiofon/.test(t)) score += 35

  // ── BOOSTS ADICIONALES ──────────────────────────

  // Alquiler: boost extra si Bono Alquiler Joven y cumple requisitos
  if (esAlquiler && edadNum > 0 && edadNum <= 35 && alquilerMes !== null && alquilerMes <= 900) {
    if (/bono.*joven|bono joven|ajut.*jove/.test(t)) score += 20
  }

  // Ingresos bajos/sin ingresos: boost para IMV, renta mínima, bono social
  if (['sin_ingresos','bajos'].includes(ingresos)) {
    if (/ingres minim vital|ingreso minimo vital|imv |renda minima|renta minima|pirmi|risga|rmi /.test(t)) score += 40
    if (/bono social|bo social/.test(t)) score += 30
    if (/pobreza energetica|pobresa energetica|tarifa social/.test(t)) score += 30
  }

  // Vehículo eléctrico/híbrido
  if ((tieneElectrico || quiereVehiculo) && /moves|vehicle electric|vehiculo electrico|electri/.test(t)) score += 35
  // Coche de combustión para renovación
  if (tieneGasolina && /renove|pla renove|plan renove/.test(t)) score += 30

  // Guardería / primer ciclo: hijos < 3 años
  if (familia.includes('hijos_menores3') && /escola bressol|guarderia|escuela infantil|0.3 anys/.test(t)) score += 35
  // Becas comedor: hijos escolares
  if ((familia.includes('hijos_3_18') || familia.includes('hijos_menores3')) && /comedor|menjador/.test(t)) score += 35

  // Discapacidad + dependencia: ya boostea, pero añadir variantes
  if (especial.includes('discapacidad') && /discapacitat|discapacidad|discapacidade|desgaitasuna|diversitat funcional/.test(t)) score += 40
  if (especial.includes('dependencia') && /dependencia|saad|dependentzia/.test(t)) score += 40
  if (especial.includes('victima_violencia') && /violencia.*genere|violencia.*genero|victima/.test(t)) score += 40
  if (especial.includes('rural') && /rural|despoblacio|despoblamiento/.test(t)) score += 35
  if (inmigrante && /integracio|integracion|acollida|acogida|arrelament|arraigo/.test(t)) score += 35

  // Hipoteca: deducción, ayudas específicos
  if (tieneHipoteca && /hipoteca|deduccion.*hipotec|subvencio.*hipotec/.test(t)) score += 35

  // CCAA/Provincia match explícito (bonus adicional)
  if (ccaa && ayuda.comunidad_autonoma === ccaa) score += 15
  if (['municipal','comarcal'].includes(ayuda.ambito) && provincia) score += 10

  // (bono social ya cubierto en boosts adicionales arriba)

  return score
}

const FREE_LIMIT = 3 // usado solo como fallback

export default function Resultados() {
  const router = useRouter()
  const [ayudas, setAyudas] = useState([])
  const [userPlan, setUserPlan] = useState('free')
  const [ayudasNuevas, setAyudasNuevas] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [perfil, setPerfil] = useState(null)
  const [totalEstimado, setTotalEstimado] = useState(0)
  const [emailEnviado, setEmailEnviado] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [modalGestor, setModalGestor] = useState(false)
  const [emailGestor, setEmailGestor] = useState('')
  const [nombreCliente, setNombreCliente] = useState('')
  const [envioGestorOk, setEnvioGestorOk] = useState(false)
  const [enviandoGestor, setEnviandoGestor] = useState(false)


  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user?.id) {
        const { data } = await supabase.from('usuarios').select('plan').eq('id', session.user.id).single()
        if (data?.plan) setUserPlan(data.plan)
      }
    })
  }, [])

  useEffect(() => {
    if (!router.isReady) return
    const perfilRaw = router.query.perfil
    if (perfilRaw) {
      try { setPerfil(JSON.parse(decodeURIComponent(perfilRaw))) } catch (e) {}
    }
  }, [router.isReady])

  useEffect(() => {
    if (perfil !== null) fetchAyudas()
  }, [perfil])

  const fetchAyudas = async () => {
    try {
      const { data } = await supabase
        .from('ayudas')
        .select('*')
        .in('estado', ['abierta', 'permanente', 'pendiente'])

      const conScore = (data || [])
        .map(a => ({ ...a, _score: calcularRelevancia(a, perfil) }))
        .filter(a => a._score >= 40)
        .sort((a, b) => b._score - a._score)
        .slice(0, 20)

      setAyudas(conScore)

      // Detectar ayudas nuevas vs las ya vistas
      const storageKey = 'cobratelo_ayudas_vistas'
      try {
        const vistasRaw = localStorage.getItem(storageKey)
        const vistasAntes = vistasRaw ? new Set(JSON.parse(vistasRaw)) : null
        if (vistasAntes && vistasAntes.size > 0) {
          const nuevas = new Set(conScore.map(a => a.id).filter(id => !vistasAntes.has(id)))
          setAyudasNuevas(nuevas)
        }
        // Guardar las actuales como "vistas"
        localStorage.setItem(storageKey, JSON.stringify(conScore.map(a => a.id)))
      } catch {}

    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const enviarAlGestor = async () => {
    if (!emailGestor) return
    setEnviandoGestor(true)
    try {
      const res = await fetch('/api/enviar-gestor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailGestor, nombreCliente, ayudas, perfil })
      })
      if (res.ok) { setEnvioGestorOk(true); setModalGestor(false) }
      else alert('Error al enviar. Inténtalo de nuevo.')
    } catch { alert('Error al enviar.') }
    finally { setEnviandoGestor(false) }
  }

  const enviarAGestoria = async () => {
    if (!perfil?.email_gestoria) return
    setEnviando(true)
    await new Promise(r => setTimeout(r, 1500))
    setEmailEnviado(true)
    setEnviando(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F3EC] flex items-center justify-center">
        <div className="text-center px-6">
          <div className="w-12 h-12 border-4 border-[#1A7A4A] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="font-display text-xl text-[#111110]">Analizando tu perfil...</p>
          <p className="text-sm text-[#888882] mt-2">Buscando ayudas para tu situación específica</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Tus ayudas — Cóbratelo</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-[#F7F3EC]">
        <nav className="px-6 py-4 flex items-center justify-between max-w-3xl mx-auto">
          <Link href="/" className="font-display text-xl font-bold text-[#111110] shrink-0">
            cóbratelo<span className="text-[#1A7A4A]">.es</span>
          </Link>
          <div className="flex items-center gap-3 ml-4 overflow-hidden">
            <Link href="/" className="hidden sm:block text-sm text-[#888882] hover:text-[#111110] transition-colors whitespace-nowrap">Inicio</Link>
            <Link href="/cuenta" className="text-sm text-[#888882] hover:text-[#111110] transition-colors whitespace-nowrap">Mi cuenta</Link>
            <Link href="/perfil" className="text-sm text-[#888882] hover:text-[#111110] transition-colors whitespace-nowrap">← Perfil</Link>
          </div>
        </nav>

        <div className="max-w-3xl mx-auto px-6 pb-20">
          <div className="bg-[#111110] rounded-3xl p-8 mb-6">
            <p className="text-[#888882] text-sm mb-2">Ayudas que encajan con tu perfil</p>
            <div className="flex items-end gap-4 mb-4">
              <span className="font-display text-5xl font-bold text-[#22C55E]">{ayudas.length}</span>
              <span className="text-[#888882] mb-2">ayudas encontradas</span>
            </div>
          </div>



          {/* Bloque gestoría — si quiere una */}
          {(perfil?.gestoria || [])[0] === 'quiero_gestoria' && (() => {
            const puebloObj = (() => { try { return JSON.parse((perfil?.pueblo || ['{}'])[0]) } catch { return {} } })()
            const pueblo = puebloObj.nombre || ''
            const provincia = puebloObj.provincia || ''
            const busqueda = encodeURIComponent(`gestoría asesoría fiscal ${pueblo} ${provincia}`.trim())
            return (
              <div className="bg-[#E8F5EE] border border-[#1A7A4A]/20 rounded-2xl p-5 mb-6">
                <div className="flex items-start gap-3 mb-3">
                  
                  <div>
                    <p className="font-semibold text-[#111110]">Encuentra una gestoría cerca de ti</p>
                    <p className="text-sm text-[#888882] mt-0.5">
                      {pueblo ? `Gestorías en ${pueblo} y alrededores` : 'Tramitar estas ayudas con un gestor aumenta mucho las posibilidades de éxito'}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <a href={`https://www.google.com/maps/search/${busqueda}`}
                     target="_blank" rel="noopener noreferrer"
                     className="flex items-center justify-center gap-2 bg-[#1A7A4A] text-white text-sm font-semibold py-2.5 rounded-full hover:bg-[#145e39] transition-colors">
                    Ver gestorías en Google Maps
                  </a>
                </div>
              </div>
            )
          })()}

          {perfil?.email_gestoria && (
            <div className="bg-[#E8F5EE] border border-[#1A7A4A]/20 rounded-2xl p-5 mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-[#111110] text-sm">Enviar informe a tu gestoría</p>
                <p className="text-xs text-[#888882] mt-0.5">{perfil.email_gestoria}</p>
              </div>
              {emailEnviado ? (
                <span className="text-[#1A7A4A] font-semibold text-sm">✓ Enviado</span>
              ) : (
                <button onClick={enviarAGestoria} disabled={enviando}
                  className="bg-[#1A7A4A] text-white text-sm font-semibold px-4 py-2 rounded-full hover:bg-[#145e39] transition-colors disabled:opacity-60">
                  {enviando ? 'Enviando...' : 'Enviar →'}
                </button>
              )}
            </div>
          )}

          <div className="space-y-4">
            {ayudas.map((ayuda, i) => {
              const limit = (userPlan && userPlan !== 'free') ? 9999 : FREE_LIMIT
              const isBlurred = i >= limit
              return (
                <div key={ayuda.id}
                  className={`ayuda-card bg-white rounded-2xl border p-5 ${isBlurred ? 'relative overflow-hidden' : ''} ${ayudasNuevas.has(ayuda.id) ? 'border-[#1A7A4A] border-2' : 'border-[#E0DAD0]'}`}>
                  {isBlurred && (
                    <div className="absolute inset-0 backdrop-blur-sm bg-white/70 flex flex-col items-center justify-center z-10 rounded-2xl cursor-pointer"
                      onClick={() => document.getElementById('cta-pro')?.scrollIntoView({ behavior: 'smooth' })}>
                      <span className="text-2xl mb-2">🔒</span>
                      <p className="font-semibold text-[#111110] text-sm text-center px-4">
                        {ayudas.length - FREE_LIMIT} ayudas más
                      </p>
                      <span className="mt-2 bg-[#E8540A] text-white text-xs font-semibold px-3 py-1.5 rounded-full">
                        Desbloquear →
                      </span>
                    </div>
                  )}
                   <div className="mb-3">
                     <div className="flex items-center gap-2 flex-wrap mb-1.5">
                       <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TIPO_COLOR[ayuda.tipo] || 'bg-gray-50 text-gray-700'}`}>
                         {TIPO_LABEL[ayuda.tipo] || ayuda.tipo}
                       </span>
                       <span className={`text-xs px-2 py-0.5 rounded-full ${ayuda.estado === 'abierta' ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'}`}>
                         {ayuda.estado === 'abierta' ? '● Abierta' : ayuda.estado}
                       </span>
                       {ayuda.ambito !== 'estatal' && ayuda.comunidad_autonoma && (
                         <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                           {ayuda.comunidad_autonoma}
                         </span>
                       )}
                     </div>
                     <h3 className="font-semibold text-[#111110] leading-snug mb-0.5">{ayuda.nombre}</h3>
                     <p className="text-xs text-[#888882] mb-1">{ayuda.organismo}</p>
                     {formatImporte(ayuda.importe_min, ayuda.importe_max, ayuda.importe_descripcion, ayuda.tipo) && (
                       <p className="font-display text-base font-bold text-[#1A7A4A]">
                         {formatImporte(ayuda.importe_min, ayuda.importe_max, ayuda.importe_descripcion, ayuda.tipo)}
                       </p>
                     )}
                   </div>
                  {ayuda.descripcion && (
                    <p className="text-sm text-[#666660] mb-4 leading-relaxed">{ayuda.descripcion}</p>
                  )}
                  {ayuda.url_oficial && !isBlurred && (
                    <a href={ayuda.url_oficial} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-[#1A7A4A] hover:text-[#145e39] transition-colors">
                      Ver convocatoria oficial →
                    </a>
                  )}
                </div>
              )
            })}
          </div>

          {ayudas.length > FREE_LIMIT && userPlan === 'free' && (
            <div id="cta-pro" className="bg-[#E8540A] rounded-3xl p-8 mt-8 text-center">
              <p className="text-white/80 text-sm mb-1">{ayudas.length - FREE_LIMIT} ayudas más bloqueadas</p>
              <h2 className="font-display text-3xl font-bold text-white mb-2">Cobra todo lo que te toca</h2>
              <p className="text-white/80 mb-6 max-w-sm mx-auto text-sm">
                Accede a todas las ayudas, alertas semanales y envío directo a tu gestoría.
              </p>
              <a href={`/login?redirect=/precios&perfil=${encodeURIComponent(JSON.stringify(perfil))}`}
                className="bg-white text-[#E8540A] font-bold px-8 py-3.5 rounded-full inline-block hover:bg-[#FEF0E8] transition-colors">
                Guardar y desbloquear →
              </a>
              <p className="text-white/60 text-xs mt-3">Cancela cuando quieras</p>
            </div>
          )}

          {ayudas.length === 0 && (
            <div className="text-center py-12">
              <p className="text-4xl mb-4">🔍</p>
              <p className="font-semibold text-[#111110]">No hemos encontrado ayudas específicas para tu perfil</p>
              <p className="text-sm text-[#888882] mt-2">Prueba a revisar tu perfil o ampliar las categorías.</p>
              <Link href="/perfil" className="inline-block mt-4 bg-[#111110] text-[#F7F3EC] px-6 py-3 rounded-full font-semibold text-sm">
                Revisar mi perfil
              </Link>
            </div>
          )}

          <p className="text-xs text-[#B0AAA0] text-center mt-10 leading-relaxed max-w-lg mx-auto">
            Los resultados son orientativos. Verifica siempre los requisitos en la fuente oficial antes de solicitar cualquier ayuda.
          </p>
        </div>
      </div>
    <>
      {/* Modal enviar al gestor */}
      {modalGestor && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md">
            <div className="px-6 py-5 border-b border-[#F0EAE0] flex items-center justify-between">
              <h3 className="font-semibold text-[#111110]">Enviar al gestor</h3>
              <button onClick={() => setModalGestor(false)} className="text-[#888882] hover:text-[#111110] text-xl">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs text-[#888882] font-medium uppercase tracking-wide block mb-1.5">Tu nombre (opcional)</label>
                <input type="text" value={nombreCliente} onChange={e => setNombreCliente(e.target.value)}
                  placeholder="Ej: Paco García"
                  className="w-full px-4 py-3 rounded-2xl border-2 border-[#E0DAD0] focus:outline-none focus:border-[#1A7A4A] text-[#111110] transition-colors" />
              </div>
              <div>
                <label className="text-xs text-[#888882] font-medium uppercase tracking-wide block mb-1.5">Email del gestor</label>
                <input type="email" value={emailGestor} onChange={e => setEmailGestor(e.target.value)}
                  placeholder="gestor@gestoría.es"
                  className="w-full px-4 py-3 rounded-2xl border-2 border-[#E0DAD0] focus:outline-none focus:border-[#1A7A4A] text-[#111110] transition-colors" />
              </div>
              <p className="text-xs text-[#888882]">
                Le enviaremos el listado de tus {ayudas.length} ayudas con los enlaces oficiales y le presentaremos Cóbratelo.es.
              </p>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => setModalGestor(false)}
                className="flex-1 py-3 rounded-full border border-[#E0DAD0] text-[#888882] text-sm">
                Cancelar
              </button>
              <button onClick={enviarAlGestor} disabled={!emailGestor || enviandoGestor}
                className="flex-1 py-3 rounded-full bg-[#111110] text-white text-sm font-semibold disabled:opacity-40 hover:bg-[#333330] transition-colors">
                {enviandoGestor ? 'Enviando...' : 'Enviar →'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
    </>
  )
}
