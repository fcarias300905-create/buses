import React, { useState } from 'react';
import { BusRoute, BusStop, RouteSense } from '../types/transit';
import { Bus, MapPin, ArrowRightLeft, Star, AlertTriangle, X, CheckCircle2, Clock, DollarSign, Map, ExternalLink } from 'lucide-react';
import { isFavorite, saveFavorite, removeFavorite } from '../services/storage';

interface RouteDetailModalProps {
  route: BusRoute;
  allStops: BusStop[];
  onClose: () => void;
  onSelectStop: (stop: BusStop) => void;
  onViewRouteOnMap: (route: BusRoute, sense: RouteSense) => void;
  onOpenReport: (route: BusRoute) => void;
}

export const RouteDetailModal: React.FC<RouteDetailModalProps> = ({
  route,
  allStops,
  onClose,
  onSelectStop,
  onViewRouteOnMap,
  onOpenReport,
}) => {
  const [currentSense, setCurrentSense] = useState<RouteSense>(route.sentidos_disponibles[0] || 'IDA');
  const [favoriteState, setFavoriteState] = useState(() => isFavorite('ruta', route.id));

  const handleToggleFavorite = () => {
    if (favoriteState) {
      removeFavorite('ruta', route.id);
      setFavoriteState(false);
    } else {
      const stopsSummary = route.paradas
        .filter((p) => p.sentido === currentSense)
        .map((p) => {
          const s = allStops.find((st) => st.id === p.parada_id);
          return s ? s.nombre : p.parada_id;
        });

      saveFavorite({
        tipo: 'ruta',
        elemento_id: route.id,
        nombre_guardado: route.nombre,
        datos_basicos: {
          codigo: route.codigo,
          nombre: route.nombre,
          descripcion: route.descripcion,
          origen: route.origen,
          destino: route.destino,
          paradas_resumen: stopsSummary,
          estado_verificacion: route.estado_verificacion,
          fecha_actualizacion: route.fecha_actualizacion,
        },
      });
      setFavoriteState(true);
    }
  };

  // Paradas de esta ruta en el sentido actual ordenadas
  const routeStops = route.paradas
    .filter((p) => p.sentido === currentSense)
    .sort((a, b) => a.orden - b.orden);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full sm:max-w-xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Encabezado con color de la ruta */}
        <div
          className="p-5 text-white flex items-start justify-between gap-4"
          style={{ backgroundColor: route.color || '#2563EB' }}
        >
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white font-black text-lg border border-white/30 shrink-0">
              {route.codigo}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/20 border border-white/30">
                  {route.estado_verificacion}
                </span>
                <span className="text-[11px] text-white/80">
                  Actualizado: {route.fecha_actualizacion}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold leading-tight drop-shadow-xs">
                {route.nombre}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/20 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selector de Sentido de Circulación */}
        {route.sentidos_disponibles.length > 1 && (
          <div className="bg-slate-100 p-2 flex items-center gap-2 border-b border-slate-200">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider px-2">Sentido:</span>
            {route.sentidos_disponibles.map((sense) => (
              <button
                key={sense}
                onClick={() => setCurrentSense(sense)}
                className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  currentSense === sense
                    ? 'bg-white text-blue-600 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>
                  {sense === 'IDA' ? `Ida (hacia ${route.destino})` : `Retorno (hacia ${route.origen})`}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Contenido scrolleable */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Descripción */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Descripción del recorrido
            </p>
            <p className="text-sm text-slate-700 leading-relaxed font-medium">
              {route.descripcion}
            </p>
          </div>

          {/* Información de Servicio */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {route.horario_aprox && (
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    Horario Estimado
                  </span>
                  <span className="text-xs font-medium text-slate-800">
                    {route.horario_aprox}
                  </span>
                </div>
              </div>
            )}
            {route.tarifa_autorizada && (
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-2.5">
                <DollarSign className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    Tarifa Oficial VMT
                  </span>
                  <span className="text-xs font-medium text-slate-800">
                    {route.tarifa_autorizada}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Paradas de la ruta en orden de circulación */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-blue-600" />
                Secuencia de Paradas ({routeStops.length})
              </h3>
              <span className="text-[11px] text-slate-400">Toca una parada para ver detalles</span>
            </div>

            <div className="relative pl-6 space-y-3 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-blue-200">
              {routeStops.map((rs, idx) => {
                const stopObj = allStops.find((s) => s.id === rs.parada_id);
                const isFirst = idx === 0;
                const isLast = idx === routeStops.length - 1;

                return (
                  <div
                    key={rs.parada_id + '-' + rs.orden}
                    onClick={() => {
                      if (stopObj) onSelectStop(stopObj);
                    }}
                    className="relative flex items-center justify-between p-3 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-xs transition cursor-pointer group"
                  >
                    {/* Indicador de orden circular */}
                    <div
                      className={`absolute -left-6 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black border-2 border-white shadow-xs ${
                        isFirst
                          ? 'bg-emerald-600 text-white'
                          : isLast
                          ? 'bg-rose-600 text-white'
                          : 'bg-blue-600 text-white'
                      }`}
                    >
                      {rs.orden}
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition">
                        {stopObj ? stopObj.nombre : rs.parada_id}
                      </h4>
                      {stopObj && (
                        <p className="text-[11px] text-slate-500 line-clamp-1">
                          {stopObj.descripcion}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {isFirst && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          Inicio
                        </span>
                      )}
                      {isLast && (
                        <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                          Destino
                        </span>
                      )}
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Fuente de los datos */}
          <div className="text-[11px] text-slate-400 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="font-semibold text-slate-500">Fuente: </span>
            {route.fuente_datos}
          </div>
        </div>

        {/* Acciones inferiores */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-2 sm:gap-3 flex-wrap">
          <button
            onClick={() => onViewRouteOnMap(route, currentSense)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition active:scale-95"
          >
            <Map className="w-4 h-4" />
            <span>Ver Recorrido en el Mapa</span>
          </button>

          <button
            onClick={handleToggleFavorite}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition shadow-xs ${
              favoriteState
                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
            }`}
          >
            <Star
              className={`w-4 h-4 ${favoriteState ? 'fill-amber-500 text-amber-500' : 'text-slate-400'}`}
            />
            <span className="hidden sm:inline">{favoriteState ? 'Guardada' : 'Favorito'}</span>
          </button>

          <button
            onClick={() => onOpenReport(route)}
            className="p-2.5 rounded-xl bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-300 transition"
            title="Reportar información incorrecta de la ruta"
          >
            <AlertTriangle className="w-4 h-4 text-slate-400 hover:text-rose-600" />
          </button>
        </div>
      </div>
    </div>
  );
};
