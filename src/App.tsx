import React, { useState, useEffect, useCallback } from 'react';
import { BusRoute, BusStop, LatLng, RouteSense } from './types/transit';
import { getStops, getRoutes, getFavorites, isFavorite } from './services/storage';
import { Header } from './components/Header';
import { Navigation, NavigationTab } from './components/Navigation';
import { MapContainer } from './components/MapContainer';
import { StopDetailModal } from './components/StopDetailModal';
import { RouteDetailModal } from './components/RouteDetailModal';
import { FavoritesView } from './components/FavoritesView';
import { NearbyStopsView } from './components/NearbyStopsView';
import { RouteSearchView } from './components/RouteSearchView';
import { ReportModal } from './components/ReportModal';
import { AdminPanel } from './components/AdminPanel';
import { AppInfoModal } from './components/AppInfoModal';
import {
  Search,
  MapPin,
  Bus,
  Compass,
  Star,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  WifiOff,
} from 'lucide-react';

export default function App() {
  // Datos principales
  const [stops, setStops] = useState<BusStop[]>(() => getStops());
  const [routes, setRoutes] = useState<BusRoute[]>(() => getRoutes());
  const [favoritesCount, setFavoritesCount] = useState<number>(() => getFavorites().length);

  // Navegación
  const [currentTab, setCurrentTab] = useState<NavigationTab>('inicio');

  // Selecciones interactivas
  const [selectedStop, setSelectedStop] = useState<BusStop | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<BusRoute | null>(null);
  const [activeRouteOnMap, setActiveRouteOnMap] = useState<BusRoute | null>(null);
  const [activeRouteSense, setActiveRouteSense] = useState<RouteSense>('IDA');

  // Modales
  const [reportTarget, setReportTarget] = useState<BusStop | BusRoute | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);

  // Ubicación del usuario
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Estado de red
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  // Quota de Google Maps Platform
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  // Filtros de ruta activa
  const [filterRouteCode, setFilterRouteCode] = useState<string | undefined>(undefined);

  // Carga y sincronización de datos
  const refreshTransitData = useCallback(() => {
    setStops(getStops());
    setRoutes(getRoutes());
    setFavoritesCount(getFavorites().length);
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    const handleFavoritesUpdate = () => setFavoritesCount(getFavorites().length);
    const handleQuotaExceeded = () => setQuotaExceeded(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('busruta-favorites-updated', handleFavoritesUpdate);
    window.addEventListener('gmp-quota-exceeded', handleQuotaExceeded);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('busruta-favorites-updated', handleFavoritesUpdate);
      window.removeEventListener('gmp-quota-exceeded', handleQuotaExceeded);
    };
  }, []);

  // Solicitar ubicación GPS del usuario
  const handleRequestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('Tu dispositivo o navegador no admite geolocalización GPS.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setLocationError(null);
      },
      (err) => {
        console.warn('Geolocation denied or error:', err.message);
        setLocationError('No se concedió acceso a la ubicación. Puedes buscar zonas manualmente.');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  // Manejar apertura de ruta en el mapa
  const handleViewRouteOnMap = (route: BusRoute, sense: RouteSense = 'IDA') => {
    setActiveRouteOnMap(route);
    setActiveRouteSense(sense);
    setFilterRouteCode(route.codigo);
    setSelectedRoute(null);
    setCurrentTab('mapa');
  };

  // Paradas verificadas para estadísticas rápidas
  const verifiedStopsCount = stops.filter((s) => s.estado_verificacion === 'VERIFICADO').length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Notificación oficial de Cuota de Google Maps Platform según directivas de gobierno */}
      {quotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}

      {/* Banner de Aviso Sin Conexión */}
      {!isOnline && (
        <div className="bg-amber-600 text-white px-4 py-2 text-xs font-bold text-center flex items-center justify-center gap-2">
          <WifiOff className="w-3.5 h-3.5" />
          <span>
            Estás navegando sin conexión a internet. Tus paradas y rutas favoritas permanecen guardadas localmente.
          </span>
        </div>
      )}

      {/* Cabecera Principal */}
      <Header
        isOnline={isOnline}
        onOpenAdmin={() => setShowAdminModal(true)}
        onOpenInfo={() => setShowInfoModal(true)}
        onQuickSearch={() => setCurrentTab('buscar')}
        stopsCount={stops.length}
        routesCount={routes.length}
      />

      {/* Contenedor Central */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-6">
        {/* Barra de Navegación Superior para Desktop */}
        <div className="flex justify-center mb-4">
          <Navigation
            currentTab={currentTab}
            onSelectTab={(tab) => {
              if (tab === 'reportar') {
                setReportTarget(null);
                setShowReportModal(true);
              } else {
                setCurrentTab(tab);
              }
            }}
            favoritesCount={favoritesCount}
          />
        </div>

        {/* PANTALLA 1: INICIO */}
        {currentTab === 'inicio' && (
          <div className="space-y-6 pb-24 md:pb-8">
            {/* Hero Banner Juvenil y Accesible */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white p-5 sm:p-8 shadow-xl shadow-blue-500/10">
              <div className="relative z-10 max-w-2xl space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-bold text-blue-100 border border-white/20">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Transporte Urbano de Santa Ana, El Salvador</span>
                </div>
                <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
                  Encuentra tu parada y muévete seguro en Santa Ana
                </h2>
                <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed max-w-xl">
                  Consulta recorridos verificados de las rutas 51-A, 51-B, 51-C, 51-D, 55 y más. Localiza las paradas hacia universidades, hospitales, terminales y colonias.
                </p>

                {/* Accesos directos principales */}
                <div className="flex flex-wrap items-center gap-2.5 pt-2">
                  <button
                    onClick={() => setCurrentTab('buscar')}
                    className="px-4 py-2.5 rounded-2xl bg-white text-blue-700 hover:bg-blue-50 font-bold text-xs sm:text-sm shadow-md transition active:scale-95 flex items-center gap-2"
                  >
                    <Search className="w-4 h-4 text-blue-600" />
                    <span>Planificar Viaje</span>
                  </button>
                  <button
                    onClick={() => setCurrentTab('cercanas')}
                    className="px-4 py-2.5 rounded-2xl bg-blue-500/40 hover:bg-blue-500/60 text-white font-bold text-xs sm:text-sm border border-white/30 backdrop-blur-xs transition active:scale-95 flex items-center gap-2"
                  >
                    <Compass className="w-4 h-4" />
                    <span>Paradas Cercanas</span>
                  </button>
                  <button
                    onClick={() => setCurrentTab('favoritos')}
                    className="px-4 py-2.5 rounded-2xl bg-blue-500/40 hover:bg-blue-500/60 text-white font-bold text-xs sm:text-sm border border-white/30 backdrop-blur-xs transition active:scale-95 flex items-center gap-2"
                  >
                    <Star className="w-4 h-4 text-amber-300 fill-amber-300" />
                    <span>Mis Favoritos ({favoritesCount})</span>
                  </button>
                </div>
              </div>

              {/* Elementos decorativos */}
              <div className="absolute -right-10 -bottom-10 w-64 h-64 rounded-full bg-white/5 blur-2xl pointer-events-none" />
              <div className="absolute right-6 top-6 opacity-15 hidden lg:block pointer-events-none">
                <Bus className="w-48 h-48 text-white" />
              </div>
            </div>

            {/* Barra de Estadísticas y Confianza */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                  Paradas Registradas
                </span>
                <span className="text-xl font-extrabold text-slate-900">{stops.length}</span>
                <span className="text-[11px] text-emerald-600 font-semibold block mt-0.5">
                  {verifiedStopsCount} verificadas
                </span>
              </div>
              <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                  Rutas de Autobuses
                </span>
                <span className="text-xl font-extrabold text-blue-600">{routes.length}</span>
                <span className="text-[11px] text-slate-500 block mt-0.5">Líneas urbanas</span>
              </div>
              <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                  Acceso Sin Internet
                </span>
                <span className="text-xl font-extrabold text-emerald-600">Activo</span>
                <span className="text-[11px] text-slate-500 block mt-0.5">Memoria local</span>
              </div>
              <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                  Cobertura
                </span>
                <span className="text-xl font-extrabold text-slate-900">Santa Ana</span>
                <span className="text-[11px] text-slate-500 block mt-0.5">Centro y colonias</span>
              </div>
            </div>

            {/* Sección Principal con Mapa Interactivo y Panel Lateral */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
              {/* Mapa Interactivo (7 u 8 columnas en desktop) */}
              <div className="lg:col-span-8 min-h-[460px] h-[520px] rounded-3xl overflow-hidden shadow-sm border border-slate-200 flex flex-col">
                <MapContainer
                  stops={stops}
                  selectedStop={selectedStop}
                  onSelectStop={(stop) => setSelectedStop(stop)}
                  activeRoute={activeRouteOnMap}
                  activeRouteSense={activeRouteSense}
                  userLocation={userLocation}
                  onRequestUserLocation={handleRequestLocation}
                  filterRouteCode={filterRouteCode}
                  isOnline={isOnline}
                />
              </div>

              {/* Panel de Rutas Rápidas en Santa Ana (4 columnas) */}
              <div className="lg:col-span-4 flex flex-col justify-between p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                      <Bus className="w-4 h-4 text-blue-600" />
                      Rutas de Santa Ana
                    </h3>
                    <button
                      onClick={() => setCurrentTab('mapa')}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      Ver todas <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mb-3">
                    Selecciona una ruta para ver su ficha y trazar su recorrido sobre las calles de Santa Ana:
                  </p>

                  <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                    {routes.map((route) => {
                      const isActive = activeRouteOnMap?.id === route.id;

                      return (
                        <div
                          key={route.id}
                          onClick={() => setSelectedRoute(route)}
                          className={`p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-2.5 ${
                            isActive
                              ? 'bg-blue-50/80 border-blue-400 ring-2 ring-blue-100'
                              : 'bg-white border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-xs shrink-0 shadow-xs"
                              style={{ backgroundColor: route.color || '#2563EB' }}
                            >
                              {route.codigo}
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-slate-900 truncate">
                                {route.nombre}
                              </h4>
                              <p className="text-[11px] text-slate-500 truncate">
                                {route.origen} ➔ {route.destino}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewRouteOnMap(route, 'IDA');
                              }}
                              className="px-2 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white text-[11px] font-bold border border-blue-200 transition"
                              title="Trazar ruta en mapa"
                            >
                              Trazar
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Banner de reporte de error */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500">¿Viste un dato inexacto?</span>
                  <button
                    onClick={() => {
                      setReportTarget(null);
                      setShowReportModal(true);
                    }}
                    className="font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Reportar</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PANTALLA 2: BÚSQUEDA DE RUTAS */}
        {currentTab === 'buscar' && (
          <RouteSearchView
            stops={stops}
            routes={routes}
            userLocation={userLocation}
            onRequestUserLocation={handleRequestLocation}
            onSelectRouteOnMap={handleViewRouteOnMap}
            onSelectStop={(stop) => setSelectedStop(stop)}
          />
        )}

        {/* PANTALLA 3: MAPA COMPLETO */}
        {currentTab === 'mapa' && (
          <div className="space-y-4 pb-24 md:pb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-slate-200 shadow-xs">
              <div>
                <h2 className="text-base font-bold text-slate-900">Mapa Geográfico Completo</h2>
                <p className="text-xs text-slate-500">
                  Visualiza todas las paradas registradas y activa recorridos en Santa Ana
                </p>
              </div>

              {/* Selector de Ruta para trazar */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider hidden sm:inline">
                  Filtrar Ruta:
                </span>
                <select
                  value={filterRouteCode || ''}
                  onChange={(e) => {
                    const code = e.target.value;
                    setFilterRouteCode(code || undefined);
                    const found = routes.find((r) => r.codigo === code);
                    setActiveRouteOnMap(found || null);
                  }}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white text-slate-700 outline-none focus:border-blue-500"
                >
                  <option value="">Todas las rutas</option>
                  {routes.map((r) => (
                    <option key={r.id} value={r.codigo}>
                      Ruta {r.codigo} - {r.nombre.split(':')[1]?.trim() || r.nombre}
                    </option>
                  ))}
                </select>

                {activeRouteOnMap && (
                  <button
                    onClick={() => {
                      setActiveRouteOnMap(null);
                      setFilterRouteCode(undefined);
                    }}
                    className="px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold transition"
                    title="Limpiar trazo"
                  >
                    Limpiar
                  </button>
                )}
              </div>
            </div>

            <div className="w-full h-[650px] rounded-3xl overflow-hidden shadow-sm border border-slate-200">
              <MapContainer
                stops={stops}
                selectedStop={selectedStop}
                onSelectStop={(stop) => setSelectedStop(stop)}
                activeRoute={activeRouteOnMap}
                activeRouteSense={activeRouteSense}
                userLocation={userLocation}
                onRequestUserLocation={handleRequestLocation}
                filterRouteCode={filterRouteCode}
                isOnline={isOnline}
              />
            </div>
          </div>
        )}

        {/* PANTALLA 4: PARADAS CERCANAS */}
        {currentTab === 'cercanas' && (
          <NearbyStopsView
            stops={stops}
            userLocation={userLocation}
            onRequestUserLocation={handleRequestLocation}
            onSelectStop={(stop) => setSelectedStop(stop)}
          />
        )}

        {/* PANTALLA 7: FAVORITOS (ACCESO 100% OFFLINE) */}
        {currentTab === 'favoritos' && (
          <FavoritesView
            onSelectStop={(stop) => setSelectedStop(stop)}
            onSelectRoute={(route) => setSelectedRoute(route)}
            isOnline={isOnline}
          />
        )}
      </main>

      {/* MODAL: DETALLES DE UNA PARADA (PANTALLA 5) */}
      {selectedStop && (
        <StopDetailModal
          stop={selectedStop}
          routes={routes}
          onClose={() => setSelectedStop(null)}
          onSelectRoute={(route) => {
            setSelectedStop(null);
            setSelectedRoute(route);
          }}
          onOpenReport={(stop) => {
            setReportTarget(stop);
            setShowReportModal(true);
          }}
        />
      )}

      {/* MODAL: DETALLES DE UNA RUTA (PANTALLA 6) */}
      {selectedRoute && (
        <RouteDetailModal
          route={selectedRoute}
          allStops={stops}
          onClose={() => setSelectedRoute(null)}
          onSelectStop={(stop) => {
            setSelectedRoute(null);
            setSelectedStop(stop);
          }}
          onViewRouteOnMap={handleViewRouteOnMap}
          onOpenReport={(route) => {
            setReportTarget(route);
            setShowReportModal(true);
          }}
        />
      )}

      {/* MODAL: REPORTAR PROBLEMA (PANTALLA 8) */}
      {showReportModal && (
        <ReportModal
          targetElement={reportTarget}
          onClose={() => {
            setShowReportModal(false);
            setReportTarget(null);
          }}
        />
      )}

      {/* MODAL: PANEL DE ADMINISTRACIÓN (PANTALLA 10) */}
      {showAdminModal && (
        <AdminPanel
          onClose={() => setShowAdminModal(false)}
          onDataChanged={refreshTransitData}
        />
      )}

      {/* MODAL: INFORMACIÓN DEL PROYECTO (PANTALLA 9) */}
      {showInfoModal && <AppInfoModal onClose={() => setShowInfoModal(false)} />}
    </div>
  );
}
