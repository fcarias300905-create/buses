import React, { useEffect, useState } from 'react';
import { APIProvider, Map, AdvancedMarker, useMap } from '@vis.gl/react-google-maps';
import { BusRoute, BusStop, LatLng, RouteSense } from '../types/transit';
import { MapPin, Navigation2, Layers, AlertCircle, RefreshCw, ZoomIn, ZoomOut, Compass } from 'lucide-react';

interface MapContainerProps {
  stops: BusStop[];
  selectedStop: BusStop | null;
  onSelectStop: (stop: BusStop) => void;
  activeRoute: BusRoute | null;
  activeRouteSense?: RouteSense;
  userLocation: LatLng | null;
  onRequestUserLocation: () => void;
  filterRouteCode?: string;
  isOnline: boolean;
}

// Centro urbano de Santa Ana, El Salvador (Catedral / Parque Libertad)
const SANTA_ANA_CENTER: LatLng = { lat: 13.9942, lng: -89.5597 };

// Componente para trazar el recorrido de la ruta activa en el mapa
function RoutePolylineRenderer({
  path,
  color,
}: {
  path: LatLng[];
  color: string;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map || typeof google === 'undefined' || !google.maps || !path || path.length < 2) {
      return;
    }

    const polyline = new google.maps.Polyline({
      path,
      geodesic: true,
      strokeColor: color || '#2563EB',
      strokeOpacity: 0.9,
      strokeWeight: 6,
      map,
    });

    return () => {
      polyline.setMap(null);
    };
  }, [map, path, color]);

  return null;
}

// Componente para centrar el mapa cuando cambia la selección
function MapRecenter({
  center,
  zoom,
}: {
  center: LatLng | null;
  zoom?: number;
}) {
  const map = useMap();

  useEffect(() => {
    if (map && center) {
      map.panTo(center);
      if (zoom) {
        map.setZoom(zoom);
      }
    }
  }, [map, center, zoom]);

  return null;
}

