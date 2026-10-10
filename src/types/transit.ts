/**
 * Tipos de datos para BusRuta Santa Ana
 * Entidades de transporte público, paradas, recorridos y favoritos
 */

export type VerificationStatus = 
  | 'VERIFICADO' 
  | 'PENDIENTE' 
  | 'DESACTUALIZADO' 
  | 'REPORTADO';

export type RouteSense = 'IDA' | 'RETORNO' | 'CIRCULAR';

export interface LatLng {
  lat: number;
  lng: number;
}

export interface BusStop {
  id: string;
  nombre: string;
  descripcion: string; // Referencia geográfica o calle
  lat: number;
  lng: number;
  municipio: string;
  departamento: string;
  pais: string;
  activa: boolean;
  estado_verificacion: VerificationStatus;
  fecha_actualizacion: string;
  rutas: string[]; // Códigos o IDs de las rutas que paran aquí
  destinos_principales: string[];
  fuente_datos: string;
}

export interface BusRouteStop {
  parada_id: string;
  orden: number;
  sentido: RouteSense;
  tiempo_estimado_min?: number;
}

export interface BusRoute {
  id: string;
  codigo: string; // e.g. "51-A"
  nombre: string;
  color: string;
  descripcion: string;
  origen: string;
  destino: string;
  sentidos_disponibles: RouteSense[];
  paradas: BusRouteStop[];
  recorrido_coords: {
    ida: LatLng[];
    retorno?: LatLng[];
  };
  estado_verificacion: VerificationStatus;
  fecha_actualizacion: string;
  activa: boolean;
  horario_aprox?: string;
  tarifa_autorizada?: string;
  fuente_datos: string;
}

export interface FavoriteItem {
  id_local: string;
  tipo: 'parada' | 'ruta';
  elemento_id: string;
  nombre_guardado: string;
  datos_basicos: {
    codigo?: string;
    nombre: string;
    descripcion: string;
    lat?: number;
    lng?: number;
    origen?: string;
    destino?: string;
    rutas_asociadas?: string[];
    paradas_resumen?: string[];
    estado_verificacion: VerificationStatus;
    fecha_actualizacion: string;
  };
  fecha_guardado: string;
}

export type ReportProblemType = 
  | 'parada_mal_ubicada'
  | 'ruta_incorrecta'
  | 'nombre_equivocado'
  | 'recorrido_incompleto'
  | 'parada_inexistente'
  | 'desactualizado'
  | 'otro';

export interface UserReport {
  id: string;
  tipo_elemento: 'parada' | 'ruta' | 'general';
  elemento_id: string;
  nombre_referencia: string;
  tipo_problema: ReportProblemType;
  descripcion: string;
  fecha_creacion: string;
  estado_revision: 'pendiente' | 'revisado' | 'aprobado' | 'descartado';
}

export interface RouteSearchResult {
  ruta: BusRoute;
  parada_origen?: BusStop;
  parada_destino?: BusStop;
  paradas_intermedias: BusStop[];
  sentido: RouteSense;
  distancia_origen_metros?: number;
  distancia_destino_metros?: number;
  coincidencia_explicacion: string;
  confianza: 'ALTA' | 'MEDIA' | 'SUGERIDA';
}
