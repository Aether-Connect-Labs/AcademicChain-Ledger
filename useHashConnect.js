import { HashConnect } from 'hashconnect';
import { useState, useEffect, useCallback } from 'react';

const appMetadata = {
  name: "AcademicChain Ledger",
  description: "The official platform for academic credential verification.",
  icon: "https://www.academicchain-ledger.com/favicon.ico" // URL a tu ícono
};

let hashconnect;

export const useHashConnect = () => {
  const [pairingData, setPairingData] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const initialize = useCallback(async () => {
    if (!hashconnect) {
      hashconnect = new HashConnect(true); // true para modo debug
    }

    if (!pairingData) {
      // Inicializar y establecer la conexión
      const initData = await hashconnect.init(appMetadata, "testnet", false);
      const privateKey = initData.privKey;

      // Cargar sesión existente si la hay
      const storedSession = localStorage.getItem("hashconnectData");
      if (storedSession) {
        const foundPairingData = JSON.parse(storedSession);
        setPairingData(foundPairingData);
      }
    }
  }, [pairingData]);

  const connect = useCallback(async () => {
    if (!hashconnect) {
      throw new Error("HashConnect not initialized");
    }
    if (pairingData) return; // Ya está conectado

    setIsConnecting(true);
    const pairingString = hashconnect.generatePairingString();

    // Mostrar el QR para que el usuario lo escanee con HashPack
    hashconnect.findLocalWallets();
    hashconnect.connectToLocalWallet(pairingString);

    hashconnect.pairingEvent.once((data) => {
      setPairingData(data);
      localStorage.setItem("hashconnectData", JSON.stringify(data));
      setIsConnecting(false);
    });
  }, [pairingData]);

  const signTransaction = useCallback(async (transactionBytes) => {
    if (!hashconnect || !pairingData) {
      throw new Error("Not connected to HashPack");
    }

    const transaction = {
      topic: pairingData.topic,
      byteArray: transactionBytes,
      metadata: { accountToSign: pairingData.accountIds[0], returnTransaction: true }
    };

    const result = await hashconnect.sendTransaction(pairingData.topic, transaction);
    return result.signedTransaction; // Devuelve los bytes de la transacción firmada
  }, [pairingData]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return { connect, signTransaction, isConnecting, accountId: pairingData?.accountIds[0] };
};