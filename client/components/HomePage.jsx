// client/pages/HomePage.js
import React from 'react';
import { HeroSection } from './HeroSection';
import FeaturesSection from "./FeaturesSection";
import CTASection from './CTASection';

const HomePage = () => {
  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <CTASection variant="secondary" />
    </>
  );
};

export default HomePage;