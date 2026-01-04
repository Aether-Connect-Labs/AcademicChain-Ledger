import React, { useEffect, useState } from 'react';
import AdminAPI from './services/adminAPI';

const AdminAlerts = () => {
  const [cfg, setCfg] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const r = await AdminAPI.getAlertsConfig();
      const d = r.data || r;
      setCfg(d?.data || d || {});
    } catch (e) {
      setError('Error al cargar configuración de alertas');
      setCfg({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    try {
      setSaving(true);
      setOk('');
      setError('');
      const payload = {
        svcLatencyThresholdMs: Number(cfg['alerts:config:svc_latency_threshold_ms'] || 0),
        enableEmail: !!cfg['alerts:config:enable_email'],
        enableSocket: !!cfg['alerts:config:enable_socket'],
        rateOracleAgeWarningS: Number(cfg['alerts:config:rate_oracle_age_warning_s'] || 0),
      };
      await AdminAPI.setAlertsConfig(payload);
      setOk('Configuración guardada');
    } catch (e) {
      setError('Error al guardar configuración');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (key, value) => {
    setCfg(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Configuración de alertas</h2>
        <div className="flex gap-2">
          <button className="btn-secondary" onClick={load}>Actualizar</button>
          <button className="btn-primary" onClick={save} disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</button>
        </div>
      </div>
      {loading ? (
        <div className="text-sm text-gray-500">Cargando…</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-soft p-6">
            <div className="font-semibold text-gray-800 mb-4">Servicios</div>
            <label className="block text-sm text-gray-700 mb-2">Umbral de latencia (ms)</label>
            <input type="number" className="input" value={cfg['alerts:config:svc_latency_threshold_ms'] || ''} onChange={e => updateField('alerts:config:svc_latency_threshold_ms', Number(e.target.value))} />
            <label className="block text-sm text-gray-700 mt-4">Alertas por Email</label>
            <input type="checkbox" checked={!!cfg['alerts:config:enable_email']} onChange={e => updateField('alerts:config:enable_email', e.target.checked ? 1 : 0)} />
            <label className="block text-sm text-gray-700 mt-4">Alertas por Socket</label>
            <input type="checkbox" checked={!!cfg['alerts:config:enable_socket']} onChange={e => updateField('alerts:config:enable_socket', e.target.checked ? 1 : 0)} />
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-soft p-6">
            <div className="font-semibold text-gray-800 mb-4">Rate Oracle</div>
            <label className="block text-sm text-gray-700 mb-2">Edad máxima aceptable (s)</label>
            <input type="number" className="input" value={cfg['alerts:config:rate_oracle_age_warning_s'] || ''} onChange={e => updateField('alerts:config:rate_oracle_age_warning_s', Number(e.target.value))} />
          </div>
        </div>
      )}
      {ok && <div className="text-sm text-green-600">{ok}</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}
    </div>
  );
};

export default AdminAlerts;

