import React from 'react';

const ErrorReport = ({ error }) => {
  if (!error) return null;
  return (
    <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded">
      {String(error)}
    </div>
  );
};

export default ErrorReport;
