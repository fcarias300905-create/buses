import React, { useState } from 'react';
import { BusRoute, BusStop, LatLng, RouteSearchResult, RouteSense } from '../types/transit';
import { searchRoutes, SANTA_ANA_POPULAR_LANDMARKS } from '../services/routeSearch';
import { Search, ArrowUpDown, Navigation2, MapPin, Bus, CheckCircle2, AlertCircle, ExternalLink, ChevronDown, ChevronUp, Star } from 'lucide-react';
import { isFavorite, saveFavorite, removeFavorite } from '../services/storage';

interface RouteSearchViewProps {
  stops: BusStop[];
  routes: BusRoute[];
  userLocation: LatLng | null;
  onRequestUserLocation: () => void;
  onSelectRouteOnMap: (route: BusRoute, sense: RouteSense) => void;
  onSelectStop: (stop: BusStop) => void;
}

export const RouteSearchView: React.FC<RouteSearchViewProps> = ({
  stops,
  routes,
  userLocation,
  onRequestUserLocation,
  onSelectRouteOnMap,
  onSelectStop,
}) => {
  const [originText, setOriginText] = useState('');
  const [destinationText, setDestinationText] = useState('UNICAES');
  const [expandedResultIdx, setExpandedResultIdx] = useState<number | null>(null);
  const [searchResults, setSearchResults] = useState<{
    results: RouteSearchResult[];
    message: string;
    hasSearched: boolean;
  }>({
    results: [],
    message: '',
    hasSearched: false,
  });

  const handleSearch = () => {
    const res = searchRoutes({
      originText: originText.trim(),
      originCoords: originText.includes('Mi Ubicación') && userLocation ? userLocation : undefined,
      destinationText: destinationText.trim(),
    });

    setSearchResults({
      results: res.results,
      message: res.message,
      hasSearched: true,
    });
  };

  const handleSwap = () => {
    const temp = originText;
    setOriginText(destinationText);
    setDestinationText(temp);
  };

  const handleUseCurrentLocation = () => {
    if (userLocation) {
      setOriginText('Mi Ubicación Actual (GPS)');
    } else {
      onRequestUserLocation();
      setOriginText('Mi Ubicación Actual (GPS)');
    }
  };

  const handleSelectQuickDest = (destName: string) => {
    setDestinationText(destName);
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-24 md:pb-8">
      {/* Tarjeta de Formulario de Búsqueda */}
      <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
            <Search className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 text-base">Planifica tu Viaje en Bus</h2>
            <p className="text-xs text-slate-500">
              Encuentra qué autobús tomar entre paradas y destinos de Santa Ana
            </p>
          </div>
        </div>

        <div className="space-y-3 relative">
          {/* Campo Origen */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">
              Punto de Partida (Origen)
            </label>
            <div className="relative flex items-center">
              <MapPin className="w-4 h-4 text-emerald-600 absolute left-3.5" />
              <input
                type="text"
                value={originText}
                onChange={(e) => setOriginText(e.target.value)}
                placeholder="Ej. Terminal Lara Pineda, Parque Colón, o tu ubicación..."
                className="w-full pl-10 pr-24 py-2.5 rounded-2xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-xs sm:text-sm font-medium transition"
              />
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                className="absolute right-2 px-2.5 py-1 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-bold flex items-center gap-1 transition"
                title="Usar GPS actual"
              >
                <Navigation2 className="w-3 h-3 text-blue-600" />
                <span>Mi GPS</span>
              </button>
            </div>
          </div>

          {/* Botón intercambiar */}
          <div className="flex justify-center -my-1">
            <button
              type="button"
              onClick={handleSwap}
              className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 shadow-2xs transition active:rotate-180"
              title="Intercambiar origen y destino"
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>
          </div>

          {/* Campo Destino */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">
              ¿A dónde quieres ir? (Destino)
            </label>
            <div className="relative flex items-center">
              <MapPin className="w-4 h-4 text-rose-600 absolute left-3.5" />
              <input
                type="text"
                value={destinationText}
                onChange={(e) => setDestinationText(e.target.value)}
                placeholder="Ej. UNICAES, Metrocentro, Hospital San Juan de Dios..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-xs sm:text-sm font-medium transition"
              />
            </div>
          </div>

          {/* Destinos populares rápidos */}
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
              Destinos frecuentes en Santa Ana:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {SANTA_ANA_POPULAR_LANDMARKS.slice(0, 6).map((lm) => (
                <button
                  key={lm.stopId}
                  type="button"
                  onClick={() => handleSelectQuickDest(lm.nombre.split('(')[0].trim())}
                  className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 text-xs font-medium border border-slate-200 transition"
                >
                  {lm.nombre.split('(')[0].trim()}
                </button>
              ))}
            </div>
          </div>

          {/* Botón Buscar */}
          <button
            onClick={handleSearch}
            className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/25 transition active:scale-98 flex items-center justify-center gap-2"
          >
            <Search className="w-4 h-4" />
            <span>Buscar Rutas Disponibles</span>
          </button>
        </div>
      </div>

      {/* Mensaje de resultados */}
      {searchResults.hasSearched && (
        <div
          className={`p-4 rounded-2xl border flex items-start gap-3 ${
            searchResults.results.length > 0
              ? 'bg-blue-50/70 border-blue-200 text-blue-900'
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}
        >
          {searchResults.results.length > 0 ? (
            <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          )}
          <p className="text-xs font-medium leading-relaxed">{searchResults.message}</p>
        </div>
      )}

      {/* Tarjetas de Resultados */}
      {searchResults.results.map((res, idx) => {
        const isExpanded = expandedResultIdx === idx;
        const route = res.ruta;

        return (
          <div
            key={route.id + '-' + res.sentido + '-' + idx}
            className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm hover:border-blue-400 transition space-y-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white text-base shadow-sm shrink-0"
                  style={{ backgroundColor: route.color || '#2563EB' }}
                >
                  {route.codigo}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800">
                      Ruta Directa
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Sentido: <strong className="text-slate-800">{res.sentido}</strong>
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-base">{route.nombre}</h3>
                </div>
              </div>

              <button
                onClick={() => onSelectRouteOnMap(route, res.sentido)}
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition active:scale-95 shrink-0"
              >
                <span>Ver en Mapa</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Trayecto recomendado: dónde subir y dónde bajar */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 block">
                    Parada para abordar
                  </span>
                  <p className="text-xs sm:text-sm font-bold text-slate-800">
                    {res.parada_origen?.nombre || 'Parada de inicio'}
                  </p>
                  <p className="text-[11px] text-slate-500">{res.parada_origen?.descripcion}</p>
                </div>
              </div>

              <div className="border-l-2 border-dashed border-slate-300 ml-3 pl-6 py-1">
                <button
                  onClick={() => setExpandedResultIdx(isExpanded ? null : idx)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition"
                >
                  <span>
                    {res.paradas_intermedias.length} paradas intermedias
                  </span>
                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {/* Lista desplegable de paradas intermedias */}
                {isExpanded && (
                  <div className="mt-2 space-y-1.5">
                    {res.paradas_intermedias.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => onSelectStop(p)}
                        className="p-1.5 text-xs text-slate-600 hover:text-blue-600 cursor-pointer flex items-center gap-1.5"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                        <span className="hover:underline">{p.nombre}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 block">
                    Parada para descender
                  </span>
                  <p className="text-xs sm:text-sm font-bold text-slate-800">
                    {res.parada_destino?.nombre || 'Parada destino'}
                  </p>
                  <p className="text-[11px] text-slate-500">{res.parada_destino?.descripcion}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
              <span>Tarifa: {route.tarifa_autorizada || '$0.20'}</span>
              <span>{route.horario_aprox || 'Frecuencia: 8-12 min'}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
