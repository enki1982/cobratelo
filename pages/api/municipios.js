export default async function handler(req, res) {
  const { q } = req.query
  if (!q || q.length < 2) return res.json([])

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_KEY
  if (!apiKey) return res.status(500).json({ error: 'API key no configurada' })

  try {
    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(q)}&types=(cities)&components=country:es&language=es&key=${apiKey}`
    const r = await fetch(url)
    const data = await r.json()

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('Google Places error:', data.status)
      return res.json([])
    }

    const predictions = data.predictions || []

    // Para cada prediction obtenemos los detalles (province, ccaa)
    const resultados = await Promise.all(
      predictions.slice(0, 6).map(async (p) => {
        try {
          const detailUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${p.place_id}&fields=address_components,name&language=es&key=${apiKey}`
          const dr = await fetch(detailUrl)
          const detail = await dr.json()
          const comps = detail.result?.address_components || []

          const get = (type) => comps.find(c => c.types.includes(type))?.long_name || ''

          const nombre = get('locality') || get('sublocality') || get('administrative_area_level_3') || get('administrative_area_level_2') || detail.result?.name || p.structured_formatting?.main_text || ''
          const provincia = get('administrative_area_level_2') || get('administrative_area_level_1') || ''
          const ccaa = get('administrative_area_level_1') || ''
          const comarca = get('administrative_area_level_3') || get('administrative_area_level_2') || ''

          return { nombre, provincia, ccaa, comarca, place_id: p.place_id }
        } catch {
          return {
            nombre: p.structured_formatting?.main_text || p.description,
            provincia: '',
            ccaa: '',
            comarca: '',
            place_id: p.place_id,
          }
        }
      })
    )

    return res.json(resultados.filter(r => r.nombre))
  } catch (e) {
    console.error('Error municipios:', e)
    return res.json([])
  }
}
