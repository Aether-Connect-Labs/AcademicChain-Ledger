import React from 'react';

const CredentialPreview = ({ credential }) => {
  return (
    <div className="border rounded p-3">
      <div className="font-semibold">{credential?.subject?.name}</div>
      <div className="text-sm text-gray-600">{credential?.subject?.degree}</div>
    </div>
  );
};

export default CredentialPreview;