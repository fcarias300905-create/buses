import React from 'react';
import { Bus, MapPin, ShieldCheck, AlertCircle, Info, ExternalLink, X, Heart } from 'lucide-react';

interface AppInfoModalProps {
  onClose: () => void;
}

export const AppInfoModal: React.FC<AppInfoModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Acerca de BusRuta Santa Ana</h3>
              <p className="text-xs text-slate-500">
                Información del proyecto y condiciones de uso
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
          <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80 text-blue-950 space-y-2">
            <h4 className="font-bold text-sm flex items-center gap-2 text-blue-900">
              <Bus className="w-4 h-4 text-blue-600" />
              Objetivo del Proyecto
            </h4>
            <p>
              BusRuta Santa Ana es una iniciativa digital diseñada para que estudiantes, trabajadores, residentes y visitantes de la ciudad morena identifiquen paradas de buses, conozcan las rutas disponibles y planifiquen sus desplazamientos con información organizada y verificada.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-slate-800 text-sm mb-2 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Criterios de Verificación de Datos
            </h4>
            <ul className="space-y-1.5 pl-2">
              <li className="flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <span>
                  <strong className="text-slate-800">Verificado:</strong> Información corroborada mediante inspección de campo, operadores o lineamientos del VMT.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                <span>
                  <strong className="text-slate-800">Pendiente:</strong> Datos en proceso de validación geográfica.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                <span>
                  <strong className="text-slate-800">Sin datos ficticios:</strong> No se inventan transbordos automáticos, tiempos de espera ni recorridos que no hayan sido documentados.
                </span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-slate-800 text-sm mb-1.5 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              Alcance y Limitaciones
            </h4>
            <p className="text-slate-600">
              Esta aplicación no sustituye las disposiciones de las autoridades oficiales de transporte ni promete rastreo de autobuses por GPS en tiempo real sin telemetría instalada en las unidades. Las horas y frecuencias son estimaciones de operación habitual en Santa Ana.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-slate-800 text-sm mb-1.5">
              Privacidad y Funcionamiento Local
            </h4>
            <p className="text-slate-600">
              La aplicación no solicita cédula, DUI, número de teléfono ni contraseñas personales. Tus paradas y rutas favoritas quedan guardadas de manera segura en tu navegador y pueden ser consultadas sin conexión a internet.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Versión 1.0.0 • Santa Ana, El Salvador</span>
            <span className="flex items-center gap-1 text-slate-500">
              Desarrollado para la comunidad <Heart className="w-3 h-3 text-rose-500 fill-rose-500 inline" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
