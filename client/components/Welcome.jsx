import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from './useAuth';
import { theme } from './themeConfig';

const StepCard = ({ icon, title, description, ctaText, ctaHref }) => (
  <div className="card hover-lift">
    <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center text-2xl mb-4">
      <span>{icon}</span>
    </div>
    <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-600 mb-4">{description}</p>
    <Link to={ctaHref} className="inline-flex items-center btn-primary hover-lift">
      <span className="mr-2">🚀</span>
      <span>{ctaText}</span>
    </Link>
  </div>
);

const Stat = ({ value, label }) => (
  <div className="text-center">
    <div className="text-3xl font-bold text-gray-900">{value}</div>
    <div className="text-gray-500 text-sm">{label}</div>
  </div>
);

const Welcome = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-6xl mx-auto" style={{ paddingLeft: theme.spacing.sectionPx, paddingRight: theme.spacing.sectionPx, paddingBottom: theme.spacing.sectionPb }}>
        <div className="text-center mb-10">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary-50 text-primary-700 mb-4">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            <span>Cuenta creada</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900">Bienvenido a AcademicChain</h1>
          <p className="mt-3 text-lg text-gray-600">Explora cómo verificar y emitir credenciales académicas de forma simple y profesional.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <StepCard
            icon="🔍"
            title="Verificar una Credencial"
            description="Escanea un código QR o ingresa token y serial para validar en Hedera."
            ctaText="Ir a Verificación"
            ctaHref="/verificar"
          />
          <StepCard
            icon="🎓"
            title="Emitir una Demo"
            description="Simula la emisión de una credencial para comprender el flujo completo."
            ctaText="Explorar Emisión"
            ctaHref="/institution/emitir/certificado"
          />
          <StepCard
            icon="📚"
            title="Conocer la Plataforma"
            description="Revisa las funcionalidades clave y beneficios para tu institución."
            ctaText="Ver Features"
            ctaHref="/instituciones"
          />
        </div>

        <div className="card-gradient mb-12">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Cómo funciona</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-xl bg-secondary-100 flex items-center justify-center text-xl">1</div>
              <div>
                <div className="font-semibold text-gray-900">Emisión</div>
                <div className="text-gray-600">Se crea un NFT con metadatos verificables y se registra en Hedera.</div>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-xl bg-secondary-100 flex items-center justify-center text-xl">2</div>
              <div>
                <div className="font-semibold text-gray-900">Distribución</div>
                <div className="text-gray-600">Se entrega al estudiante con un QR para validación instantánea.</div>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-xl bg-secondary-100 flex items-center justify-center text-xl">3</div>
              <div>
                <div className="font-semibold text-gray-900">Verificación</div>
                <div className="text-gray-600">Empresas y terceros verifican autenticidad consultando el consenso.</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <Stat value="3s" label="Tiempo de verificación" />
          <Stat value="0" label="Costos de transacción" />
          <Stat value="99.9%" label="Disponibilidad" />
        </div>

        <div className="mt-12 text-center">
          {user?.role === 'admin' ? (
            <Link to="/institution/dashboard" className="inline-flex items-center btn-primary hover-lift">
              <span className="mr-2">⚙️</span>
              <span>Ir al Panel de Administración</span>
            </Link>
          ) : (
            <Link to="/verificar" className="inline-flex items-center btn-primary hover-lift">
              <span className="mr-2">🔍</span>
              <span>Probar Verificación Ahora</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default Welcome;
