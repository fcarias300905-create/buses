import { BusRoute, BusStop, RouteSearchResult } from '../types/transit';
import { calculateDistanceMetros, getRoutes, getStops } from './storage';

export interface SearchQueryParams {
  originText?: string;
  originCoords?: { lat: number; lng: number };
  destinationText?: string;
  destinationCoords?: { lat: number; lng: number };
}

// Lugares conocidos y palabras clave en Santa Ana para autocompletar y resolver
export const SANTA_ANA_POPULAR_LANDMARKS = [
  { nombre: 'UNICAES (Universidad Católica)', stopId: 'stop-unicaes', aliases: ['unicaes', 'catolica', 'universidad catolica'] },
  { nombre: 'UES FMOcc (Facultad Multidisciplinaria)', stopId: 'stop-ues-fmocc', aliases: ['ues', 'nacional', 'multidisciplinaria', 'fmocc'] },
  { nombre: 'Metrocentro Santa Ana', stopId: 'stop-metrocentro', aliases: ['metrocentro', 'los 44', 'centro comercial'] },
  { nombre: 'Hospital San Juan de Dios', stopId: 'stop-hospital-san-juan', aliases: ['hospital san juan', 'san juan de dios', 'hospital nacional'] },
  { nombre: 'Hospital ISSS Santa Ana', stopId: 'stop-hospital-isss', aliases: ['isss', 'seguro social', 'seguro'] },
  { nombre: 'Parque Libertad / Catedral', stopId: 'stop-parque-libertad', aliases: ['parque libertad', 'catedral', 'centro historico', 'teatro'] },
  { nombre: 'Terminal Francisco Lara Pineda', stopId: 'stop-terminal-lara-pineda', aliases: ['terminal', 'lara pineda', 'mercado colon'] },
  { nombre: 'Mercado Central', stopId: 'stop-mercado-central', aliases: ['mercado central', 'parque menendez'] },
  { nombre: 'Estadio Óscar Alberto Quiteño', stopId: 'stop-estadio-quiteno', aliases: ['estadio', 'fas', 'quiteno'] },
  { nombre: 'Colonia Santa Lucía / IVU', stopId: 'stop-colonia-santa-lucia', aliases: ['santa lucia', 'ivu'] },
  { nombre: 'Colonia El Palmar', stopId: 'stop-colonia-el-palmar', aliases: ['el palmar', 'palmar'] },
  { nombre: 'ITCA-FEPADE Santa Ana', stopId: 'stop-itca', aliases: ['itca', 'fepade', 'tecnologico'] },
  { nombre: 'Redondel Monseñor Romero', stopId: 'stop-redondel-romero', aliases: ['monseñor romero', 'redondel', 'entrada santa ana'] },
  { nombre: 'Cantón Primavera', stopId: 'stop-canton-primavera', aliases: ['primavera', 'canton primavera'] },
];

/**
 * Busca las paradas más cercanas a unas coordenadas o que coincidan con un texto
 */
export function findMatchingStops(
  text?: string,
  coords?: { lat: number; lng: number },
  maxResults = 4
): { stop: BusStop; distance?: number }[] {
  const allStops = getStops().filter((s) => s.activa);

  if (coords) {
    // Si tenemos coordenadas GPS precisas
    const withDist = allStops.map((stop) => ({
      stop,
      distance: calculateDistanceMetros(coords.lat, coords.lng, stop.lat, stop.lng),
    }));
    withDist.sort((a, b) => a.distance - b.distance);
    return withDist.slice(0, maxResults);
  }

  if (text && text.trim().length > 0) {
    const query = text.toLowerCase().trim();

    // 1. Revisar si coincide con algún hito popular
    const matchedLandmark = SANTA_ANA_POPULAR_LANDMARKS.find((lm) =>
      lm.aliases.some((alias) => query.includes(alias) || alias.includes(query))
    );

    if (matchedLandmark) {
      const landmarkStop = allStops.find((s) => s.id === matchedLandmark.stopId);
      if (landmarkStop) {
        return [{ stop: landmarkStop, distance: 0 }];
      }
    }

    // 2. Coincidencias en nombre, descripción, rutas o destinos de las paradas
    const scored = allStops
      .map((stop) => {
        let score = 0;
        const nameLower = stop.nombre.toLowerCase();
        const descLower = stop.descripcion.toLowerCase();

        if (nameLower.includes(query)) score += 10;
        if (descLower.includes(query)) score += 5;
        if (stop.destinos_principales.some((d) => d.toLowerCase().includes(query))) score += 7;
        if (stop.rutas.some((r) => r.toLowerCase().includes(query))) score += 4;

        return { stop, score };
      })
      .filter((item) => item.score > 0);

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, maxResults).map((s) => ({ stop: s.stop }));
  }

  return [];
}

