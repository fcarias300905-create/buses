import { BusRoute, BusStop, FavoriteItem, UserReport } from '../types/transit';
import { INITIAL_BUS_ROUTES, INITIAL_BUS_STOPS } from '../data/initialData';

const STORAGE_KEYS = {
  STOPS: 'busruta_santa_ana_stops_v1',
  ROUTES: 'busruta_santa_ana_routes_v1',
  FAVORITES: 'busruta_santa_ana_favorites_v1',
  REPORTS: 'busruta_santa_ana_reports_v1',
  ADMIN_TOKEN: 'busruta_admin_authenticated',
};

// --- DATA ACCESS: PARADAS ---
export function getStops(): BusStop[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STOPS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.STOPS, JSON.stringify(INITIAL_BUS_STOPS));
      return INITIAL_BUS_STOPS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading stops from storage:', err);
    return INITIAL_BUS_STOPS;
  }
}

export function saveStops(stops: BusStop[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.STOPS, JSON.stringify(stops));
  } catch (err) {
    console.error('Error saving stops to storage:', err);
  }
}

export function getStopById(id: string): BusStop | undefined {
  return getStops().find((s) => s.id === id);
}

// --- DATA ACCESS: RUTAS ---
export function getRoutes(): BusRoute[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ROUTES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.ROUTES, JSON.stringify(INITIAL_BUS_ROUTES));
      return INITIAL_BUS_ROUTES;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading routes from storage:', err);
    return INITIAL_BUS_ROUTES;
  }
}

export function saveRoutes(routes: BusRoute[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ROUTES, JSON.stringify(routes));
  } catch (err) {
    console.error('Error saving routes to storage:', err);
  }
}

export function getRouteById(id: string): BusRoute | undefined {
  return getRoutes().find((r) => r.id === id || r.codigo.toLowerCase() === id.toLowerCase());
}

// --- FAVORITOS (ACCESO LOCAL / SIN CONEXIÓN) ---
export function getFavorites(): FavoriteItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FAVORITES);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading favorites:', err);
    return [];
  }
}

export function saveFavorite(item: Omit<FavoriteItem, 'id_local' | 'fecha_guardado'>): boolean {
  try {
    const current = getFavorites();
    const existingIndex = current.findIndex(
      (f) => f.tipo === item.tipo && f.elemento_id === item.elemento_id
    );

    const now = new Date().toISOString();
    if (existingIndex >= 0) {
      // Ya existe, no duplicar
      return false;
    }

    const newFav: FavoriteItem = {
      ...item,
      id_local: 'fav-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      fecha_guardado: now,
    };

    const updated = [newFav, ...current];
    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('busruta-favorites-updated'));
    return true;
  } catch (err) {
    console.error('Error saving favorite:', err);
    return false;
  }
}

export function removeFavorite(tipo: 'parada' | 'ruta', elementoId: string): boolean {
  try {
    const current = getFavorites();
    const updated = current.filter(
      (f) => !(f.tipo === tipo && f.elemento_id === elementoId)
    );
    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('busruta-favorites-updated'));
    return true;
  } catch (err) {
    console.error('Error removing favorite:', err);
    return false;
  }
}

export function isFavorite(tipo: 'parada' | 'ruta', elementoId: string): boolean {
  return getFavorites().some(
    (f) => f.tipo === tipo && f.elemento_id === elementoId
  );
}

// --- REPORTES ---
export function getReports(): UserReport[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.REPORTS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading reports:', err);
    return [];
  }
}

export function saveReport(report: Omit<UserReport, 'id' | 'fecha_creacion' | 'estado_revision'>): boolean {
  try {
    const current = getReports();
    const newReport: UserReport = {
      ...report,
      id: 'rep-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      fecha_creacion: new Date().toISOString(),
      estado_revision: 'pendiente',
    };
    const updated = [newReport, ...current];
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(updated));
    return true;
  } catch (err) {
    console.error('Error saving report:', err);
    return false;
  }
}

export function updateReportStatus(reportId: string, status: UserReport['estado_revision']): void {
  try {
    const current = getReports();
    const updated = current.map((r) => (r.id === reportId ? { ...r, estado_revision: status } : r));
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(updated));
  } catch (err) {
    console.error('Error updating report status:', err);
  }
}

// --- CÁLCULO DE DISTANCIA HAVERSINE (DISTANCIA GEOGRÁFICA EN METROS) ---
export function calculateDistanceMetros(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Radio de la Tierra en metros
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

// Formatear metros en metros o km
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${meters} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

// --- RESET & BACKUP ---
export function resetDatabaseToDefaults(): void {
  localStorage.setItem(STORAGE_KEYS.STOPS, JSON.stringify(INITIAL_BUS_STOPS));
  localStorage.setItem(STORAGE_KEYS.ROUTES, JSON.stringify(INITIAL_BUS_ROUTES));
}

export function exportDatabaseBackup(): string {
  const payload = {
    exportDate: new Date().toISOString(),
    stops: getStops(),
    routes: getRoutes(),
    reports: getReports(),
    version: '1.0.0',
    city: 'Santa Ana, El Salvador',
  };
  return JSON.stringify(payload, null, 2);
}

export function importDatabaseBackup(jsonString: string): boolean {
  try {
    const data = JSON.parse(jsonString);
    if (Array.isArray(data.stops) && Array.isArray(data.routes)) {
      saveStops(data.stops);
      saveRoutes(data.routes);
      if (Array.isArray(data.reports)) {
        localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(data.reports));
      }
      return true;
    }
    return false;
  } catch (err) {
    console.error('Failed to import backup:', err);
    return false;
  }
}
