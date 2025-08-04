import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="es">
      <Head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Sistema Global de Credenciales Académicas en Hedera Hashgraph" />
        <meta name="keywords" content="hedera, hashgraph, blockchain, education, credentials, nft, verification" />
        <meta name="author" content="AcademicChain Ledger Team" />
        
        {/* Open Graph */}
        <meta property="og:title" content="AcademicChain Ledger - Credenciales Académicas" />
        <meta property="og:description" content="Sistema antifraude de verificación académica en Hedera Hashgraph" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://academicchain-ledger.com" />
        <meta property="og:image" content="https://academicchain-ledger.com/og-image.png" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="AcademicChain Ledger - Credenciales Académicas" />
        <meta name="twitter:description" content="Sistema antifraude de verificación académica en Hedera Hashgraph" />
        <meta name="twitter:image" content="https://academicchain-ledger.com/og-image.png" />
        
        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        
        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Theme color */}
        <meta name="theme-color" content="#2563eb" />
        <meta name="msapplication-TileColor" content="#2563eb" />
      </Head>
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
} 