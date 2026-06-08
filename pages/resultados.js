import Head from 'next/head'
import { C, bgMesh, navStyle } from '../lib/theme'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'

const TIPO_LABEL = {
  prestacion: 'Prestación', subvencion: 'Subvención', deduccion: 'Deducción fiscal',
  servicio: 'Servicio', bonificacion: 'Bonificación', prestamo: 'Préstamo',
}
const TIPO_COLOR = {
  prestacion: 'bg-blue-50 text-blue-700', subvencion: 'bg-orange-50 text-orange-700',
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

  // Ayudas de vehículo para autónomos/pymes — excluir si es solo empleado sin empresa
  if (esEmpleado && !esAutonomo && !esEmprendedor && !tieneEmpresa) {
    if (/autónomos.*pymes|pymes.*autónomos|autónomo.*empresa|empresa.*autónomo/.test(t)) return 0
    if (/menos.*10.*empleados|empresa.*empleados|negocio.*electrico|pymes.*electri/.test(t)) return 0
  }

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

function AyudaCard({ ayuda, esNueva, onEnviarGestor }) {
  const [expandida, setExpandida] = useState(false)
  const importe = ayuda.importe_max || ayuda.importe_min
  const estadoColor = { abierta: '#4ade80', permanente: '#60a5fa', pendiente: '#f59e0b', cerrada: 'rgba(255,245,235,0.3)' }[ayuda.estado] || 'rgba(255,245,235,0.3)'

  return (
    <div style={{ background: 'rgba(255,200,120,0.04)', border: `1px solid ${esNueva ? 'rgba(255,131,0,0.4)' : 'rgba(255,200,120,0.12)'}`, borderRadius: 16, overflow: 'hidden', transition: 'border-color 0.2s' }}>
      {esNueva && (
        <div style={{ background: 'rgba(255,131,0,0.15)', padding: '4px 16px' }}>
          <span style={{ fontSize: 10, color: '#FF8300', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>✨ Nueva esta semana</span>
        </div>
      )}
      <div style={{ padding: '16px 20px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}
        onClick={() => setExpandida(!expandida)}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: estadoColor, textTransform: 'uppercase', letterSpacing: '0.5px' }}>● {ayuda.estado}</span>
            {ayuda.tipo && <span style={{ fontSize: 10, color: 'rgba(255,245,235,0.3)', background: 'rgba(255,255,255,0.04)', padding: '2px 8px', borderRadius: 100 }}>{ayuda.tipo}</span>}
          </div>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#FFF5EB', margin: 0, lineHeight: 1.3, marginBottom: 4 }}>{ayuda.nombre}</h3>
          <p style={{ fontSize: 12, color: 'rgba(255,245,235,0.45)', margin: 0 }}>{ayuda.organismo}</p>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          {importe > 0 && (
            <p style={{ fontSize: 18, fontWeight: 800, color: '#FF8300', margin: 0 }}>
              {importe >= 1000 ? `${(importe/1000).toFixed(0)}K€` : `${importe}€`}
            </p>
          )}
          {ayuda.importe_descripcion && !importe && (
            <p style={{ fontSize: 12, color: '#FF8300', margin: 0 }}>{ayuda.importe_descripcion}</p>
          )}
          <span style={{ fontSize: 12, color: 'rgba(255,245,235,0.3)' }}>{expandida ? '▲' : '▼'}</span>
        </div>
      </div>
      {expandida && (
        <div style={{ padding: '0 20px 20px', borderTop: '1px solid rgba(255,200,120,0.08)' }}>
          {ayuda.descripcion && (
            <p style={{ fontSize: 13, color: 'rgba(255,245,235,0.6)', lineHeight: 1.6, margin: '16px 0 12px' }}>{ayuda.descripcion}</p>
          )}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
            {ayuda.url_oficial && (
              <a href={ayuda.url_oficial} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 13, color: '#FF8300', background: 'rgba(255,131,0,0.1)', border: '1px solid rgba(255,131,0,0.3)', padding: '8px 16px', borderRadius: 100, textDecoration: 'none', fontWeight: 600 }}>
                Ver convocatoria oficial →
              </a>
            )}
            <button onClick={e => { e.stopPropagation(); onEnviarGestor() }}
              style={{ fontSize: 13, color: 'rgba(255,245,235,0.5)', background: 'transparent', border: '1px solid rgba(255,200,120,0.15)', padding: '8px 16px', borderRadius: 100, cursor: 'pointer' }}>
              Enviar a gestoría
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Resultados() {
  const router = useRouter()
  const [ayudas, setAyudas] = useState([])
  const [userPlan, setUserPlan] = useState('free')
  const [userId, setUserId] = useState(null)
  const [ayudasNuevas, setAyudasNuevas] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [sessionChecked, setSessionChecked] = useState(false)
  const [sinSesion, setSinSesion] = useState(false)
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
        const { data } = await supabase.from('usuarios').select('plan, perfil').eq('id', session.user.id).single()
        if (data?.plan) setUserPlan(data.plan)
        setUserId(session.user.id)
        setSessionChecked(true)
        // Si no hay perfil en URL, cargar desde BD
        if (!router.query.perfil && data?.perfil && Object.keys(data.perfil).length > 0) {
          setPerfil(data.perfil)
        }
      } else {
        setSinSesion(true)
        setSessionChecked(true)
        setLoading(false)
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
    if (perfil !== null && userId) fetchAyudas(userId)
    else if (sessionChecked && !userId) setLoading(false)
  }, [perfil, userId, sessionChecked])

  const fetchAyudas = async (userId) => {
    try {
      // 1. Comprobar caché en Supabase
      const { data: usuario } = await supabase
        .from('usuarios')
        .select('ayudas_calculadas')
        .eq('id', userId)
        .single()

      const idsCache = usuario?.ayudas_calculadas

      if (idsCache && idsCache.length > 0) {
        // Caché hit: cargar solo esas ayudas por ID (rápido)
        const { data } = await supabase
          .from('ayudas')
          .select('id,nombre,descripcion,palabras_clave,organismo,ambito,comunidad_autonoma,slug,tipo,estado,importe_min,importe_max,importe_descripcion,url_oficial,fecha_fin,created_at')
          .in('id', idsCache)

        const ordenadas = idsCache.map(id => (data || []).find(a => a.id === id)).filter(Boolean)
        setAyudas(ordenadas)
      } else {
        // Sin caché: cargar todas y calcular en el cliente
        const { data } = await supabase
          .from('ayudas')
          .select('id,nombre,descripcion,palabras_clave,organismo,ambito,comunidad_autonoma,slug,tipo,estado,importe_min,importe_max,importe_descripcion,url_oficial,fecha_fin,created_at')
          .in('estado', ['abierta', 'permanente', 'pendiente'])

        const conScore = (data || [])
          .map(a => ({ ...a, _score: calcularRelevancia(a, perfil) }))
          .filter(a => a._score >= 40)
          .sort((a, b) => b._score - a._score)
          .slice(0, 20)

        setAyudas(conScore)

        // Guardar IDs en caché para próximas visitas (en background, sin bloquear)
        if (conScore.length > 0) {
          supabase.from('usuarios')
            .update({ ayudas_calculadas: conScore.map(a => a.id) })
            .eq('id', userId)
            .then(() => {})
        }
      }

      // Detectar ayudas nuevas vs las ya vistas
      const storageKey = 'cobratelo_ayudas_vistas'
      try {
        const vistasRaw = localStorage.getItem(storageKey)
        const vistasAntes = vistasRaw ? new Set(JSON.parse(vistasRaw)) : null
        setAyudas(prev => {
          if (vistasAntes && vistasAntes.size > 0) {
            const nuevas = new Set(prev.map(a => a.id).filter(id => !vistasAntes.has(id)))
            setAyudasNuevas(nuevas)
          }
          localStorage.setItem(storageKey, JSON.stringify(prev.map(a => a.id)))
          return prev
        })
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
    try {
      const res = await fetch('/api/enviar-gestor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailGestor: perfil.email_gestoria,
          nombreCliente: perfil.nombre || 'Su cliente',
          ayudas,
          perfil,
        })
      })
      if (res.ok) {
        setEmailEnviado(true)
      } else {
        alert('Error al enviar. Inténtalo de nuevo.')
      }
    } catch {
      alert('Error al enviar.')
    } finally {
      setEnviando(false)
    }
  }

  // Sin sesión — mostrar registro obligatorio
  if (sessionChecked && sinSesion) {
    const returnUrl = typeof window !== 'undefined' ? encodeURIComponent(window.location.href) : ''
    return (
      <div style={{ background: '#321A00', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ background: '#2a1500', border: '1px solid rgba(255,131,0,0.25)', borderRadius: 24, padding: '48px 40px', maxWidth: 420, width: '100%', textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,131,0,0.1)', border: '1px solid rgba(255,131,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, margin: '0 auto 24px' }}>🔒</div>
          <h2 className="font-display font-bold" style={{ fontSize: 24, color: '#f0f0f5', letterSpacing: '-0.5px', marginBottom: 12 }}>
            Crea tu cuenta gratuita
          </h2>
          <p style={{ color: 'rgba(240,240,245,0.6)', fontSize: 15, lineHeight: 1.6, marginBottom: 32 }}>
            Para ver tus ayudas personalizadas necesitas una cuenta. Es gratis y solo tarda 30 segundos.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Link href={'/login?return=' + returnUrl}
              style={{ background: '#FF8300', color: '#000', fontWeight: 700, fontSize: 15, padding: '14px 0', borderRadius: 100, textDecoration: 'none', display: 'block' }}>
              Crear cuenta gratis →
            </Link>
            <Link href={'/login?return=' + returnUrl}
              style={{ background: 'transparent', color: 'rgba(240,240,245,0.5)', fontSize: 14, padding: '10px 0', borderRadius: 100, textDecoration: 'none', display: 'block', border: '1px solid rgba(255,255,255,0.1)' }}>
              Ya tengo cuenta — Entrar
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#321A00] flex items-center justify-center">
        <div className="text-center px-6">
          <div className="w-12 h-12 border-4 border-[#cc5500] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="font-display text-xl text-[#f0f0f5]">Analizando tu perfil...</p>
          <p className="text-sm text-[rgba(240,240,245,0.5)] mt-2">Buscando ayudas para tu situación específica</p>
        </div>
      </div>
    )
  }

  // Agrupar ayudas por estado
  const ayudasAbiertas = ayudas.filter(a => a.estado === 'abierta')
  const ayudasOtras = ayudas.filter(a => a.estado !== 'abierta')
  const importeTotal = ayudas.reduce((acc, a) => acc + (a.importe_max || a.importe_min || 0), 0)

  return (
    <>
      <Head>
        <title>Tus ayudas — Cóbratelo</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div style={{ background: '#321A00', minHeight: '100vh' }}>

        {/* ── NAV CRM ── */}
        <nav style={{ background: 'rgba(50,26,0,0.95)', borderBottom: '1px solid rgba(255,200,120,0.12)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 50 }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Link href="/" style={{ fontWeight: 700, fontSize: 17, color: '#FFF5EB', textDecoration: 'none', letterSpacing: '-0.3px' }}>
              cóbratelo<span style={{ color: '#FF8300' }}>.es</span>
            </Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Link href="/perfil" style={{ fontSize: 13, color: 'rgba(255,245,235,0.5)', textDecoration: 'none', padding: '6px 14px', borderRadius: 100, border: '1px solid rgba(255,200,120,0.12)' }}>Editar perfil</Link>
              <Link href="/cuenta" style={{ fontSize: 13, color: '#FFF5EB', textDecoration: 'none', padding: '6px 14px', borderRadius: 100, background: 'rgba(255,131,0,0.15)' }}>Mi cuenta</Link>
            </div>
          </div>
        </nav>

        <div style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(16px,3vw,32px) clamp(12px,3vw,24px) 64px' }}>

          {/* ── KPI HEADER ── */}
          <div className="crm-kpis" style={{ marginBottom: 24 }}>
            <div style={{ background: 'rgba(255,131,0,0.12)', border: '1px solid rgba(255,131,0,0.2)', borderRadius: 16, padding: '20px 24px' }}>
              <p style={{ fontSize: 11, color: 'rgba(255,245,235,0.45)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 6 }}>Ayudas detectadas</p>
              <p style={{ fontSize: 36, fontWeight: 800, color: '#FF8300', lineHeight: 1 }}>{ayudas.length}</p>
            </div>

            <div style={{ background: 'rgba(255,200,120,0.06)', border: '1px solid rgba(255,200,120,0.12)', borderRadius: 16, padding: '20px 24px' }}>
              <p style={{ fontSize: 11, color: 'rgba(255,245,235,0.45)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 6 }}>Abiertas ahora</p>
              <p style={{ fontSize: 36, fontWeight: 800, color: '#FFF5EB', lineHeight: 1 }}>{ayudasAbiertas.length}</p>
            </div>
            {ayudasNuevas.size > 0 && (
              <div style={{ background: 'rgba(255,131,0,0.18)', border: '1px solid rgba(255,131,0,0.35)', borderRadius: 16, padding: '20px 24px' }}>
                <p style={{ fontSize: 11, color: 'rgba(255,245,235,0.45)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 6 }}>Nuevas esta semana</p>
                <p style={{ fontSize: 36, fontWeight: 800, color: '#FF8300', lineHeight: 1 }}>{ayudasNuevas.size}</p>
              </div>
            )}
          <p style={{ fontSize: 11, color: 'rgba(255,245,235,0.25)', textAlign: 'center', marginTop: 32, lineHeight: 1.6 }}>
            Los resultados son orientativos. Verifica siempre los requisitos en la fuente oficial.
          </p>
          </div>

          {/* ── LISTA DE AYUDAS ── */}
          {ayudasAbiertas.length > 0 && (
            <div style={{ marginBottom: 32 }}>
              <p style={{ fontSize: 11, color: 'rgba(255,245,235,0.4)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 16 }}>Abiertas ahora</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {ayudasAbiertas.map(a => <AyudaCard key={a.id} ayuda={a} esNueva={ayudasNuevas.has(a.id)} onEnviarGestor={() => setModalGestor(true)} />)}
              </div>
            </div>
          )}

          {ayudasOtras.length > 0 && (
            <div>
              <p style={{ fontSize: 11, color: 'rgba(255,245,235,0.4)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 16 }}>Otras convocatorias</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {ayudasOtras.map(a => <AyudaCard key={a.id} ayuda={a} esNueva={ayudasNuevas.has(a.id)} onEnviarGestor={() => setModalGestor(true)} />)}
              </div>
            </div>
          )}

        </div>
      </div>
      {/* Modal enviar al gestor */}
      {modalGestor && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-[#2a1500] rounded-3xl w-full max-w-md">
            <div className="px-6 py-5 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between">
              <h3 className="font-semibold text-[#f0f0f5]">Enviar al gestor</h3>
              <button onClick={() => setModalGestor(false)} className="text-[rgba(240,240,245,0.5)] hover:text-[#f0f0f5] text-xl"></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs text-[rgba(240,240,245,0.5)] font-medium uppercase tracking-wide block mb-1.5">Tu nombre (opcional)</label>
                <input type="text" value={nombreCliente} onChange={e => setNombreCliente(e.target.value)}
                  placeholder="Ej: Paco García"
                  className="w-full px-4 py-3 rounded-2xl border-2 border-[rgba(255,255,255,0.08)] focus:outline-none focus:border-[#cc5500] text-[#f0f0f5] transition-colors" />
              </div>
              <div>
                <label className="text-xs text-[rgba(240,240,245,0.5)] font-medium uppercase tracking-wide block mb-1.5">Email del gestor</label>
                <input type="email" value={emailGestor} onChange={e => setEmailGestor(e.target.value)}
                  placeholder="gestor@gestoría.es"
                  className="w-full px-4 py-3 rounded-2xl border-2 border-[rgba(255,255,255,0.08)] focus:outline-none focus:border-[#cc5500] text-[#f0f0f5] transition-colors" />
              </div>
              <p className="text-xs text-[rgba(240,240,245,0.5)]">
                Le enviaremos el listado de tus {ayudas.length} ayudas con los enlaces oficiales y le presentaremos Cóbratelo.es.
              </p>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => setModalGestor(false)}
                className="flex-1 py-3 rounded-full border border-[rgba(255,255,255,0.08)] text-[rgba(240,240,245,0.5)] text-sm">
                Cancelar
              </button>
              <button onClick={enviarAlGestor} disabled={!emailGestor || enviandoGestor}
                className="flex-1 py-3 rounded-full bg-[#2a1500] text-white text-sm font-semibold disabled:opacity-40 hover:bg-[#333330] transition-colors">
                {enviandoGestor ? 'Enviando...' : 'Enviar →'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
