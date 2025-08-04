import Head from 'next/head';
import React, { Suspense } from 'react';
import { Layout } from '../components/landing/Layout';

import { StatsSection } from '../components/landing/StatsSection';
import { BenefitsSection } from '../components/landing/BenefitsSection';
import { CTASection } from '../components/landing/CTASection';

export default function Home() {

  const HeroSection = React.lazy(() => import('../components/landing/HeroSection'));
  const FeaturesSection = React.lazy(() => import('../components/landing/FeaturesSection'));

  return (
    <>
      <Head>
        <title>AcademicChain Ledger - El Futuro de la Verificación Académica</title>
        <meta name="description" content="Plataforma descentralizada para la emisión y verificación de credenciales académicas como NFTs en Hedera. Inmutable, instantáneo y seguro." />
        <meta name="keywords" content="hedera, hashgraph, blockchain, education, credentials, nft, verification, academic, web3" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Layout>
        <Suspense fallback={<>Loading...</>}>
          <HeroSection />
        </Suspense>
        <StatsSection />
        <Suspense fallback={<>Loading...</>}>
          <FeaturesSection />
        </Suspense>
        <BenefitsSection />
        <CTASection />
      </Layout>
    </>
  );
}