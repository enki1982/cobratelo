function norm(str) {
  return (str || '').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[àáâãä]/g, 'a').replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i').replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u').replace(/ñ/g, 'n').replace(/ç/g, 'c')
    .replace(/[·•]/g, ' ')
}

export function calcularRelevancia(ayuda, perfil) {
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
  const puebloObj = (() => { try { return JSON.parse((perfil.pueblo || ['{}'])[0]) } catch { return {} } })()
  const ccaa      = (perfil.ccaa || [])[0] || puebloObj.ccaa || ''
  const provincia = (perfil.provincia || [])[0] || puebloObj.provincia || ''
  const comarca   = (perfil.comarca || [])[0] || puebloObj.comarca || ''
  const pueblo    = puebloObj.nombre || (perfil.pueblo ? '' : '')

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
  const genero  = (perfil.genero || [])[0] || 'nd'  // 'mujer','hombre','otro','nd'
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
    // Solo filtrar por CCAA si la ayuda tiene una CCAA real conocida (no 'Estatal' ni vacía)
    // Las 'Estatal' son ayudas locales cuya CCAA no pudo determinarse en la ingesta
    // — se filtran más abajo por exclusión textual de otras provincias
    if (ayuda.comunidad_autonoma && ccaa) {
      const ccaaAyuda = norm(ayuda.comunidad_autonoma)
      const ccaaUsuario = norm(ccaa)
      const esEstatal = ccaaAyuda === 'estatal' || ccaaAyuda === ''
      if (!esEstatal && ccaaAyuda !== ccaaUsuario) return 0
    }
  }

  // Exclusión comarcal por ambito
  if (ayuda.ambito === 'comarcal' && comarca) {
    const comarcaNorm = norm(comarca)
    const orgNorm = norm(ayuda.organismo || '')
    if (!t.includes(comarcaNorm) && !orgNorm.includes(comarcaNorm)) return 0
  }

  // Exclusión comarcal por organismo: "Consell Comarcal", "Mancomunidad", "Cabildo" de otra área
  // funciona independientemente del ambito guardado en BD
  if (comarca) {
    const orgNorm = norm(ayuda.organismo || '')
    const comarcaNorm = norm(comarca)
    const esEntidadComarcal = orgNorm.includes('consell comarcal') || orgNorm.includes('consejo comarcal') || orgNorm.includes('mancomunitat') || orgNorm.includes('mancomunidad')
    if (esEntidadComarcal && !orgNorm.includes(comarcaNorm) && !t.includes(comarcaNorm)) return 0
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
    const excluir = OTRAS_PROV[norm(provincia)] || []
    if (excluir.some(p => t.includes(p))) return 0
  }

  // ════════════════════════════════════════════════════════════
  // BLOQUE 1b: FILTROS DE METADATOS IA (enriquecidos por enricher.py)
  // ════════════════════════════════════════════════════════════

  // 1. Ayudas nominativas → nunca para nadie
  if (ayuda.es_nominativa === true || ayuda.es_nominativa === 'true' || ayuda.es_nominativa === 1) return 0

  // Nominativas detectadas por columna es_nominativa del enricher

  // 2. Entidades geográficas específicas → si ninguna coincide con el usuario, excluir
  if (ayuda.entidades_geo && ayuda.entidades_geo.length > 0) {
    const userGeo = [
      norm(pueblo), norm(comarca), norm(provincia), norm(ccaa)
    ].filter(Boolean)
    
    const entNorm = ayuda.entidades_geo.map(e => norm(e)).filter(Boolean)
    const hayCoincidencia = entNorm.some(e => userGeo.some(u => u.includes(e) || e.includes(u)))
    
    if (!hayCoincidencia) return 0
  }

  // 3. Tipo de beneficiario → si la ayuda es exclusiva y el usuario no encaja
  if (ayuda.tipo_beneficiario && ayuda.tipo_beneficiario.length > 0 &&
      !ayuda.tipo_beneficiario.includes('cualquiera')) {
    const situacion = (perfil.situacion || [])
    const esAutonomo = situacion.includes('autonomo')
    const esEmpleado = situacion.includes('empleado')
    const esDes = situacion.includes('desempleado')
    const esPens = situacion.includes('pensionista')
    const esEst = situacion.includes('estudiante')
    const tieneEmpresa = (perfil.extras || []).includes('empresa') || esAutonomo

    const tipos = ayuda.tipo_beneficiario
    if (tipos.includes('autonomo') && !tipos.some(t => ['empleado','persona_fisica','cualquiera'].includes(t))) {
      if (!esAutonomo) return 0
    }
    if (tipos.includes('desempleado') && !tipos.some(t => ['empleado','autonomo','cualquiera'].includes(t))) {
      if (!esDes) return 0
    }
    if (tipos.includes('empresa') && !tipos.some(t => ['autonomo','persona_fisica','cualquiera'].includes(t))) {
      if (!tieneEmpresa) return 0
    }
    if (tipos.includes('estudiante') && !tipos.some(t => ['empleado','autonomo','cualquiera'].includes(t))) {
      if (!esEst) return 0
    }
  }

  // 4. Renta máxima
  if (ayuda.renta_max) {
    const INGRESOS_APROX = { bajo: 6000, medio_bajo: 11000, medios: 22000, alto: 40000 }
    const rentaUsuario = INGRESOS_APROX[(perfil.ingresos||[])[0]] || 0
    if (rentaUsuario > 0 && rentaUsuario > ayuda.renta_max * 1.1) return 0
  }

  // 5. Rango de edad
  if (ayuda.edad_min || ayuda.edad_max) {
    const nac = (perfil.nacimiento||[])[0]
    if (nac) {
      const edad = new Date().getFullYear() - new Date(nac).getFullYear()
      if (ayuda.edad_min && edad < ayuda.edad_min) return 0
      if (ayuda.edad_max && edad > ayuda.edad_max) return 0
    }
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


  // NO DESEMPLEADO — excluir ayudas exclusivas para desempleados
  if (!esDesempleado) {
    if (/capitaliz.*desempleo|pago.?unico.*desempleo|prestaci.*desempleo.*emprender/.test(t)) return 0
    if (/inicio.*actividad.*desempleo|alta.*autonomo.*desempleo|emprender.*desde.*paro/.test(t)) return 0
  }

  // SIN HIJOS — excluir ayudas exclusivas para padres/madres
  if (!tieneHijos) {
    if (/bonificaci.*maternidad|bonificaci.*paternidad|cuota.*maternidad|cuota.*paternidad/.test(t)) return 0
    if (/permiso.*maternidad|permiso.*paternidad|baja.*maternidad|baja.*paternidad/.test(t)) return 0
    if (/conciliaci.*cuidado.*hijo|reduccion.*jornada.*hijo|excedencia.*hijo/.test(t)) return 0
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

  // Género: ayudas específicas para mujeres solo si el perfil es mujer
  const esMujerEspecifica = /\b(mujeres|mujer|femenin[ao]|emprendeduría femenina|emprendimiento femenino)\b/.test(t)
  if (esMujerEspecifica && genero !== 'mujer' && genero !== 'nd') return 0
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
  if ((!familia.includes('dependiente_cargo') && !especial.includes('dependencia')) && /cuidadores? no professionals?|cuidadores? no profesionales?/.test(t)) return 0
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
  if (genero === 'mujer' && esMujerEspecifica) score += 30
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

// 1781015066