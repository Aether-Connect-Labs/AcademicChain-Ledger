import React, { useMemo, useCallback } from 'react';

/**
Usage:
<AccessibleList
  title="Título"
  items={[{ id: 1, label: 'Item' }]}
  onSelect={(id) => console.log(id)}
/>
*/

const AccessibleList = React.memo(function AccessibleList({ title, items = [], onSelect }) {
  const count = items.length;
  const list = useMemo(() => items.map(i => ({ ...i })), [items]);
  const handleSelect = useCallback((id) => { onSelect?.(id); }, [onSelect]);
  return (
    <section aria-label={title} className="w-full max-w-xl mx-auto p-4 bg-white rounded-xl border border-gray-200 shadow-soft">
      <header className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        <span className="text-sm text-gray-500" aria-live="polite">{count} elementos</span>
      </header>
      <ul role="list" className="space-y-2">
        {list.map(item => (
          <li key={item.id} className="flex items-center justify-between px-3 py-2 rounded-lg border hover:bg-gray-50">
            <span className="text-gray-800">{item.label}</span>
            <button
              type="button"
              aria-label={`Seleccionar ${item.label}`}
              className="px-3 py-1 text-sm rounded-md bg-blue-600 text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={() => handleSelect(item.id)}
            >
              Seleccionar
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
});

export default AccessibleList;
