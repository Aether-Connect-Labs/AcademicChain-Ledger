import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

const StatsChart = ({ stats, onSegmentClick }) => {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    if (chartRef.current) chartRef.current.destroy();
    const ctx = canvasRef.current.getContext('2d');
    const values = [Number(stats.pending || 0), Number(stats.approved || 0), Number(stats.rejected || 0)];
    const total = values.reduce((a, b) => a + b, 0);
    const perc = total > 0 ? values.map(v => Math.round((v / total) * 100)) : [0, 0, 0];
    if (total > 0) {
      chartRef.current = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: [
            `Pendientes (${perc[0]}%)`,
            `Aprobadas (${perc[1]}%)`,
            `Rechazadas (${perc[2]}%)`
          ],
          datasets: [{
            data: values,
            backgroundColor: ['#FFA726', '#4CAF50', '#F44336'],
            borderWidth: 3,
            borderColor: '#ffffff',
            hoverBackgroundColor: ['#FFB74D', '#66BB6A', '#EF5350'],
            hoverBorderWidth: 4,
            hoverOffset: 8
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '65%',
          animation: {
            animateScale: true,
            animateRotate: true,
            duration: 1000,
            easing: 'easeOutQuart'
          },
          transitions: {
            active: { animation: { duration: 300 } },
            show: {
              animations: {
                colors: { from: 'transparent' },
                opacity: { duration: 500 }
              }
            }
          },
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                padding: 20,
                usePointStyle: true,
                font: { size: 12, family: 'system-ui', weight: '500' },
                color: '#374151',
                generateLabels: function (chart) {
                  const d = chart.data;
                  if (d.labels.length && d.datasets.length) {
                    return d.labels.map((label, i) => {
                      const val = d.datasets[0].data[i];
                      const color = d.datasets[0].backgroundColor[i];
                      return {
                        text: `${label} - ${val} instituciones`,
                        fillStyle: color,
                        strokeStyle: color,
                        pointStyle: 'circle',
                        pointRadius: 6,
                        index: i
                      };
                    });
                  }
                  return [];
                }
              }
            },
            tooltip: {
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              titleColor: '#1F2937',
              bodyColor: '#374151',
              borderColor: '#E5E7EB',
              borderWidth: 1,
              cornerRadius: 8,
              padding: 12,
              displayColors: true,
              boxPadding: 6,
              callbacks: {
                label: function (context) {
                  const lbl = String(context.label || '').split(' (')[0];
                  const val = Number(context.raw || 0);
                  const p = perc[context.dataIndex] || 0;
                  return `${lbl}: ${val} instituciones (${p}%)`;
                },
                title: function () { return 'Distribución de Instituciones'; }
              }
            }
          },
          interaction: { intersect: false, mode: 'index' },
          onHover: (event, el) => {
            if (event && event.native && event.native.target) {
              event.native.target.style.cursor = el.length > 0 ? 'pointer' : 'default';
            }
          },
          onClick: (event, el) => {
            if (el && el.length > 0 && typeof onSegmentClick === 'function') {
              const i = el[0].index;
              const keys = ['pending', 'approved', 'rejected'];
              const key = keys[i];
              const val = values[i];
              if (val > 0) {
                onSegmentClick(key);
                if (canvasRef.current) {
                  canvasRef.current.style.transition = 'transform 150ms ease';
                  canvasRef.current.style.transform = 'scale(1.02)';
                  setTimeout(() => { if (canvasRef.current) canvasRef.current.style.transform = 'scale(1)'; }, 180);
                }
              }
            }
          }
        }
      });
    }
    return () => { if (chartRef.current) chartRef.current.destroy(); };
  }, [stats, onSegmentClick]);

  const total = Number(stats.pending || 0) + Number(stats.approved || 0) + Number(stats.rejected || 0);
  const p0 = total > 0 ? Math.round((Number(stats.pending || 0) / total) * 100) : 0;
  const p1 = total > 0 ? Math.round((Number(stats.approved || 0) / total) * 100) : 0;
  const p2 = total > 0 ? Math.round((Number(stats.rejected || 0) / total) * 100) : 0;

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="text-lg font-semibold text-gray-900 mb-4">📊 Distribución de Instituciones</div>
      {total === 0 ? (
        <div className="flex flex-col items-center justify-center h-48">
          <div className="text-4xl mb-2">📈</div>
          <p className="text-gray-500 text-center">No hay datos para mostrar</p>
          <p className="text-sm text-gray-400 mt-1">Las instituciones aparecerán aquí una vez registradas</p>
        </div>
      ) : (
        <>
          <div className="relative h-48 mb-4">
            <canvas ref={canvasRef} />
          </div>
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1 mb-1">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                <span className="text-sm font-medium text-gray-700">Pendientes</span>
              </div>
              <p className="text-2xl font-bold text-orange-600">{Number(stats.pending || 0)}</p>
              <p className="text-xs text-gray-500">{p0}% del total</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1 mb-1">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-sm font-medium text-gray-700">Aprobadas</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{Number(stats.approved || 0)}</p>
              <p className="text-xs text-gray-500">{p1}% del total</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1 mb-1">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-sm font-medium text-gray-700">Rechazadas</span>
              </div>
              <p className="text-2xl font-bold text-red-600">{Number(stats.rejected || 0)}</p>
              <p className="text-xs text-gray-500">{p2}% del total</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default StatsChart;
