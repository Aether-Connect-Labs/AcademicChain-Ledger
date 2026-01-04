import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { useWebSocket } from './useWebSocket';
import '../styles/charts.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const services = ['mongodb', 'redis', 'hedera', 'xrpl', 'rate_oracle'];
const colors = {
  mongodb: { border: '#3b82f6', bg: 'rgba(59,130,246,0.2)' },
  redis: { border: '#f97316', bg: 'rgba(249,115,22,0.2)' },
  hedera: { border: '#16a34a', bg: 'rgba(22,163,74,0.2)' },
  xrpl: { border: '#ef4444', bg: 'rgba(239,68,68,0.2)' },
  rate_oracle: { border: '#a855f7', bg: 'rgba(168,85,247,0.2)' }
};

const maxPoints = 30;

const SystemLatencyChart = () => {
  const { subscribe, unsubscribe } = useWebSocket();
  const [labels, setLabels] = useState([]);
  const [dataMap, setDataMap] = useState(() => Object.fromEntries(services.map(s => [s, []])));
  const [lastServices, setLastServices] = useState({});

  const pushPoint = useCallback((ts, svc) => {
    setLabels(prev => {
      const next = [...prev, ts].slice(-maxPoints);
      return next;
    });
    setDataMap(prev => {
      const next = { ...prev };
      for (const s of services) {
        const v = Number(svc?.[s]?.latencyMs || 0);
        next[s] = [...(next[s] || []), v].slice(-maxPoints);
      }
      return next;
    });
    setLastServices(svc || {});
  }, []);

  useEffect(() => {
    const onHealth = (snapshot) => {
      const ts = snapshot?.timestamp || new Date().toISOString();
      pushPoint(ts, snapshot?.services || {});
    };
    subscribe('health:update', onHealth);
    return () => {
      unsubscribe('health:update', onHealth);
    };
  }, [subscribe, unsubscribe, pushPoint]);

  const avgLatency = useMemo(() => {
    const latest = services.map(s => {
      const arr = dataMap[s] || [];
      return arr.length ? arr[arr.length - 1] : 0;
    });
    const sum = latest.reduce((a, b) => a + Number(b || 0), 0);
    return Math.round(sum / (latest.length || 1));
  }, [dataMap]);

  const degradedCount = useMemo(() => {
    let count = 0;
    for (const s of services) {
      const d = lastServices?.[s] || {};
      const lat = Number(d.latencyMs || 0);
      const healthy = !!d.healthy;
      const threshold = parseInt(import.meta.env.VITE_RUNTIME_DEGRADE_THRESHOLD_MS || '5000', 10);
      if (!healthy || lat > threshold) count++;
    }
    return count;
  }, [lastServices]);

  const reset = useCallback(() => {
    setLabels([]);
    setDataMap(Object.fromEntries(services.map(s => [s, []])));
  }, []);

  const chartData = useMemo(() => ({
    labels,
    datasets: services.map(s => ({
      label: s.toUpperCase(),
      data: dataMap[s] || [],
      borderColor: colors[s].border,
      backgroundColor: colors[s].bg,
      tension: 0.25,
      pointRadius: 0.5,
      borderWidth: 2
    }))
  }), [labels, dataMap]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { position: 'bottom' },
      title: { display: false }
    },
    scales: {
      x: { grid: { display: false } },
      y: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { callback: v => `${v} ms` } }
    }
  }), []);

  return (
    <div className="latency-chart-container">
      <div className="chart-header">
        <h3>Latencia de servicios</h3>
        <div className="chart-stats">
          <span className="stat-badge">Promedio: {avgLatency} ms</span>
          <span className="stat-badge">Degradados: {degradedCount}</span>
        </div>
      </div>
      <div className="chart-wrapper">
        {labels.length === 0 ? (
          <div className="latency-chart-placeholder">
            <p>Esperando datos de salud del sistema…</p>
            <span>Se actualizará automáticamente</span>
          </div>
        ) : (
          <Line data={chartData} options={options} />
        )}
      </div>
      <div className="chart-footer">
        <span>Datos en tiempo real vía WebSocket</span>
        <div>
          <button className="btn-reset" onClick={reset}>Reset</button>
        </div>
      </div>
    </div>
  );
};

export default SystemLatencyChart;

