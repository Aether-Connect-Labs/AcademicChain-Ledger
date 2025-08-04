import { Html5QrcodeScanner } from 'html5-qrcode';
import { useEffect } from 'react';

const QRScanner = ({ onScan }) => {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      'reader',
      {
        qrbox: {
          width: 250,
          height: 250,
        },
        fps: 5,
      },
      false
    );

    scanner.render(onScan, () => {});

    return () => {
      scanner.clear();
    };
  }, [onScan]);

  return <div id="reader"></div>;
};

export default QRScanner;