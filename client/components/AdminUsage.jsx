import React, { useEffect, useMemo, useState } from 'react';
import AdminAPI from './services/adminAPI';
import { Toaster, toast } from 'react-hot-toast';
import '../styles/tables.css';

const AdminUsage = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [sortKey, setSortKey] = useState('credentials');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [minVerifications, setMinVerifications] = useState(0);
  const [savedViews, setSavedViews] = useState(() => {
    try {
      const saved = localStorage.getItem('admin_saved_views');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'demo_high_activity',
        name: '🚀 Demo: Alta Actividad',
        filters: {
          searchTerm: '',
          selectedType: 'active',
          minVerifications: 50,
          sortConfig: { key: 'verifications30d', direction: 'desc' }
        }
      },
      {
        id: 'demo_inactive',
        name: '⏸️ Demo: Instituciones Inactivas',
        filters: {
          searchTerm: '',
          selectedType: 'inactive',
          sortConfig: { key: 'universityName', direction: 'asc' }
        }
      },
      {
        id: 'demo_search_university',
        name: '🎓 Demo: Buscar "University"',
        filters: {
          searchTerm: 'university',
          selectedType: 'all',
          sortConfig: { key: 'credentials', direction: 'desc' }
        }
      }
    ];
  });
  const [currentView, setCurrentView] = useState('default');
  const [isSavingView, setIsSavingView] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const r = await AdminAPI.getUsageByInstitution();
      const data = r.data || r;
      setRows(Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []));
    } catch (e) {
      setError('Error al cargar uso por institución');
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const activePredicate = (r) => Number(r.activeTokens || 0) > 0 || Number(r.verifications30d || 0) > 0;
  const filtered = useMemo(() => {
    let list = Array.isArray(rows) ? rows : [];
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(r =>
        String(r.universityName || '').toLowerCase().includes(q) ||
        String(r.email || '').toLowerCase().includes(q) ||
        String(r.universityId || '').toLowerCase().includes(q)
      );
    }
    if (status === 'active') list = list.filter(activePredicate);
    if (status === 'inactive') list = list.filter(r => !activePredicate(r));
    if (Number(minVerifications || 0) > 0) list = list.filter(r => Number(r.verifications30d || 0) >= Number(minVerifications));
    return list;
  }, [rows, query, status, minVerifications]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    list.sort((a, b) => {
      const va = a[sortKey] ?? '';
      const vb = b[sortKey] ?? '';
      const na = typeof va === 'number' ? va : (Number(va) || String(va).toLowerCase());
      const nb = typeof vb === 'number' ? vb : (Number(vb) || String(vb).toLowerCase());
      if (na < nb) return sortDir === 'asc' ? -1 : 1;
      if (na > nb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const pageRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, page, pageSize]);

  const stats = useMemo(() => {
    const total = rows.length;
    const active = rows.filter(activePredicate).length;
    const inactive = Math.max(0, total - active);
    const totalCreds = rows.reduce((a, r) => a + Number(r.credentials || 0), 0);
    return { total, active, inactive, totalCreds };
  }, [rows]);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const clearQuery = () => setQuery('');
  const exportCSV = () => {
    const headers = ['universityId','universityName','email','credentials','activeTokens','verifications30d'];
    const lines = [headers.join(',')].concat(sorted.map(r => headers.map(h => {
      const v = r[h] ?? '';
      const s = String(v);
      const needsQuotes = s.includes(',') || s.includes('"') || s.includes('\n');
      const escaped = s.replace(/"/g, '""');
      return needsQuotes ? `"${escaped}"` : escaped;
    }).join(',')));
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'institutions_usage.csv';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 500);
  };
  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(sorted, null, 2)], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'institutions_usage.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 500);
  };
  const applySavedView = (viewId) => {
    const view = savedViews.find(v => v.id === viewId);
    if (view) {
      const f = view.filters || {};
      setQuery(f.searchTerm || '');
      setStatus(f.selectedType || 'all');
      setMinVerifications(Number(f.minVerifications || 0));
      const sc = f.sortConfig || { key: 'verifications30d', direction: 'desc' };
      setSortKey(sc.key || 'verifications30d');
      setSortDir(sc.direction || 'desc');
      setPage(1);
      setCurrentView(viewId);
      toast.success(`Aplicada vista: ${view.name}`);
    }
  };
  const saveCurrentView = () => {
    const viewName = prompt('Nombre para esta vista:', `Vista ${new Date().toLocaleDateString()}`);
    if (!viewName) return;
    setIsSavingView(true);
    const newView = {
      id: `view_${Date.now()}`,
      name: viewName,
      filters: {
        searchTerm: query,
        selectedType: status,
        minVerifications,
        sortConfig: { key: sortKey, direction: sortDir }
      },
      createdAt: new Date().toISOString()
    };
    const updated = [...savedViews, newView];
    setSavedViews(updated);
    try { localStorage.setItem('admin_saved_views', JSON.stringify(updated)); } catch {}
    setIsSavingView(false);
    toast.success(`Vista "${viewName}" guardada`);
  };
  const deleteSavedView = (viewId, e) => {
    e?.stopPropagation?.();
    if (!confirm('¿Eliminar esta vista guardada?')) return;
    const updated = savedViews.filter(v => v.id !== viewId);
    setSavedViews(updated);
    try { localStorage.setItem('admin_saved_views', JSON.stringify(updated)); } catch {}
    if (currentView === viewId) setCurrentView('default');
    toast.success('Vista eliminada');
  };

  return (
    <div className="admin-usage-container">
      <Toaster position="top-right" toastOptions={{ style: { borderRadius: '8px', padding: '8px 12px' } }} />
      <div className="page-header">
        <h2 className="text-2xl font-bold text-gray-800">Uso por institución</h2>
        <div className="flex gap-2">
          <button className="btn-secondary" onClick={load}>Actualizar</button>
        </div>
      </div>
      {loading ? (
        <div className="text-sm text-gray-500">Cargando…</div>
      ) : error ? (
        <div className="text-sm text-red-600">{error}</div>
      ) : (
        <>
          <div className="tools-bar">
            <div className="quick-stats">
              <div className="stat-item">
                <span className="stat-label">Total instituciones</span>
                <span className="stat-value">{stats.total}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Activas</span>
                <span className="stat-value active">{stats.active}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Inactivas</span>
                <span className="stat-value">{stats.inactive}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Credenciales totales</span>
                <span className="stat-value">{stats.totalCreds}</span>
              </div>
            </div>
            <div className="filter-controls">
              <div className="search-box">
                <input className="search-input" placeholder="Buscar por nombre, email o ID…" value={query} onChange={(e)=>{ setQuery(e.target.value); setPage(1); }} />
                {query && <button className="btn-clear" onClick={clearQuery}>×</button>}
              </div>
              <select className="filter-select" value={status} onChange={(e)=>{ setStatus(e.target.value); setPage(1); }}>
                <option value="all">Todas</option>
                <option value="active">Activas</option>
                <option value="inactive">Inactivas</option>
              </select>
              <input className="filter-select" type="number" min="0" placeholder="Mín verif. 30d" value={minVerifications} onChange={(e)=>{ setMinVerifications(Number(e.target.value || 0)); setPage(1); }} />
              <select className="filter-select" value={pageSize} onChange={(e)=>{ setPageSize(Number(e.target.value)); setPage(1); }}>
                <option value={10}>10 por página</option>
                <option value={20}>20 por página</option>
                <option value={50}>50 por página</option>
              </select>
            </div>
          </div>
          <div className="saved-views-section">
            <div className="views-header">
              <h3>📁 Vistas Guardadas</h3>
              <div className="views-actions">
                <button className="btn-view-action" onClick={saveCurrentView} disabled={isSavingView}>
                  {isSavingView ? 'Guardando...' : '💾 Guardar Vista Actual'}
                </button>
                <button className="btn-view-action" onClick={() => {
                  setQuery('');
                  setStatus('all');
                  setMinVerifications(0);
                  setSortKey('verifications30d');
                  setSortDir('desc');
                  setPage(1);
                  setCurrentView('default');
                  toast.success('Vista restaurada a valores por defecto');
                }}>
                  🔄 Restaurar por defecto
                </button>
              </div>
            </div>
            <div className="views-grid">
              <div className={`view-card ${currentView === 'default' ? 'active' : ''}`} onClick={() => applySavedView('default')}>
                <div className="view-icon">🏠</div>
                <div className="view-content">
                  <h4>Vista por defecto</h4>
                  <p>Todas las instituciones, ordenadas por actividad</p>
                </div>
              </div>
              {savedViews.map(view => (
                <div key={view.id} className={`view-card ${currentView === view.id ? 'active' : ''}`} onClick={() => applySavedView(view.id)}>
                  <div className="view-icon">{view.name.includes('Demo') ? '🎬' : '📊'}</div>
                  <div className="view-content">
                    <h4>{view.name}</h4>
                    <p className="view-filters">
                      {view.filters?.searchTerm ? `Buscar: "${view.filters.searchTerm}" • ` : ''}
                      {view.filters?.selectedType === 'active' ? 'Solo activas • ' : ''}
                      {view.filters?.selectedType === 'inactive' ? 'Solo inactivas • ' : ''}
                      {Number(view.filters?.minVerifications || 0) > 0 ? `Verif. ≥${view.filters.minVerifications} • ` : ''}
                      Orden: {view.filters?.sortConfig?.key} ({view.filters?.sortConfig?.direction})
                    </p>
                    {view.createdAt && (
                      <small className="view-date">Creada: {new Date(view.createdAt).toLocaleDateString()}</small>
                    )}
                  </div>
                  <button className="btn-delete-view" onClick={(e) => deleteSavedView(view.id, e)}>✕</button>
                </div>
              ))}
              <div className="view-card new-view" onClick={saveCurrentView}>
                <div className="view-icon">+</div>
                <div className="view-content">
                  <h4>Guardar nueva vista</h4>
                  <p>Captura filtros y orden actual</p>
                </div>
              </div>
            </div>
          </div>
          <div className="results-info">
            Resultados: {filtered.length} · Página {page} de {totalPages}
          </div>
          <div className="table-container">
            <table className="institution-table">
              <thead>
                <tr>
                  <th className="sortable" onClick={()=>toggleSort('universityName')}>Institución</th>
                  <th className="sortable" onClick={()=>toggleSort('email')}>Email</th>
                  <th className="sortable" onClick={()=>toggleSort('credentials')}>Credenciales</th>
                  <th className="sortable" onClick={()=>toggleSort('activeTokens')}>Tokens activos</th>
                  <th className="sortable" onClick={()=>toggleSort('verifications30d')}>Verificaciones (30d)</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((r) => {
                  const isActive = activePredicate(r);
                  return (
                    <tr key={r.universityId}>
                      <td>
                        <div className="institution-name">
                          <span className="contact-name">{r.universityName || 'Sin nombre'}</span>
                          <span className="institution-id">{r.universityId}</span>
                        </div>
                      </td>
                      <td>
                        <span className="contact-email">{r.email || ''}</span>
                      </td>
                      <td>
                        <div className="metric-cell">
                          <span className="metric-value">{r.credentials}</span>
                          <span className="metric-badge high">{Number(r.credentials || 0) > 100 ? 'alto' : 'medio'}</span>
                        </div>
                      </td>
                      <td>
                        <div className="metric-cell">
                          <span className="metric-value">{r.activeTokens}</span>
                          <span className="metric-badge active">{Number(r.activeTokens || 0) > 0 ? 'activos' : 'sin activos'}</span>
                </div>
                      </td>
                      <td>
                        <div className="metric-cell">
                          <span className="metric-value">{r.verifications30d}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge ${isActive ? 'active' : 'inactive'}`}>{isActive ? 'Activa' : 'Inactiva'}</span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button className="btn-action btn-view" onClick={() => window.open(AdminAPI.reportUrl(`/api/public/verify`), '_blank', 'noopener,noreferrer')}>Verificar</button>
                          <button className="btn-action btn-email" disabled={!r.email} onClick={() => window.location.href = `mailto:${r.email}`}>Email</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {pageRows.length === 0 && (
                  <tr>
                    <td colSpan={7}>
                      <div className="no-results">No hay resultados</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="pagination">
            <button className="btn-pagination" disabled={page<=1} onClick={()=>setPage(p=>Math.max(1,p-1))}>Anterior</button>
            <span className="page-info">Página {page} de {totalPages}</span>
            <button className="btn-pagination" disabled={page>=totalPages} onClick={()=>setPage(p=>Math.min(totalPages,p+1))}>Siguiente</button>
          </div>
          <div className="export-section">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold text-gray-800">Exportar resultados</div>
                <div className="text-sm text-gray-600">Exporta la vista actual filtrada y ordenada</div>
              </div>
              <div className="export-buttons">
                <button className="btn-export" onClick={exportCSV}>CSV</button>
                <button className="btn-export" onClick={exportJSON}>JSON</button>
                <a className="btn-export" href={AdminAPI.reportUrl('/api/admin/reports/credentials.csv')} target="_blank" rel="noreferrer">CSV Global</a>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminUsage;
