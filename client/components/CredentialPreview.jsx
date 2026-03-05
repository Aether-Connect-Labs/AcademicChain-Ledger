import React from 'react';

const CredentialPreview = ({ credential }) => {
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded p-3 bg-white dark:bg-gray-800">
      <div className="font-semibold text-gray-900 dark:text-white">{credential?.subject?.name}</div>
      <div className="text-sm text-gray-600 dark:text-gray-400">{credential?.subject?.degree}</div>
    </div>
  );
};

export default CredentialPreview;
