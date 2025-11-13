// client/pages/HomePage.js
import React from 'react';
import { HeroSection } from '../components/HeroSection';
import BenefitsCarousel from '../components/BenefitsSection';
import { CTASection } from '../components/CTASection';

const HomePage = () => {
  return (
    <>
      <HeroSection />
      {/* <BenefitsCarousel benefits={[]} /> */}
      <CTASection variant="secondary" />
    </>
  );
};

export default HomePage;