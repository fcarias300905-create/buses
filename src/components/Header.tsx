import React from 'react';
import { Bus, Wifi, WifiOff, Shield, Info, Search, MapPin } from 'lucide-react';

interface HeaderProps {
  isOnline: boolean;
  onOpenAdmin: () => void;
  onOpenInfo: () => void;
  onQuickSearch: () => void;
  stopsCount: number;
  routesCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  isOnline,
  onOpenAdmin,
  onOpenInfo,
  onQuickSearch,
  stopsCount,
  routesCount,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Logo y Nombre */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
            <Bus className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900">
                BusRuta <span className="text-blue-600 font-black">Santa Ana</span>
              </h1>
              <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                El Salvador
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              {stopsCount} paradas registradas • {routesCount} rutas urbanas
            </p>
          </div>
        </div>

        {/* Buscador Rápido y Estado */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onQuickSearch}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium transition border border-slate-200"
            title="Buscar ruta o destino"
          >
            <Search className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden md:inline">Buscar destino...</span>
          </button>

          {/* Indicador de conexión */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
              isOnline
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-800 border-amber-300'
            }`}
            title={isOnline ? 'Conexión activa a internet' : 'Modo sin internet activo: favoritos disponibles'}
          >
            {isOnline ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] hidden xs:inline">En línea</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-600" />
                <span className="text-[11px]">Sin conexión</span>
              </>
            )}
          </div>

          {/* Botón Info */}
          <button
            onClick={onOpenInfo}
            className="p-2 rounded-xl text-slate-600 hover:text-blue-600 hover:bg-slate-100 border border-slate-200 transition"
            title="Información y propósito del proyecto"
          >
            <Info className="w-4 h-4" />
          </button>

          {/* Botón Administración */}
          <button
            onClick={onOpenAdmin}
            className="p-2 rounded-xl text-slate-600 hover:text-blue-600 hover:bg-slate-100 border border-slate-200 transition"
            title="Panel de Administración"
          >
            <Shield className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
