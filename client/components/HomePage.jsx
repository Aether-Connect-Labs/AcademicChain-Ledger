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
      <div className="container mx-auto px-4 py-10">
        <div className="card p-6 text-center">
          <h3 className="text-xl font-semibold mb-2">Probar en Modo Demo</h3>
          <p className="text-gray-600 mb-4">Explora la plataforma sin cuenta: emisión simulada y verificación con cámara.</p>
          <div className="flex justify-center gap-3">
            <a href="/demo/institution" className="btn-secondary">Ver Demo Institución</a>
            <a href="/demo/student" className="btn-primary">Ver Demo Alumno</a>
          </div>
        </div>
      </div>
    </>
  );
};

export default HomePage;
