import React, { useEffect, useState } from 'react';

const TourBadge = () => {
  const [completed, setCompleted] = useState(() => localStorage.getItem('interactive_tour_completed') === '1');

  useEffect(() => {
    const onStorage = () => setCompleted(localStorage.getItem('interactive_tour_completed') === '1');
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  if (!completed) return null;

  const restart = () => {
    localStorage.removeItem('interactive_tour_completed');
    setCompleted(false);
    window.dispatchEvent(new CustomEvent('tour:restart'));
  };

  return (
    <div className="inline-flex items-center gap-3 bg-white border border-gray-200 shadow-soft rounded-xl px-4 py-2">
      <span className="text-base">🏆</span>
      <div className="text-sm">
        <div className="font-semibold text-gray-800">Tour completado</div>
        <div className="text-gray-600">Puedes repetirlo cuando quieras</div>
      </div>
      <button className="btn-secondary btn-sm ml-4" onClick={restart}>Repetir</button>
    </div>
  );
};

export default TourBadge;

