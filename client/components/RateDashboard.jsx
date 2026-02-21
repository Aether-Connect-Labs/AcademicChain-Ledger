import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { io as socketIO } from 'socket.io-client';
import { API_BASE_URL } from './services/config';
import AdminAPI from './services/adminAPI';

const SOCKET_CONFIG = {
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 10000,
  timeout: 20000,
  transports: ['websocket', 'polling'],
  autoConnect: true,
  forceNew: true,
  randomizationFactor: 0.5,
};

const CONNECTION_STATES = {
  CONNECTED: 'connected',
  CONNECTING: 'connecting',
  DISCONNECTED: 'disconnected',
  RECONNECTING: 'reconnecting',
  ERROR: 'error',
  FALLBACK: 'fallback',
};

const RateDashboard = () => {
  const token = useMemo(() => { try { return localStorage.getItem('authToken'); } catch { return null; } }, []);
  const SOCKET_URL = useMemo(() => API_BASE_URL, []);

  const [error, setError] = useState('');
  const [rate, setRate] = useState(null);
  const [history, setHistory] = useState([]);
  const [metrics, setMetrics] = useState({});
  const [overrideRate, setOverrideRate] = useState('');
  const [overrideReason, setOverrideReason] = useState('');
  const [overrideExpiresAt, setOverrideExpiresAt] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [connectionState, setConnectionState] = useState(CONNECTION_STATES.CONNECTING);
  const [reconnectCount, setReconnectCount] = useState(0);
  const [isFallbackMode, setIsFallbackMode] = useState(false);
  const [lastLatencyMs, setLastLatencyMs] = useState(null);
  const reconnectCountRef = useRef(0);

  const fetchRate = useCallback(async () => {
    setError('');
    try {
      const data = await AdminAPI.getRate('?includeHistory=true&hours=24');
      const d = data?.data || data;
      setRate(d);
      setHistory(Array.isArray(data?.history) ? data.history : []);
    } catch (e) {
      setError(e.message);
      setRate(null);
      setHistory([]);
    }
  }, []);

  const fetchMetrics = useCallback(async () => {
    try {
      const data = await AdminAPI.getMetrics();
      if (data) setMetrics(data?.metrics || data);
    } catch {}
  }, []);

  const sendConnectionMetrics = useCallback(async (payload = {}) => {
    try {
      const body = {
        state: connectionState,
        reconnects: reconnectCount,
        latencyMs: lastLatencyMs,
        fallback: isFallbackMode,
        timestamp: new Date().toISOString(),
        ...payload,
      };
      await AdminAPI.sendConnectionMetrics(body);
    } catch {}
  }, [connectionState, reconnectCount, lastLatencyMs, isFallbackMode]);

  const applyOverride = async () => {
    setActionMessage('');
    setError('');
    try {
      if (!overrideRate || Number(overrideRate) <= 0) throw new Error('Ingresa una tasa válida (> 0)');
      await AdminAPI.setRate({ rate: Number(overrideRate), reason: overrideReason || undefined, expiresAt: overrideExpiresAt || undefined });
      setActionMessage('Override aplicado correctamente');
      setOverrideReason('');
      setOverrideExpiresAt('');
      await fetchRate();
    } catch (e) {
      setError(e.message);
    }
  };

  const clearOverride = async () => {
    setActionMessage('');
    setError('');
    try {
      await AdminAPI.deleteRate();
      setActionMessage('Override eliminado');
      await fetchRate();
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => {
    fetchRate();
    fetchMetrics();
    let socket = null;
    let heartbeatTimer = null;
    let metricsTimer = null;
    const clearHeartbeat = () => { if (heartbeatTimer) { clearTimeout(heartbeatTimer); heartbeatTimer = null; } };
    const startHeartbeat = () => {
      clearHeartbeat();
      heartbeatTimer = setTimeout(() => {
        setConnectionState(CONNECTION_STATES.RECONNECTING);
        try { socket?.connect(); } catch {}
      }, 20000);
    };
    const startMetrics = () => {
      if (metricsTimer) clearInterval(metricsTimer);
      metricsTimer = setInterval(() => { sendConnectionMetrics(); }, 60000);
    };

    const startPollingFallback = () => {
      setIsFallbackMode(true);
      setConnectionState(CONNECTION_STATES.FALLBACK);
      const interval = setInterval(() => { fetchRate(); fetchMetrics(); }, 30000);
      return () => clearInterval(interval);
    };

    try {
      if (SOCKET_URL) {
        setConnectionState(CONNECTION_STATES.CONNECTING);
        socket = socketIO(SOCKET_URL, { auth: { token }, ...SOCKET_CONFIG });

        socket.on('connect', () => {
          setConnectionState(CONNECTION_STATES.CONNECTED);
          setReconnectCount(0);
          setIsFallbackMode(false);
          startHeartbeat();
          startMetrics();
          sendConnectionMetrics({ event: 'connect' });
        });

        socket.on('connect_error', () => {
          setConnectionState(CONNECTION_STATES.ERROR);
          sendConnectionMetrics({ event: 'connect_error' });
        });

        socket.on('reconnect_attempt', () => {
          setConnectionState(CONNECTION_STATES.RECONNECTING);
          setReconnectCount((c) => { reconnectCountRef.current = c + 1; return c + 1; });
        });

        socket.on('reconnect_failed', () => {
          setConnectionState(CONNECTION_STATES.ERROR);
          const rc = reconnectCountRef.current + 1;
          setReconnectCount(rc);
          reconnectCountRef.current = rc;
          if (rc >= 3) {
            const stop = startPollingFallback();
            sendConnectionMetrics({ event: 'fallback' });
            socket.once('connect', () => { stop(); setIsFallbackMode(false); });
          }
        });

        socket.on('disconnect', () => {
          setConnectionState(CONNECTION_STATES.DISCONNECTED);
          sendConnectionMetrics({ event: 'disconnect' });
        });

        socket.on('rate:update', (payload) => {
          if (payload && typeof payload === 'object') {
            setRate(payload);
            try {
              const ts = Date.parse(payload.timestamp || '');
              if (Number.isFinite(ts)) setLastLatencyMs(Math.max(0, Date.now() - ts));
            } catch {}
            startHeartbeat();
          }
        });
      }
    } catch {}

    return () => {
      clearHeartbeat();
      if (metricsTimer) clearInterval(metricsTimer);
      try { if (socket) socket.disconnect(); } catch {}
    };
  }, [token, fetchRate, fetchMetrics, sendConnectionMetrics, SOCKET_URL]);

  const reconnectNow = useCallback(() => {
    try {
      setReconnectCount(0);
      setIsFallbackMode(false);
      setConnectionState(CONNECTION_STATES.RECONNECTING);
      const s = socketIO(SOCKET_URL, { auth: { token }, ...SOCKET_CONFIG });
      s.connect();
    } catch {}
  }, [token, SOCKET_URL]);

  const volatilityWarning = rate?.volatility && rate.volatility > 5;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Rate Oracle</h1>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>
      )}
      {actionMessage && (
        <div className="bg-green-100 text-green-700 p-3 rounded mb-4">{actionMessage}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded shadow">
          <div className="text-sm text-gray-500">Tasa actual</div>
          <div className="text-3xl font-semibold">{rate ? rate.formatted : '—'}</div>
          <div className="text-xs text-gray-500 mt-2">Actualizado: {rate ? new Date(rate.timestamp).toLocaleString() : '—'}</div>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <div className="text-sm text-gray-500">Fuentes activas</div>
          <div className="text-3xl font-semibold">{rate ? (rate.sources?.length || 0) : 0}</div>
          <div className="text-xs text-gray-500 mt-2">{rate?.sources?.join(', ')}</div>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <div className="text-sm text-gray-500">Volatilidad (%)</div>
          <div className={`text-3xl font-semibold ${volatilityWarning ? 'text-red-600' : ''}`}>{rate ? (rate.volatility?.toFixed?.(2) || 0) : 0}</div>
          {volatilityWarning && <div className="text-xs text-red-600 mt-2">Alta volatilidad detectada</div>}
        </div>
      </div>

      <div className="bg-white p-4 rounded shadow mb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Estado de conexión</h2>
          <button onClick={reconnectNow} className="px-3 py-2 bg-blue-600 text-white rounded">Reconectar ahora</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-3 text-sm">
          <div>
            <div className="text-gray-500">Estado</div>
            <div className="text-xl font-semibold">{connectionState}</div>
          </div>
          <div>
            <div className="text-gray-500">Intentos de reconexión</div>
            <div className="text-xl font-semibold">{reconnectCount}</div>
          </div>
          <div>
            <div className="text-gray-500">Modo</div>
            <div className="text-xl font-semibold">{isFallbackMode ? 'fallback (polling)' : 'socket'}</div>
          </div>
          <div>
            <div className="text-gray-500">Latencia último mensaje</div>
            <div className="text-xl font-semibold">{lastLatencyMs != null ? `${lastLatencyMs} ms` : '—'}</div>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded shadow mb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Override manual</h2>
          <button onClick={fetchRate} className="px-3 py-2 bg-gray-100 rounded">Actualizar</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-3">
          <input type="number" step="0.000001" min="0" placeholder="Nueva tasa (HBAR por 1 XRP)" value={overrideRate} onChange={(e)=>setOverrideRate(e.target.value)} className="border p-2 rounded" />
          <input type="text" placeholder="Motivo" value={overrideReason} onChange={(e)=>setOverrideReason(e.target.value)} className="border p-2 rounded" />
          <input type="datetime-local" placeholder="Expira (opcional)" value={overrideExpiresAt} onChange={(e)=>setOverrideExpiresAt(e.target.value)} className="border p-2 rounded" />
          <div className="flex gap-2">
            <button onClick={applyOverride} className="px-4 py-2 bg-blue-600 text-white rounded">Aplicar</button>
            <button onClick={clearOverride} className="px-4 py-2 bg-yellow-600 text-white rounded">Eliminar</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-3">Historial (24h)</h2>
          <div className="max-h-64 overflow-y-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th className="py-2">Hora</th>
                  <th className="py-2">Tasa</th>
                  <th className="py-2">Volatilidad</th>
                </tr>
              </thead>
              <tbody>
                {(history || []).map((h) => (
                  <tr key={h._id} className="border-t">
                    <td className="py-2">{new Date(h.timestamp).toLocaleString()}</td>
                    <td className="py-2">{Number(h.rate).toFixed(6)}</td>
                    <td className="py-2">{Number(h.volatility || 0).toFixed(2)}%</td>
                  </tr>
                ))}
                {(!history || history.length === 0) && (
                  <tr><td className="py-2" colSpan="3">Sin datos</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-3">Métricas</h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-gray-500">Actualizaciones</div>
              <div className="text-xl font-semibold">{metrics?.business?.cache ? 'OK' : ''}</div>
            </div>
            <div>
              <div className="text-gray-500">Edad (s)</div>
              <div className="text-xl font-semibold">{rate ? rate.ageSeconds : '—'}</div>
            </div>
            <div>
              <div className="text-gray-500">Confianza</div>
              <div className="text-xl font-semibold">{rate ? Number(rate.confidence || 0).toFixed(2) : '—'}</div>
            </div>
            <div>
              <div className="text-gray-500">Estado caché</div>
              <div className="text-xl font-semibold">{rate ? rate.cacheStatus : '—'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RateDashboard;
