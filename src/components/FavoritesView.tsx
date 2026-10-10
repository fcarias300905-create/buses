import React, { useState, useEffect } from 'react';
import { FavoriteItem, BusStop, BusRoute } from '../types/transit';
import { getFavorites, removeFavorite, getStopById, getRouteById } from '../services/storage';
import { Star, MapPin, Bus, Trash2, ArrowRight, ExternalLink, WifiOff, Clock, ShieldCheck, AlertCircle } from 'lucide-react';

interface FavoritesViewProps {
  onSelectStop: (stop: BusStop) => void;
  onSelectRoute: (route: BusRoute) => void;
  isOnline: boolean;
}

export const FavoritesView: React.FC<FavoritesViewProps> = ({
  onSelectStop,
  onSelectRoute,
  isOnline,
}) => {
  const [favorites, setFavorites] = useState<FavoriteItem[]>(() => getFavorites());
  const [activeTab, setActiveTab] = useState<'todas' | 'paradas' | 'rutas'>('todas');

  const refreshFavorites = () => {
    setFavorites(getFavorites());
  };

  useEffect(() => {
    const handleUpdated = () => refreshFavorites();
    window.addEventListener('busruta-favorites-updated', handleUpdated);
    return () => window.removeEventListener('busruta-favorites-updated', handleUpdated);
  }, []);

  const handleRemove = (tipo: 'parada' | 'ruta', elementoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeFavorite(tipo, elementoId);
    refreshFavorites();
  };

  const handleOpenItem = (item: FavoriteItem) => {
    if (item.tipo === 'parada') {
      const stop = getStopById(item.elemento_id);
      if (stop) {
        onSelectStop(stop);
      } else {
        // Objeto creado desde los datos básicos guardados offline
        onSelectStop({
          id: item.elemento_id,
          nombre: item.datos_basicos.nombre,
          descripcion: item.datos_basicos.descripcion,
          lat: item.datos_basicos.lat || 13.9942,
          lng: item.datos_basicos.lng || -89.5597,
          municipio: 'Santa Ana',
          departamento: 'Santa Ana',
          pais: 'El Salvador',
          activa: true,
          estado_verificacion: item.datos_basicos.estado_verificacion,
          fecha_actualizacion: item.datos_basicos.fecha_actualizacion,
          rutas: item.datos_basicos.rutas_asociadas || [],
          destinos_principales: [],
          fuente_datos: 'Guardado localmente en favoritos',
        });
      }
    } else {
      const route = getRouteById(item.elemento_id);
      if (route) {
        onSelectRoute(route);
      }
    }
  };

  const filteredFavorites = favorites.filter((f) => {
    if (activeTab === 'paradas') return f.tipo === 'parada';
    if (activeTab === 'rutas') return f.tipo === 'ruta';
    return true;
  });

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-24 md:pb-8">
      {/* Aviso informativo de soporte Offline */}
      <div
        className={`p-4 rounded-2xl border flex items-start gap-3 ${
          !isOnline
            ? 'bg-amber-50 border-amber-200 text-amber-900'
            : 'bg-blue-50/70 border-blue-200/80 text-blue-900'
        }`}
      >
        {!isOnline ? (
          <WifiOff className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        ) : (
          <Star className="w-5 h-5 text-blue-600 fill-blue-500 shrink-0 mt-0.5" />
        )}
        <div className="text-xs">
          <p className="font-bold text-sm mb-0.5">
            {!isOnline ? 'Consulta Offline Disponible' : 'Favoritos Guardados Localmente'}
          </p>
          <p className="text-slate-600">
            Tus paradas y rutas guardadas se almacenan directamente en este dispositivo.
            Puedes consultarlas en cualquier momento aunque no tengas señal móvil o datos de internet en la calle.
          </p>
        </div>
      </div>

      {/* Selector de pestañas */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('todas')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'todas'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Todas ({favorites.length})
        </button>
        <button
          onClick={() => setActiveTab('paradas')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'paradas'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Paradas ({favorites.filter((f) => f.tipo === 'parada').length})
        </button>
        <button
          onClick={() => setActiveTab('rutas')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'rutas'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Rutas ({favorites.filter((f) => f.tipo === 'ruta').length})
        </button>
      </div>

      {/* Lista de Favoritos */}
      {filteredFavorites.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-200">
          <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Star className="w-8 h-8" />
          </div>
          <h4 className="font-bold text-slate-800 text-base mb-1">Aún no tienes favoritos guardados</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
            Explora las paradas en el mapa o busca tus rutas frecuentes para guardarlas aquí y tener acceso inmediato sin conexión.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredFavorites.map((item) => {
            const isParada = item.tipo === 'parada';

            return (
              <div
                key={item.id_local}
                onClick={() => handleOpenItem(item)}
                className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md transition cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`p-2 rounded-xl text-white font-bold text-xs flex items-center justify-center ${
                          isParada ? 'bg-blue-600' : 'bg-emerald-600'
                        }`}
                      >
                        {isParada ? <MapPin className="w-4 h-4" /> : <Bus className="w-4 h-4" />}
                      </span>
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                          {isParada ? 'Parada de Bus' : 'Ruta de Bus'}
                        </span>
                        <h4 className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition">
                          {item.nombre_guardado}
                        </h4>
                      </div>
                    </div>

                    <button
                      onClick={(e) => handleRemove(item.tipo, item.elemento_id, e)}
                      title="Eliminar de favoritos"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-xs text-slate-600 mb-3 line-clamp-2">
                    {item.datos_basicos.descripcion}
                  </p>

                  {/* Datos específicos de paradas o rutas */}
                  {isParada && item.datos_basicos.lat && (
                    <div className="text-[11px] font-mono text-slate-500 bg-slate-50 p-2 rounded-xl mb-2 flex items-center justify-between">
                      <span>Coordenadas GPS:</span>
                      <span className="font-bold">
                        {item.datos_basicos.lat.toFixed(4)}, {item.datos_basicos.lng?.toFixed(4)}
                      </span>
                    </div>
                  )}

                  {!isParada && item.datos_basicos.paradas_resumen && item.datos_basicos.paradas_resumen.length > 0 && (
                    <div className="bg-slate-50 p-2 rounded-xl mb-2 text-[11px]">
                      <span className="font-semibold text-slate-500 block mb-1">
                        Itinerario guardado:
                      </span>
                      <p className="text-slate-700 line-clamp-2">
                        {item.datos_basicos.paradas_resumen.join(' ➔ ')}
                      </p>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Guardado: {new Date(item.fecha_guardado).toLocaleDateString()}
                  </span>
                  <span className="text-blue-600 font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition">
                    Ver detalles <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
