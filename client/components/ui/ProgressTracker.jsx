import React from 'react';

const ProgressTracker = ({ currentStep = 1, totalSteps = 4 }) => {
  return (
    <div className="w-full flex items-center gap-2 mb-4">
      {Array.from({ length: totalSteps }).map((_, i) => (
        <div key={i} className={`flex-1 h-2 rounded ${i + 1 <= currentStep ? 'bg-primary-600' : 'bg-gray-200'}`} />
      ))}
    </div>
  );
};

export default ProgressTracker;