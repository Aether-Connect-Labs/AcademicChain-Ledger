import React from 'react';

const HederaStatus = ({ isConnected, accountId, balance, isCompact = false, onConnect }) => {
  return (
    <div className={`flex items-center ${isCompact ? 'justify-center' : 'justify-between'} gap-3`}>
      <div className={`flex items-center gap-2 ${isConnected ? 'text-green-600' : 'text-gray-500'}`}>
        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'} animate-pulse`} />
        <span className="text-sm">{isConnected ? 'Conectado a Hedera' : 'Desconectado'}</span>
      </div>
      {!isCompact && (
        <div className="flex items-center gap-2 text-xs text-gray-600">
          {accountId && <span className="font-mono">{accountId}</span>}
          {balance?.hbars != null && <span>{balance.hbars} ℏ</span>}
        </div>
      )}
      {!isConnected && (
        <button onClick={onConnect} className="btn-primary text-xs hover-lift">Conectar</button>
      )}
    </div>
  );
};

export default HederaStatus;