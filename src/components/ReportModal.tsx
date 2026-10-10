import React, { useState } from 'react';
import { BusStop, BusRoute, ReportProblemType } from '../types/transit';
import { saveReport } from '../services/storage';
import { AlertTriangle, X, CheckCircle2, ShieldCheck, Send } from 'lucide-react';

interface ReportModalProps {
  targetElement?: BusStop | BusRoute | null;
  onClose: () => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  targetElement,
  onClose,
}) => {
  const isStop = targetElement && 'lat' in targetElement;
  const isRoute = targetElement && 'codigo' in targetElement;

  const [problemType, setProblemType] = useState<ReportProblemType>('parada_mal_ubicada');
  const [description, setDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const success = saveReport({
      tipo_elemento: isStop ? 'parada' : isRoute ? 'ruta' : 'general',
      elemento_id: targetElement ? targetElement.id : 'general',
      nombre_referencia: targetElement
        ? isStop
          ? (targetElement as BusStop).nombre
          : (targetElement as BusRoute).nombre
        : 'Reporte General',
      tipo_problema: problemType,
      descripcion: description.trim(),
    });

    if (success) {
      setSubmitted(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-amber-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Reportar Información Incorrecta</h3>
              <p className="text-xs text-slate-500">
                Ayuda a mejorar la precisión del transporte público en Santa Ana
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

        {submitted ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="font-bold text-slate-900 text-lg">¡Reporte Enviado con Éxito!</h4>
            <p className="text-xs text-slate-600 max-w-sm mx-auto">
              Gracias por tu colaboración ciudadana. El reporte ha sido registrado en el sistema administrativo para su verificación y actualización de los datos.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {targetElement && (
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">
                  Elemento a reportar:
                </span>
                <p className="text-xs font-bold text-slate-800">
                  {isStop ? (targetElement as BusStop).nombre : (targetElement as BusRoute).nombre}
                </p>
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                Tipo de problema identificado
              </label>
              <select
                value={problemType}
                onChange={(e) => setProblemType(e.target.value as ReportProblemType)}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-white text-xs sm:text-sm font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="parada_mal_ubicada">Parada mal ubicada en el mapa</option>
                <option value="ruta_incorrecta">Ruta de bus no pasa por aquí o es incorrecta</option>
                <option value="nombre_equivocado">Nombre o referencia equivocada</option>
                <option value="recorrido_incompleto">Recorrido o calles incompletas</option>
                <option value="parada_inexistente">La parada ya no existe o fue reubicada</option>
                <option value="desactualizado">Información o sentido desactualizado</option>
                <option value="otro">Otro detalle de transporte</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                Detalles de la corrección (opcional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe brevemente qué dato está incorrecto (ej. 'La parada está frente a la farmacia, no en la esquina')"
                rows={3}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-white text-xs sm:text-sm font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 text-[11px] text-slate-500 border border-slate-100 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>Privacidad protegida:</strong> No solicitamos tu nombre, número de DUI ni número de teléfono. Tu reporte es anónimo y enfocado únicamente en la calidad de los datos del transporte.
              </span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition flex items-center gap-1.5 active:scale-95"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Enviar Reporte</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
