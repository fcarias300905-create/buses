import React, { useState } from 'react';
import { BusRoute, BusStop, UserReport, VerificationStatus } from '../types/transit';
import { getStops, saveStops, getRoutes, saveRoutes, getReports, updateReportStatus, exportDatabaseBackup, importDatabaseBackup, resetDatabaseToDefaults } from '../services/storage';
import { Shield, ShieldCheck, Lock, LogOut, Plus, Edit3, Trash2, Check, Download, Upload, RefreshCw, AlertCircle, Eye, EyeOff, X } from 'lucide-react';

interface AdminPanelProps {
  onClose: () => void;
  onDataChanged: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onClose, onDataChanged }) => {
  // Autenticación administrativa
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('busruta_admin_session') === 'true';
  });
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');

  // Pestaña activa del panel
  const [activeTab, setActiveTab] = useState<'paradas' | 'rutas' | 'reportes' | 'backup'>('paradas');

  // Estado de paradas y rutas para edición
  const [stopsList, setStopsList] = useState<BusStop[]>(() => getStops());
  const [routesList, setRoutesList] = useState<BusRoute[]>(() => getRoutes());
  const [reportsList, setReportsList] = useState<UserReport[]>(() => getReports());

  // Modal para crear/editar parada
  const [editingStop, setEditingStop] = useState<BusStop | null>(null);
  const [isCreatingStop, setIsCreatingStop] = useState(false);

  // Backup state
  const [backupJson, setBackupJson] = useState('');
  const [backupMessage, setBackupMessage] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Clave administrativa para gestión oficial de datos de transporte en Santa Ana
    if (passwordInput === 'admin123' || passwordInput === 'SantaAna2026') {
      setIsAuthenticated(true);
      sessionStorage.setItem('busruta_admin_session', 'true');
      setAuthError('');
    } else {
      setAuthError('Contraseña incorrecta. (Clave de acceso de demostración: admin123)');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('busruta_admin_session');
  };

  // Guardar cambios en una parada
  const handleSaveStop = (stopToSave: BusStop) => {
    // Validar coordenadas dentro del área de Santa Ana (~13.8 a ~14.2 lat, -89.8 a -89.4 lng)
    if (
      stopToSave.lat < 13.5 ||
      stopToSave.lat > 14.5 ||
      stopToSave.lng < -90.2 ||
      stopToSave.lng > -89.0
    ) {
      alert('Error: Las coordenadas deben pertenecer al departamento de Santa Ana, El Salvador.');
      return;
    }

    let updated: BusStop[];
    if (isCreatingStop) {
      updated = [stopToSave, ...stopsList];
    } else {
      updated = stopsList.map((s) => (s.id === stopToSave.id ? stopToSave : s));
    }

    saveStops(updated);
    setStopsList(updated);
    setEditingStop(null);
    setIsCreatingStop(false);
    onDataChanged();
  };

  const handleToggleStopActive = (stopId: string) => {
    const updated = stopsList.map((s) => (s.id === stopId ? { ...s, activa: !s.activa } : s));
    saveStops(updated);
    setStopsList(updated);
    onDataChanged();
  };

  const handleUpdateReport = (reportId: string, status: UserReport['estado_revision']) => {
    updateReportStatus(reportId, status);
    setReportsList(getReports());
  };

  const handleExportBackup = () => {
    const json = exportDatabaseBackup();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `busruta-santa-ana-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setBackupMessage('Copia de seguridad exportada correctamente.');
  };

  const handleImportBackup = () => {
    if (!backupJson.trim()) return;
    const ok = importDatabaseBackup(backupJson);
    if (ok) {
      setStopsList(getStops());
      setRoutesList(getRoutes());
      setReportsList(getReports());
      onDataChanged();
      setBackupMessage('¡Base de datos importada exitosamente!');
      setBackupJson('');
    } else {
      setBackupMessage('Error: El formato JSON de respaldo es inválido.');
    }
  };

  const handleResetDefaults = () => {
    if (window.confirm('¿Deseas restaurar la base de datos a los valores oficiales iniciales?')) {
      resetDatabaseToDefaults();
      setStopsList(getStops());
      setRoutesList(getRoutes());
      onDataChanged();
      setBackupMessage('Datos restaurados a la configuración inicial.');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Acceso Administrativo</h3>
                <p className="text-xs text-slate-500">Gestión de datos de transporte</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Contraseña de Administrador
              </label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Ingresa tu clave..."
                className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 focus:border-blue-500 outline-none text-sm font-medium"
                autoFocus
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Demostración: Usa <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-700">admin123</code>
              </p>
            </div>

            {authError && (
              <p className="text-xs text-rose-600 font-medium bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                {authError}
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition"
              >
                Ingresar al Panel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header del Panel */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-extrabold text-base sm:text-lg text-slate-900">
                Panel de Control de Transporte
              </h2>
              <p className="text-xs text-slate-500">
                Santa Ana, El Salvador • Verificación y mantenimiento de rutas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 transition"
              title="Cerrar sesión de administrador"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cerrar Sesión</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Pestañas del Panel */}
        <div className="flex items-center gap-2 px-5 pt-3 border-b border-slate-200 overflow-x-auto">
          <button
            onClick={() => setActiveTab('paradas')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition shrink-0 ${
              activeTab === 'paradas'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Gestor de Paradas ({stopsList.length})
          </button>
          <button
            onClick={() => setActiveTab('rutas')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition shrink-0 ${
              activeTab === 'rutas'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Gestor de Rutas ({routesList.length})
          </button>
          <button
            onClick={() => setActiveTab('reportes')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition shrink-0 ${
              activeTab === 'reportes'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Reportes Ciudadanos ({reportsList.length})
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition shrink-0 ${
              activeTab === 'backup'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Respaldo y Base de Datos
          </button>
        </div>

        {/* Contenido scrolleable */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {/* TAB 1: PARADAS */}
          {activeTab === 'paradas' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-slate-500">
                  Paradas activas y estado de verificación en el municipio de Santa Ana.
                </p>
                <button
                  onClick={() => {
                    setEditingStop({
                      id: 'stop-' + Date.now(),
                      nombre: '',
                      descripcion: '',
                      lat: 13.9942,
                      lng: -89.5597,
                      municipio: 'Santa Ana',
                      departamento: 'Santa Ana',
                      pais: 'El Salvador',
                      activa: true,
                      estado_verificacion: 'VERIFICADO',
                      fecha_actualizacion: new Date().toISOString().slice(0, 10),
                      rutas: [],
                      destinos_principales: [],
                      fuente_datos: 'Ingreso manual por administrador',
                    });
                    setIsCreatingStop(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nueva Parada</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {stopsList.map((stop) => (
                  <div
                    key={stop.id}
                    className={`p-3.5 rounded-2xl border transition ${
                      stop.activa ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-200/50 opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div>
                        <span
                          className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                            stop.estado_verificacion === 'VERIFICADO'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {stop.estado_verificacion}
                        </span>
                        <h4 className="font-bold text-slate-900 text-sm">{stop.nombre}</h4>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingStop({ ...stop });
                            setIsCreatingStop(false);
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition"
                          title="Editar parada"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleStopActive(stop.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition"
                          title={stop.activa ? 'Desactivar parada' : 'Activar parada'}
                        >
                          {stop.activa ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4 text-slate-400" />}
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 line-clamp-1 mb-2">{stop.descripcion}</p>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                      <span>Rutas: {stop.rutas.join(', ') || 'Ninguna'}</span>
                      <span className="font-mono">{stop.lat.toFixed(4)}, {stop.lng.toFixed(4)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: RUTAS */}
          {activeTab === 'rutas' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500">
                Rutas urbanas registradas en Santa Ana con sus sentidos y paradas autorizadas.
              </p>
              <div className="space-y-2.5">
                {routesList.map((route) => (
                  <div
                    key={route.id}
                    className="p-4 rounded-2xl bg-white border border-slate-200 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-xs"
                        style={{ backgroundColor: route.color || '#2563EB' }}
                      >
                        {route.codigo}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{route.nombre}</h4>
                        <p className="text-xs text-slate-500">
                          {route.origen} ➔ {route.destino}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 block mb-1">
                        {route.estado_verificacion}
                      </span>
                      <span className="text-xs text-slate-400">
                        {route.paradas.length} paradas asociadas
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: REPORTES */}
          {activeTab === 'reportes' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500">
                Observaciones enviadas por la ciudadanía para revisar y corregir datos.
              </p>
              {reportsList.length === 0 ? (
                <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  No hay reportes de usuarios pendientes de revisión.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {reportsList.map((rep) => (
                    <div
                      key={rep.id}
                      className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-black uppercase text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 mr-2">
                            {rep.tipo_problema.replace(/_/g, ' ')}
                          </span>
                          <span className="text-xs font-bold text-slate-800">
                            {rep.nombre_referencia}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {new Date(rep.fecha_creacion).toLocaleDateString()}
                        </span>
                      </div>

                      {rep.descripcion && (
                        <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-xl">
                          "{rep.descripcion}"
                        </p>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <span className="text-xs font-semibold text-slate-500">
                          Estado: <strong className="text-blue-600">{rep.estado_revision}</strong>
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleUpdateReport(rep.id, 'aprobado')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[11px] font-bold border border-emerald-200 transition"
                          >
                            Marcar Aprobado
                          </button>
                          <button
                            onClick={() => handleUpdateReport(rep.id, 'descartado')}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 text-[11px] font-bold transition"
                          >
                            Descartar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: BACKUP & DATABASE */}
          {activeTab === 'backup' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-900 text-sm">Copia de Seguridad y Publicación</h4>
                <p className="text-xs text-slate-600">
                  Exporta toda la base de datos de paradas, rutas y reportes de Santa Ana en formato JSON estándar para copias de seguridad o migraciones.
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={handleExportBackup}
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700 transition"
                  >
                    <Download className="w-4 h-4" />
                    <span>Descargar Backup JSON</span>
                  </button>
                  <button
                    onClick={handleResetDefaults}
                    className="flex items-center gap-1.5 px-4 py-2 bg-rose-50 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl hover:bg-rose-100 transition"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Restaurar Datos Oficiales Iniciales</span>
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-900 text-sm">Restaurar / Importar Archivo JSON</h4>
                <textarea
                  value={backupJson}
                  onChange={(e) => setBackupJson(e.target.value)}
                  placeholder="Pega aquí el contenido JSON del respaldo..."
                  rows={4}
                  className="w-full p-3 rounded-xl border border-slate-200 font-mono text-xs outline-none focus:border-blue-500"
                />
                <button
                  onClick={handleImportBackup}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl hover:bg-emerald-700 transition"
                >
                  <Upload className="w-4 h-4" />
                  <span>Importar Datos</span>
                </button>
              </div>

              {backupMessage && (
                <p className="text-xs text-blue-700 font-bold bg-blue-50 p-2.5 rounded-xl border border-blue-200">
                  {backupMessage}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Modal de Crear/Editar Parada */}
        {editingStop && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <h3 className="font-bold text-slate-900 text-base">
                {isCreatingStop ? 'Nueva Parada de Bus' : 'Editar Parada'}
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Nombre</label>
                  <input
                    type="text"
                    value={editingStop.nombre}
                    onChange={(e) => setEditingStop({ ...editingStop, nombre: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                    placeholder="Ej. Frente a Centro Médico"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Descripción / Referencia</label>
                  <input
                    type="text"
                    value={editingStop.descripcion}
                    onChange={(e) => setEditingStop({ ...editingStop, descripcion: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                    placeholder="Ej. Costado norte de parque..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Latitud</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={editingStop.lat}
                      onChange={(e) => setEditingStop({ ...editingStop, lat: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border rounded-xl text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Longitud</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={editingStop.lng}
                      onChange={(e) => setEditingStop({ ...editingStop, lng: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border rounded-xl text-sm font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Estado de Verificación</label>
                  <select
                    value={editingStop.estado_verificacion}
                    onChange={(e) => setEditingStop({ ...editingStop, estado_verificacion: e.target.value as VerificationStatus })}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  >
                    <option value="VERIFICADO">VERIFICADO (Confirmado en campo)</option>
                    <option value="PENDIENTE">PENDIENTE (Aporte por confirmar)</option>
                    <option value="DESACTUALIZADO">DESACTUALIZADO</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Rutas asociadas (separadas por coma)</label>
                  <input
                    type="text"
                    value={editingStop.rutas.join(', ')}
                    onChange={(e) =>
                      setEditingStop({
                        ...editingStop,
                        rutas: e.target.value.split(',').map((r) => r.trim()).filter(Boolean),
                      })
                    }
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                    placeholder="51-A, 51-B, 55-A"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  onClick={() => setEditingStop(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleSaveStop(editingStop)}
                  className="px-5 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 shadow-sm"
                >
                  Guardar Cambios
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
