import React, { useState } from 'react';
import { BusStop, BusRoute } from '../types/transit';
import { MapPin, Bus, Star, AlertTriangle, Copy, Check, ExternalLink, X, ShieldCheck, Clock } from 'lucide-react';
import { isFavorite, saveFavorite, removeFavorite } from '../services/storage';

interface StopDetailModalProps {
  stop: BusStop;
  routes: BusRoute[];
  onClose: () => void;
  onSelectRoute: (route: BusRoute) => void;
  onOpenReport: (stop: BusStop) => void;
}

export const StopDetailModal: React.FC<StopDetailModalProps> = ({
  stop,
  routes,
  onClose,
  onSelectRoute,
  onOpenReport,
}) => {
  const [copied, setCopied] = useState(false);
  const [favoriteState, setFavoriteState] = useState(() => isFavorite('parada', stop.id));

  const handleCopyCoords = () => {
    navigator.clipboard.writeText(`${stop.lat}, ${stop.lng}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleFavorite = () => {
    if (favoriteState) {
      removeFavorite('parada', stop.id);
      setFavoriteState(false);
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
      setFavoriteState(true);
    }
  };

  // Rutas que pasan por esta parada
  const routesPassing = routes.filter((r) => stop.rutas.includes(r.codigo) || r.paradas.some((p) => p.parada_id === stop.id));

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Encabezado con estado y botón de cierre */}
        <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-4 bg-gradient-to-r from-blue-50/60 to-white">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span
                  className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                    stop.estado_verificacion === 'VERIFICADO'
                      ? 'bg-emerald-100 text-emerald-800'
                      : stop.estado_verificacion === 'PENDIENTE'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {stop.estado_verificacion === 'VERIFICADO' ? '✓ Datos Verificados' : '⚠ ' + stop.estado_verificacion}
                </span>
                <span className="text-[11px] text-slate-400">Actualizado: {stop.fecha_actualizacion}</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
                {stop.nombre}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido scrolleable */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Referencia geográfica */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Referencia / Ubicación
            </p>
            <p className="text-sm text-slate-700 font-medium">
              {stop.descripcion}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {stop.municipio}, {stop.departamento}, {stop.pais}
            </p>
          </div>

          {/* Coordenadas GPS */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Coordenadas GPS
              </span>
              <span className="text-xs font-mono font-bold text-slate-800">
                {stop.lat.toFixed(5)}, {stop.lng.toFixed(5)}
              </span>
            </div>
            <button
              onClick={handleCopyCoords}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 shadow-2xs transition"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Copiadas</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar</span>
                </>
              )}
            </button>
          </div>

          {/* Rutas que pasan por esta parada */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Bus className="w-4 h-4 text-blue-600" />
                Rutas que pasan por aquí ({routesPassing.length})
              </h3>
            </div>

            {routesPassing.length === 0 ? (
              <p className="text-xs text-slate-500 italic p-3 bg-slate-50 rounded-xl">
                No hay rutas registradas asociadas a esta parada actualmente.
              </p>
            ) : (
              <div className="space-y-2">
                {routesPassing.map((route) => (
                  <div
                    key={route.id}
                    onClick={() => onSelectRoute(route)}
                    className="p-3 rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-xs transition cursor-pointer flex items-center justify-between gap-3 bg-white group"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-xs shadow-xs"
                        style={{ backgroundColor: route.color || '#2563EB' }}
                      >
                        {route.codigo}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition">
                          {route.nombre}
                        </h4>
                        <p className="text-[11px] text-slate-500 line-clamp-1">
                          Hacia: {route.destino}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-blue-600 group-hover:translate-x-0.5 transition flex items-center gap-1">
                      Ver <ExternalLink className="w-3 h-3" />
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Destinos principales */}
          {stop.destinos_principales && stop.destinos_principales.length > 0 && (
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Destinos conectados frecuentes
              </p>
              <div className="flex flex-wrap gap-1.5">
                {stop.destinos_principales.map((dest, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100"
                  >
                    {dest}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Fuente de datos */}
          <div className="text-[11px] text-slate-400 p-2.5 rounded-xl bg-slate-50/70 border border-slate-100">
            <span className="font-semibold text-slate-500">Fuente de los datos: </span>
            {stop.fuente_datos || 'Levantamiento de campo Santa Ana'}
          </div>
        </div>

        {/* Botones de acción inferiores */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
          <button
            onClick={handleToggleFavorite}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-xs ${
              favoriteState
                ? 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200'
                : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
            }`}
          >
            <Star
              className={`w-4 h-4 ${favoriteState ? 'fill-amber-500 text-amber-500' : 'text-slate-400'}`}
            />
            <span>{favoriteState ? 'Guardada en Favoritos' : 'Guardar en Favoritos'}</span>
          </button>

          <button
            onClick={() => onOpenReport(stop)}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-300 text-xs font-bold transition"
            title="Reportar información incorrecta"
          >
            <AlertTriangle className="w-4 h-4 text-slate-400 hover:text-rose-600" />
            <span className="hidden sm:inline">Reportar error</span>
          </button>
        </div>
      </div>
    </div>
  );
};