/**
 * Motor de búsqueda y recomendación de rutas directas
 */
export function searchRoutes(params: SearchQueryParams): {
  results: RouteSearchResult[];
  originStopsFound: BusStop[];
  destinationStopsFound: BusStop[];
  message: string;
} {
  const allRoutes = getRoutes().filter((r) => r.activa);
  const allStops = getStops();

  const originCandidates = findMatchingStops(params.originText, params.originCoords, 3);
  const destCandidates = findMatchingStops(params.destinationText, params.destinationCoords, 3);

  const originStopsFound = originCandidates.map((c) => c.stop);
  const destinationStopsFound = destCandidates.map((c) => c.stop);

  if (originStopsFound.length === 0 || destinationStopsFound.length === 0) {
    return {
      results: [],
      originStopsFound,
      destinationStopsFound,
      message: 'No se encontraron paradas coincidentes para el origen o destino indicado en Santa Ana. Prueba seleccionando un punto de referencia de la lista.',
    };
  }

  const results: RouteSearchResult[] = [];

  // Recorrer pares de paradas origen y destino
  for (const oCandidate of originCandidates) {
    const oStop = oCandidate.stop;

    for (const dCandidate of destCandidates) {
      const dStop = dCandidate.stop;

      if (oStop.id === dStop.id) continue;

      // Buscar si alguna ruta pasa por ambas paradas
      for (const route of allRoutes) {
        // Analizar en cada sentido disponible
        for (const sentido of route.sentidos_disponibles) {
          const stopsInRoute = route.paradas.filter((p) => p.sentido === sentido);
          const oIndex = stopsInRoute.findIndex((p) => p.parada_id === oStop.id);
          const dIndex = stopsInRoute.findIndex((p) => p.parada_id === dStop.id);

          // Debe subir en origen y bajar en destino en el orden de marcha (oIndex < dIndex)
          if (oIndex >= 0 && dIndex >= 0 && oIndex < dIndex) {
            const intermediateRouteStops = stopsInRoute.slice(oIndex + 1, dIndex);
            const intermediateBusStops = intermediateRouteStops
              .map((rs) => allStops.find((s) => s.id === rs.parada_id))
              .filter((s): s is BusStop => s !== undefined);

            const isVerified = route.estado_verificacion === 'VERIFICADO';
            const numStops = dIndex - oIndex;

            results.push({
              ruta: route,
              parada_origen: oStop,
              parada_destino: dStop,
              paradas_intermedias: intermediateBusStops,
              sentido,
              distancia_origen_metros: oCandidate.distance,
              distancia_destino_metros: dCandidate.distance,
              coincidencia_explicacion: `Aborda en "${oStop.nombre}" y desciende en "${dStop.nombre}" (${numStops} paradas de trayecto).`,
              confianza: isVerified ? 'ALTA' : 'MEDIA',
            });
          }
        }
      }
    }
  }

  // Ordenar resultados: primero verificados, luego menor número de paradas intermedias
  results.sort((a, b) => {
    if (a.confianza === 'ALTA' && b.confianza !== 'ALTA') return -1;
    if (a.confianza !== 'ALTA' && b.confianza === 'ALTA') return 1;
    return a.paradas_intermedias.length - b.paradas_intermedias.length;
  });

  // Eliminar duplicados de la misma ruta en el mismo sentido con las mismas paradas
  const uniqueResults = results.filter((res, index, self) =>
    index === self.findIndex((r) => r.ruta.id === res.ruta.id && r.sentido === res.sentido)
  );

  let message = '';
  if (uniqueResults.length === 0) {
    message = 'No se encontró ninguna ruta directa registrada entre estas paradas en la base de datos de Santa Ana. Por seguridad de los usuarios, no se inventan transbordos automáticos sin confirmación de campo.';
  } else {
    message = `Se encontraron ${uniqueResults.length} ruta(s) directa(s) disponible(s).`;
  }

  return {
    results: uniqueResults,
    originStopsFound,
    destinationStopsFound,
    message,
  };
}