export const MapContainer: React.FC<MapContainerProps> = ({
  stops,
  selectedStop,
  onSelectStop,
  activeRoute,
  activeRouteSense = 'IDA',
  userLocation,
  onRequestUserLocation,
  filterRouteCode,
  isOnline,
}) => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  const [mapError, setMapError] = useState<string | null>(null);
  const [targetCenter, setTargetCenter] = useState<LatLng | null>(null);
  const [targetZoom, setTargetZoom] = useState<number | undefined>(undefined);
  const [showStopsFilter, setShowStopsFilter] = useState<'all' | 'verified' | 'activeRoute'>('all');

  // Filtrar paradas a mostrar
  const visibleStops = stops.filter((stop) => {
    if (!stop.activa) return false;
    if (filterRouteCode && !stop.rutas.includes(filterRouteCode)) return false;
    if (showStopsFilter === 'verified' && stop.estado_verificacion !== 'VERIFICADO') return false;
    if (showStopsFilter === 'activeRoute' && activeRoute) {
      const stopsInRoute = activeRoute.paradas.map((p) => p.parada_id);
      return stopsInRoute.includes(stop.id);
    }
    return true;
  });

  // Coordenadas del recorrido a pintar si hay ruta activa
  const routePath: LatLng[] = activeRoute
    ? activeRouteSense === 'IDA'
      ? activeRoute.recorrido_coords.ida
      : activeRoute.recorrido_coords.retorno || activeRoute.recorrido_coords.ida
    : [];

  const handleCenterOnUser = () => {
    if (userLocation) {
      setTargetCenter(userLocation);
      setTargetZoom(16);
    } else {
      onRequestUserLocation();
    }
  };

  const handleCenterOnCity = () => {
    setTargetCenter(SANTA_ANA_CENTER);
    setTargetZoom(14);
  };

  // Si no hay conexión o no hay API key disponible, mostramos vista informativa de respaldo
  if (!isOnline) {
    return (
      <div className="relative w-full h-full min-h-[420px] bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-800 mb-2">Modo Sin Conexión Activo</h3>
        <p className="text-sm text-slate-600 max-w-md mb-6">
          El mapa interactivo de Google Maps requiere conexión a internet para cargar su cartografía. Puedes consultar todas tus paradas y rutas guardadas en la pestaña de <strong className="text-blue-600">Favoritos</strong> con información completa y coordenadas.
        </p>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 text-left w-full max-w-md">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Paradas disponibles localmente:</p>
          <div className="max-h-48 overflow-y-auto space-y-2">
            {visibleStops.slice(0, 6).map((s) => (
              <div
                key={s.id}
                onClick={() => onSelectStop(s)}
                className="p-2 text-xs rounded-lg hover:bg-slate-50 cursor-pointer flex items-center justify-between border border-slate-100"
              >
                <span className="font-medium text-slate-800 truncate">{s.nombre}</span>
                <span className="text-slate-400 font-mono text-[11px]">{s.rutas.join(', ')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full min-h-[440px] rounded-2xl overflow-hidden shadow-sm border border-slate-200/80 bg-slate-100">
      {mapError ? (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
          <AlertCircle className="w-12 h-12 text-rose-500 mb-3" />
          <h4 className="font-bold text-slate-800 text-base mb-1">Aviso de carga del mapa</h4>
          <p className="text-sm text-slate-600 max-w-md mb-4">{mapError}</p>
          <button
            onClick={() => setMapError(null)}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition"
          >
            Reintentar carga
          </button>
        </div>
      ) : null}

      {/* Controles flotantes sobre el mapa */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <button
          onClick={handleCenterOnUser}
          title="Centrar en mi ubicación"
          className="p-2.5 bg-white/95 backdrop-blur shadow-md hover:shadow-lg rounded-xl text-slate-700 hover:text-blue-600 border border-slate-200 transition active:scale-95 flex items-center gap-1.5 text-xs font-semibold"
        >
          <Navigation2 className="w-4 h-4 text-blue-600" />
          <span className="hidden sm:inline">Mi Ubicación</span>
        </button>

        <button
          onClick={handleCenterOnCity}
          title="Centrar en el centro de Santa Ana"
          className="p-2.5 bg-white/95 backdrop-blur shadow-md hover:shadow-lg rounded-xl text-slate-700 hover:text-blue-600 border border-slate-200 transition active:scale-95 flex items-center gap-1.5 text-xs font-semibold"
        >
          <Compass className="w-4 h-4 text-emerald-600" />
          <span className="hidden sm:inline">Centro Santa Ana</span>
        </button>
      </div>

      {/* Barra de filtros de mapa superior izquierda */}
      <div className="absolute top-4 left-4 z-10 bg-white/95 backdrop-blur p-1.5 rounded-xl shadow-md border border-slate-200 flex items-center gap-1 text-xs">
        <button
          onClick={() => setShowStopsFilter('all')}
          className={`px-2.5 py-1.5 rounded-lg font-medium transition ${
            showStopsFilter === 'all'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Todas ({stops.length})
        </button>
        <button
          onClick={() => setShowStopsFilter('verified')}
          className={`px-2.5 py-1.5 rounded-lg font-medium transition ${
            showStopsFilter === 'verified'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Solo Verificadas
        </button>
        {activeRoute && (
          <button
            onClick={() => setShowStopsFilter('activeRoute')}
            className={`px-2.5 py-1.5 rounded-lg font-medium transition ${
              showStopsFilter === 'activeRoute'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Ruta {activeRoute.codigo}
          </button>
        )}
      </div>

      {/* Banner de ruta activa */}
      {activeRoute && (
        <div className="absolute bottom-4 left-4 right-4 sm:left-4 sm:right-auto sm:max-w-md z-10 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl shadow-lg border border-slate-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-xs shadow-sm"
              style={{ backgroundColor: activeRoute.color || '#2563EB' }}
            >
              {activeRoute.codigo}
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-800 line-clamp-1">{activeRoute.nombre}</p>
              <p className="text-[11px] text-slate-500">
                Sentido: <span className="font-semibold text-blue-600">{activeRouteSense}</span> • {routePath.length} puntos de recorrido
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Mapa de Google Maps usando @vis.gl/react-google-maps con AdvancedMarker y mapId="DEMO_MAP_ID" */}
      <APIProvider
        apiKey={apiKey}
        language="es"
        region="SV"
        onError={(err) => {
          console.warn('Maps APIProvider notice:', err);
        }}
      >
        <div className="w-full h-full min-h-[440px]">
          <Map
            mapId="DEMO_MAP_ID"
            internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
            defaultCenter={SANTA_ANA_CENTER}
            defaultZoom={14}
            gestureHandling="greedy"
            disableDefaultUI={false}
            className="w-full h-full min-h-[440px]"
          >
            {/* Recentrador dinámico */}
            <MapRecenter center={targetCenter} zoom={targetZoom} />

            {/* Trazo del recorrido de bus activo */}
            {routePath.length > 1 && (
              <RoutePolylineRenderer path={routePath} color={activeRoute?.color || '#2563EB'} />
            )}

            {/* Marcador de ubicación del usuario */}
            {userLocation && (
              <AdvancedMarker position={userLocation}>
                <div className="relative flex items-center justify-center">
                  <div className="absolute w-8 h-8 bg-blue-500/30 rounded-full animate-ping" />
                  <div className="w-5 h-5 bg-blue-600 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full" />
                  </div>
                </div>
              </AdvancedMarker>
            )}

            {/* Marcadores de paradas registradas */}
            {visibleStops.map((stop) => {
              const isSelected = selectedStop?.id === stop.id;
              const isVerified = stop.estado_verificacion === 'VERIFICADO';

              return (
                <AdvancedMarker
                  key={stop.id}
                  position={{ lat: stop.lat, lng: stop.lng }}
                  onClick={() => onSelectStop(stop)}
                >
                  <div
                    className={`cursor-pointer transition-transform duration-200 group flex flex-col items-center ${
                      isSelected ? 'scale-125 z-30' : 'hover:scale-115 z-10'
                    }`}
                  >
                    <div
                      className={`px-2 py-1 rounded-xl shadow-md flex items-center gap-1 text-[11px] font-bold border ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-700 ring-2 ring-blue-300 ring-offset-1'
                          : isVerified
                          ? 'bg-white text-slate-800 border-slate-200'
                          : 'bg-amber-50 text-amber-900 border-amber-200'
                      }`}
                    >
                      <MapPin
                        className={`w-3 h-3 ${
                          isSelected
                            ? 'text-white'
                            : isVerified
                            ? 'text-blue-600'
                            : 'text-amber-600'
                        }`}
                      />
                      <span className="truncate max-w-[90px]">{stop.nombre}</span>
                    </div>
                    {/* Pin tail */}
                    <div
                      className={`w-1.5 h-1.5 rotate-45 -mt-0.5 ${
                        isSelected ? 'bg-blue-600' : isVerified ? 'bg-white' : 'bg-amber-50'
                      }`}
                    />
                  </div>
                </AdvancedMarker>
              );
            })}
          </Map>
        </div>
      </APIProvider>
    </div>
  );
};
