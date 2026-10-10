import React from 'react';
import { Home, Search, Map as MapIcon, Compass, Star, AlertTriangle, ShieldCheck } from 'lucide-react';

export type NavigationTab = 
  | 'inicio' 
  | 'buscar' 
  | 'mapa' 
  | 'cercanas' 
  | 'favoritos' 
  | 'reportar' 
  | 'admin';

interface NavigationProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  favoritesCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onSelectTab,
  favoritesCount,
}) => {
  const tabs = [
    { id: 'inicio' as NavigationTab, label: 'Inicio', icon: Home },
    { id: 'buscar' as NavigationTab, label: 'Buscar Rutas', icon: Search },
    { id: 'mapa' as NavigationTab, label: 'Mapa', icon: MapIcon },
    { id: 'cercanas' as NavigationTab, label: 'Cercanas', icon: Compass },
    {
      id: 'favoritos' as NavigationTab,
      label: 'Favoritos',
      icon: Star,
      badge: favoritesCount > 0 ? favoritesCount : undefined,
    },
    { id: 'reportar' as NavigationTab, label: 'Reportar', icon: AlertTriangle },
  ];

  return (
    <>
      {/* Desktop / Tablet Navigation Pills */}
      <nav className="hidden md:flex items-center gap-1.5 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200 shadow-inner my-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition duration-150 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-blue-600 hover:bg-white/80'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                    isActive ? 'bg-white text-blue-600' : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 shadow-lg flex items-center justify-around">
        {tabs.slice(0, 5).map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`relative flex flex-col items-center justify-center py-1 px-2 rounded-xl transition ${
                isActive ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
                {tab.badge !== undefined && (
                  <span className="absolute -top-1 -right-2 bg-blue-600 text-white text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center border-2 border-white">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] mt-0.5 ${isActive ? 'font-bold' : 'font-medium'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
