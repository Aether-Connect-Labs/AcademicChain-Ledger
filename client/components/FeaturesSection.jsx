import React from 'react';

const Row = ({ items }) => (
  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
    {items.map((t, i) => (
      <div key={i} className="p-2 bg-white rounded-lg border border-gray-200">{t}</div>
    ))}
  </div>
);

const FeaturesSection = () => {
  return (
    <section className="py-16 bg-gray-50">
      <div className="container-responsive">
        <h2 className="text-3xl font-bold text-center mb-8 gradient-text">Arquitectura Triple Capa</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="card hover-lift">
            <h3 className="text-xl font-semibold mb-2 text-gray-900">🔵 Hedera Hashgraph</h3>
            <ul className="text-gray-700 space-y-1">
              <li>Emisión NFT (HIP‑412) · estándar educativo</li>
              <li>Metadata completa · datos inalterables</li>
              <li>Propiedad y transferencias · estudiante dueño</li>
              <li>Verificación simple · lectura pública</li>
              <li>HashScan Explorer · visualización pública</li>
            </ul>
            <div className="mt-3 text-xs text-gray-500">Resumen: Certificado digital principal (como el PDF oficial).</div>
          </div>
          <div className="card hover-lift">
            <h3 className="text-xl font-semibold mb-2 text-gray-900">🌊 XRP Ledger</h3>
            <ul className="text-gray-700 space-y-1">
              <li>Anclaje temporal · timestamp + hash</li>
              <li>Proof de Existencia · evidencia en fecha</li>
              <li>Backup ultra‑barato · copia distribuida</li>
              <li>Interoperabilidad · memo 1KB</li>
              <li>Auditoría pública · registro inmutable</li>
            </ul>
            <div className="mt-3 text-xs text-gray-500">Resumen: Notario público que certifica fecha y existencia.</div>
          </div>
          <div className="card hover-lift">
            <h3 className="text-xl font-semibold mb-2 text-gray-900">⚡ Algoran</h3>
            <ul className="text-gray-700 space-y-1">
              <li>Sharding masivo · por región/institución</li>
              <li>Emisión por lotes · 10,000+ títulos/tx</li>
              <li>Consenso PoC · validadores institucionales</li>
              <li>Gobernanza DAO · votaciones descentralizadas</li>
              <li>Micro‑credenciales · costos ultra bajos</li>
            </ul>
            <div className="mt-3 text-xs text-gray-500">Resumen: Sistema operativo que escala y gobierna el ecosistema.</div>
          </div>
        </div>

        <div className="card-gradient mb-10">
          <h3 className="text-lg font-bold text-gray-900">Analogía simple</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3 text-sm">
            <div className="p-3 bg-white rounded-lg border border-gray-200">Hedera = El Título físico</div>
            <div className="p-3 bg-white rounded-lg border border-gray-200">XRP = El Sello notarial</div>
            <div className="p-3 bg-white rounded-lg border border-gray-200">Algoran = Registro Nacional</div>
          </div>
        </div>

        <div className="space-y-8">
          <div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-3">Para Universidades</h3>
            <p className="text-gray-600">Sistema completo de emisión de credenciales académicas con triple capa blockchain para máxima seguridad y escalabilidad.</p>
          </div>

          <div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-3">Para Estudiantes</h3>
            <p className="text-gray-600">Acceso seguro a tus credenciales académicas con verificación instantánea y control total sobre tus datos.</p>
          </div>

          <div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-3">Para Empleadores</h3>
            <p className="text-gray-600">Verificación instantánea de credenciales académicas con máxima confianza y cero posibilidad de falsificación.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
