// client/pages/HomePage.js
import React from 'react';
import { Link } from 'react-router-dom';
import { HeroSection } from './HeroSection';
import FeaturesSection from "./FeaturesSection";
import CTASection from './CTASection';

const HomePage = () => {
  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <CTASection variant="secondary" />
      <div id="demo" className="container mx-auto px-4 py-10">
        <div className="card p-6 text-center">
          <h3 className="text-xl font-semibold mb-2">Explorar sin Registro</h3>
          <p className="text-gray-600 mb-4">Prueba la experiencia en tiempo real: emisión y verificación instantánea.</p>
          <div className="flex justify-center gap-3">
            <Link to="/demo/institution" className="btn-secondary">Ver Demo Institución</Link>
            <Link to="/demo/student" className="btn-primary">Ver Demo Alumno</Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default HomePage;
