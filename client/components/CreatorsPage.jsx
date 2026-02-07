import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const CreatorsPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      {/* Hero Section */}
      <section className="relative bg-indigo-900 text-white py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-900 to-purple-900 opacity-90"></div>
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80')] bg-cover bg-center mix-blend-overlay opacity-20"></div>
        <div className="container-responsive relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight">
              Certifica tu Conocimiento y <span className="text-cyan-400">Marca Personal</span>
            </h1>
            <p className="text-xl md:text-2xl text-indigo-100 max-w-3xl mx-auto mb-10">
              Otorga valor real y verificable a tus cursos, mentorías y talleres en sectores sin jurisdicción tradicional.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link to="/portal-creadores" className="px-8 py-4 bg-cyan-500 hover:bg-cyan-400 text-white font-bold rounded-lg transition-all shadow-lg hover:shadow-cyan-500/25">
                Probar Demo Interactiva
              </Link>
              <Link to="/agenda" className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg backdrop-blur-sm transition-all border border-white/20">
                Agendar Reunión
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="py-16">
        <div className="container-responsive">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Potencia tu Comunidad</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              La educación descentralizada necesita confianza. AcademicChain Ledger te permite emitir credenciales inmutables.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 bg-white rounded-xl shadow-soft border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-4">🎓</div>
              <h3 className="text-xl font-bold mb-3">Valor Educativo</h3>
              <p className="text-gray-600">
                Transforma tus cursos y talleres en certificaciones con respaldo tecnológico, aumentando la tasa de finalización y el valor percibido.
              </p>
            </div>
            <div className="p-8 bg-white rounded-xl shadow-soft border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-4">🚀</div>
              <h3 className="text-xl font-bold mb-3">Sin Burocracia</h3>
              <p className="text-gray-600">
                Ideal para sectores emergentes y sin jurisdicción oficial. Tú defines los estándares, la blockchain garantiza la autenticidad.
              </p>
            </div>
            <div className="p-8 bg-white rounded-xl shadow-soft border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-4">💎</div>
              <h3 className="text-xl font-bold mb-3">Marca Personal</h3>
              <p className="text-gray-600">
                Refuerza tu autoridad. Cada certificado emitido lleva tu firma digital y fortalece tu posicionamiento como experto.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-16 bg-gray-100">
        <div className="container-responsive">
          <h2 className="text-3xl font-bold text-center mb-12">Ideal Para</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {['Mentores de Negocios', 'Creadores de Cursos', 'Influencers Educativos', 'Bootcamps Tech'].map((item, i) => (
              <div key={i} className="bg-white p-6 rounded-lg text-center font-semibold shadow-sm text-gray-800">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default CreatorsPage;
