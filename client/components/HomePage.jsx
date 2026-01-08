// client/pages/HomePage.js
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HeroSection } from './HeroSection';
import FeaturesSection from "./FeaturesSection";
import CTASection from './CTASection';

const HomePage = () => {
  return (
    <>
      <div className="relative bg-gray-900">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(800px 600px at 10% 10%, rgba(16,185,129,0.15), transparent), radial-gradient(600px 400px at 90% 20%, rgba(168,85,247,0.12), transparent)' }} />
        <HeroSection />
      </div>
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.5 }}
        className="container-responsive pb-16"
      >
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900">Cómo Funciona</h2>
          <p className="mt-2 text-gray-800 md:text-gray-900 font-medium">Sube, sella y verifica títulos con integridad criptográfica</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <motion.div className="p-6 rounded-xl bg-gray-900/80 border border-gray-800 shadow-soft" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <div className="text-2xl mb-3">📤</div>
            <div className="font-semibold text-white">Subida de PDF</div>
            <div className="text-sm text-gray-300 mt-1">Carga el diploma al sistema y genera su hash.</div>
          </motion.div>
          <motion.div className="p-6 rounded-xl bg-gray-900/80 border border-gray-800 shadow-soft" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <div className="text-2xl mb-3">🔒</div>
            <div className="font-semibold text-white">Sello ACL</div>
            <div className="text-sm text-gray-300 mt-1">Validación de asociación al token ACL antes de emitir.</div>
          </motion.div>
          <motion.div className="p-6 rounded-xl bg-gray-900/80 border border-gray-800 shadow-soft" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <div className="text-2xl mb-3">🧾</div>
            <div className="font-semibold text-white">Registro Hedera</div>
            <div className="text-sm text-gray-300 mt-1">Emisión del NFT con metadatos inmutables.</div>
          </motion.div>
          <motion.div className="p-6 rounded-xl bg-gray-900/80 border border-gray-800 shadow-soft" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
            <div className="text-2xl mb-3">✅</div>
            <div className="font-semibold text-white">Verificación Pública</div>
            <div className="text-sm text-gray-300 mt-1">Consulta abierta vía HashScan y portal público.</div>
          </motion.div>
        </div>
      </motion.section>
      <FeaturesSection />
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.5 }}
        className="container-responsive pb-16"
      >
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">Planes y Precios</h2>
          <p className="text-gray-600">Escala según tus necesidades. Sin fricción.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">Plan Esencial</div>
              <div className="inline-flex items-center px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs">🛡️ IPFS + Filecoin</div>
            </div>
            <div className="text-3xl font-extrabold mt-1">$49/mes</div>
            <ul className="mt-4 text-gray-700 space-y-2">
              <li>Sello de Veracidad Hedera</li>
              <li>Verificación instantánea</li>
              <li>Portal alumno</li>
            </ul>
            <div className="mt-6">
              <Link to="/comenzar-gratis" className="btn-primary w-full">Comenzar</Link>
            </div>
          </div>
          <div className="card p-6 border-2 border-purple-500">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">Plan Profesional</div>
              <div className="inline-flex items-center px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs">🛡️ IPFS + Filecoin</div>
            </div>
            <div className="text-3xl font-extrabold mt-1">$99/mes</div>
            <ul className="mt-4 text-gray-700 space-y-2">
              <li>Doble Sello: Hedera + XRP Ledger</li>
              <li>1000 emisiones</li>
              <li>API de integración</li>
            </ul>
            <div className="mt-6">
              <Link to="/precios" className="btn-secondary w-full">Ver detalles</Link>
            </div>
          </div>
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">Plan Global Enterprise</div>
              <div className="inline-flex items-center px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs">🛡️ IPFS + Filecoin</div>
            </div>
            <div className="text-3xl font-extrabold mt-1">A medida</div>
            <ul className="mt-4 text-gray-700 space-y-2">
              <li>Triple Blindaje: Hedera + XRP + Algorand</li>
              <li>On-prem + SLA</li>
              <li>Cumplimiento y auditoría</li>
            </ul>
            <div className="mt-6">
              <Link to="/agenda" className="btn-secondary w-full">Agendar demo</Link>
            </div>
          </div>
        </div>
      </motion.section>
      <CTASection variant="secondary" />
      <div id="demo" className="container mx-auto px-4 pb-10">
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
