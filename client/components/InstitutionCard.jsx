import React from 'react';

const InstitutionCard = ({ institution, onApprove, onReject, showActions = false, busy = false }) => {
  return (
    <div className="border rounded-lg p-4 shadow-sm hover:shadow-md transition">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-lg">{institution.name || institution.universityName || institution.email}</h3>
          <p className="text-sm text-gray-600">{institution.email}</p>
          {institution.universityName && <p className="text-sm text-gray-600">{institution.universityName}</p>}
          {institution.createdAt && <p className="text-xs text-gray-500">Solicitada: {new Date(institution.createdAt).toLocaleString()}</p>}
        </div>
        {showActions && (
          <div className="flex gap-2">
            <button disabled={busy} onClick={() => onApprove?.(institution._id || institution.id)} className={`btn-primary ${busy?'opacity-50 cursor-not-allowed':''}`}>Aprobar</button>
            <button disabled={busy} onClick={() => onReject?.(institution._id || institution.id)} className={`btn-secondary ${busy?'opacity-50 cursor-not-allowed':''}`}>Rechazar</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default InstitutionCard;
