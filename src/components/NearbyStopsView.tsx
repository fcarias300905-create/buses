import React, { useState } from 'react';
import { BusStop, LatLng } from '../types/transit';
import { calculateDistanceMetros, formatDistance, isFavorite, saveFavorite, removeFavorite } from '../services/storage';
import { SANTA_ANA_POPULAR_LANDMARKS } from '../services/routeSearch';
import { Compass, Navigation2, MapPin, Star, AlertCircle, ArrowUpDown, ChevronRight, Check } from 'lucide-react';

interface NearbyStopsViewProps {
  stops: BusStop[];
  userLocation: LatLng | null;
  onRequestUserLocation: () => void;
  onSelectStop: (stop: BusStop) => void;
}

export const NearbyStopsView: React.FC<NearbyStopsViewProps> = ({
  stops,
  userLocation,
  onRequestUserLocation,
  onSelectStop,
}) => {
  const [selectedReferencePoint, setSelectedReferencePoint] = useState<LatLng | null>(userLocation);
  const [manualZoneName, setManualZoneName] = useState<string>('Ubicación actual');
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() =>
    stops.filter((s) => isFavorite('parada', s.id)).map((s) => s.id)
  );

  const activeReference = userLocation || selectedReferencePoint;

  // Ordenar paradas por distancia al punto de referencia
  const stopsWithDistance = stops.map((stop) => {
    const dist = activeReference
      ? calculateDistanceMetros(activeReference.lat, activeReference.lng, stop.lat, stop.lng)
      : null;
    return { stop, distance: dist };
  });

  if (activeReference) {
    stopsWithDistance.sort((a, b) => (a.distance ?? 999999) - (b.distance ?? 999999));
  }

  const handleToggleFavorite = (stop: BusStop, e: React.MouseEvent) => {
    e.stopPropagation();
    const isFav = favoriteIds.includes(stop.id);
    if (isFav) {
      removeFavorite('parada', stop.id);
      setFavoriteIds((prev) => prev.filter((id) => id !== stop.id));
    } else {
      saveFavorite({
        tipo: 'parada',
        elemento_id: stop.id,
        nombre_guardado: stop.nombre,
        datos_basicos: {
          nombre: stop.nombre,
          descripcion: stop.descripcion,
          lat: stop.lat,
          lng: stop.lng,
          rutas_asociadas: stop.rutas,
          estado_verificacion: stop.estado_verificacion,
          fecha_actualizacion: stop.fecha_actualizacion,
        },
      });
      setFavoriteIds((prev) => [...prev, stop.id]);
    }
  };

  const handleSelectLandmark = (landmark: typeof SANTA_ANA_POPULAR_LANDMARKS[0]) => {
    const matchedStop = stops.find((s) => s.id === landmark.stopId);
    if (matchedStop) {
      setSelectedReferencePoint({ lat: matchedStop.lat, lng: matchedStop.lng });
      setManualZoneName(landmark.nombre);
    }
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-24 md:pb-8">
      {/* Banner de Ubicación y Selección de Referencia */}
      <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Paradas Cercanas</h3>
              <p className="text-xs text-slate-500">
                Punto de referencia:{' '}
                <span className="font-semibold text-blue-600">
                  {userLocation ? 'Tu señal GPS en tiempo real' : manualZoneName}
                </span>
              </p>
            </div>
          </div>

          <button
            onClick={onRequestUserLocation}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs border border-blue-200 transition active:scale-95"
          >
            <Navigation2 className="w-4 h-4 text-blue-600" />
            <span>{userLocation ? 'Actualizar mi GPS' : 'Activar mi GPS'}</span>
          </button>
        </div>

        {/* Aviso de distancia en línea recta */}
        <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <span>
            Las distancias corresponden a la separación geográfica en línea recta (fórmula de Haversine). No deben interpretarse como trayectorias peatonales exactas.
          </span>
        </div>

        {/* Si no tiene GPS activo, dar opciones rápidas para medir desde hitos de Santa Ana */}
        {!userLocation && (
          <div className="mt-3 pt-3 border-t border-slate-100">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
              O mide desde un punto conocido de Santa Ana:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {SANTA_ANA_POPULAR_LANDMARKS.slice(0, 6).map((lm) => (
                <button
                  key={lm.stopId}
                  onClick={() => handleSelectLandmark(lm)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition border ${
                    manualZoneName === lm.nombre
                      ? 'bg-blue-600 text-white border-blue-700'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {lm.nombre.split('(')[0].trim()}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Lista de paradas con distancias */}
      <div className="space-y-2.5">
        {stopsWithDistance.map(({ stop, distance }) => {
          const isFav = favoriteIds.includes(stop.id);
          const isVerified = stop.estado_verificacion === 'VERIFICADO';

          return (
            <div
              key={stop.id}
              onClick={() => onSelectStop(stop)}
              className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md transition cursor-pointer flex items-center justify-between gap-3 group"
            >
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                    isVerified ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'bg-amber-50 text-amber-600 border border-amber-200'
                  }`}
                >
                  <MapPin className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <h4 className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition truncate">
                      {stop.nombre}
                    </h4>
                    {isVerified ? (
                      <span className="px-1.5 py-0.2 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                        Verificada
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.2 rounded-md bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200">
                        Pendiente
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 line-clamp-1 mb-1.5">
                    {stop.descripcion}
                  </p>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-semibold text-slate-400">Rutas:</span>
                    {stop.rutas.map((r) => (
                      <span
                        key={r}
                        className="px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 text-[10px] font-black border border-blue-200"
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {distance !== null && (
                  <div className="text-right">
                    <span className="text-sm font-extrabold text-blue-600 block">
                      {formatDistance(distance)}
                    </span>
                    <span className="text-[10px] text-slate-400">distancia</span>
                  </div>
                )}

                <button
                  onClick={(e) => handleToggleFavorite(stop, e)}
                  className="p-2 rounded-xl text-slate-400 hover:text-amber-500 hover:bg-amber-50 transition"
                  title={isFav ? 'Quitar de favoritos' : 'Guardar en favoritos'}
                >
                  <Star className={`w-4 h-4 ${isFav ? 'fill-amber-500 text-amber-500' : ''}`} />
                </button>

                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
