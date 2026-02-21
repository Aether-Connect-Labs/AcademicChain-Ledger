import React from 'react';
import { theme } from './themeConfig';

const FeaturesSection = () => {
  return (
    <section className="relative overflow-hidden bg-[#0b1224] pt-24 sm:pt-32" style={{ paddingBottom: theme.spacing.sectionPb }}>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 left-1/4 w-40 h-40 rounded-full bg-[#0066FF]/20 blur-xl"></div>
        <div className="absolute top-24 right-1/5 w-52 h-52 rounded-full bg-[#0066FF]/16 blur-xl"></div>
        <div className="absolute bottom-10 left-1/3 w-44 h-44 rounded-full bg-[#0066FF]/14 blur-xl"></div>
        <div className="absolute inset-0">
          <div className="absolute top-24 left-1/4 w-1/2 h-px bg-gradient-to-r from-transparent via-[#0066FF]/40 to-transparent"></div>
          <div className="absolute top-48 left-1/3 w-1/2 h-px bg-gradient-to-r from-transparent via-[#0066FF]/25 to-transparent"></div>
        </div>
      </div>
      <div className="container-responsive relative z-10">
        <h2 className="text-3xl font-bold text-center mb-8 text-white">Infraestructura de Confianza Digital</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="p-6 rounded-xl bg-gray-900/70 border border-gray-800 shadow-soft">
            <h3 className="text-xl font-semibold mb-2 text-white">Verificación Instantánea</h3>
            <ul className="text-white/80 space-y-1">
              <li>Pruebas criptográficas · datos inalterables</li>
              <li>Metadatos completos · trazabilidad forense</li>
              <li>Control del titular · portabilidad segura</li>
              <li>Lectura pública · interoperabilidad abierta</li>
              <li>Exploración auditable · transparencia total</li>
            </ul>
            <div className="mt-3 text-xs text-white/60">Resumen: Certificado digital verificable.</div>
          </div>
          <div className="p-6 rounded-xl bg-gray-900/70 border border-gray-800 shadow-soft">
            <h3 className="text-xl font-semibold mb-2 text-white">Evidencia Temporal</h3>
            <ul className="text-white/80 space-y-1">
              <li>Anclaje con marca de tiempo</li>
              <li>Prueba de existencia verificable</li>
              <li>Respaldo distribuido de bajo costo</li>
              <li>Interoperabilidad de registros</li>
              <li>Auditoría pública certificable</li>
            </ul>
            <div className="mt-3 text-xs text-white/60">Resumen: Evidencia permanente de emisión.</div>
          </div>
          <div className="p-6 rounded-xl bg-gray-900/70 border border-gray-800 shadow-soft">
            <h3 className="text-xl font-semibold mb-2 text-white">Continuidad Operativa</h3>
            <ul className="text-white/80 space-y-1">
              <li>Redundancia multi‑red</li>
              <li>Alta disponibilidad y escalado</li>
              <li>Costos predecibles</li>
              <li>Reglas programables</li>
              <li>Performance global</li>
              <li>Almacenamiento descentralizado (IPFS + Filecoin)</li>
            </ul>
            <div className="mt-3 text-xs text-white/60">Resumen: Operación sin interrupciones.</div>
          </div>
        </div>

        <div className="mb-10 p-6 rounded-xl bg-gray-900/70 border border-gray-800 shadow-soft">
          <h3 className="text-lg font-bold text-white">Analogía</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3 text-sm">
            <div className="p-3 rounded-lg border border-gray-700 bg-gray-900/60 text-white">Certificado = Documento oficial</div>
            <div className="p-3 rounded-lg border border-gray-700 bg-gray-900/60 text-white">Evidencia = Sello notarial digital</div>
            <div className="p-3 rounded-lg border border-gray-700 bg-gray-900/60 text-white">Continuidad = Registro nacional</div>
          </div>
        </div>

        <div className="mb-10 p-6 rounded-xl bg-gray-900/70 border border-gray-800 shadow-soft">
          <h3 className="text-xl font-semibold mb-2 text-white">🛡️ Cumplimiento de Privacidad y Gobernanza de Datos</h3>
          <p className="text-white/80 mt-4">
            AcademicChain Ledger opera bajo un modelo de <strong>Privacidad por Diseño</strong>, separando la identidad del usuario de la evidencia pública. En cumplimiento con regulaciones internacionales de protección de datos:
          </p>
          <ul className="text-white/80 space-y-2 mt-4 pl-5 list-disc">
            <li>
              <strong>Anclaje Criptográfico (Hashing):</strong> No almacenamos datos personales (PII) de forma legible en la red blockchain. Solo se registra un hash criptográfico inmutable que sirve como huella digital del título.
            </li>
            <li>
              <strong>Almacenamiento Off-Chain Seguro:</strong> La información sensible reside en bases de datos privadas encriptadas o en nodos IPFS privados con acceso controlado, asegurando que solo los actores autorizados (universidad y estudiante) posean la clave de lectura.
            </li>
            <li>
              <strong>Arquitectura de Verificación Selectiva:</strong> El sistema permite la verificación de autenticidad sin exponer el registro completo, utilizando un modelo de 'fuente de verdad' que puede integrarse vía API con registros gubernamentales o sistemas internos universitarios (SIS).
            </li>
          </ul>
        </div>


        <div className="space-y-8">
          <div>
            <h3 className="text-2xl font-semibold text-white mb-3">Para Universidades</h3>
            <p className="text-white/80">Certificación con fe pública digital y trazabilidad verificable.</p>
          </div>

          <div>
            <h3 className="text-2xl font-semibold text-white mb-3">Para Estudiantes</h3>
            <p className="text-white/80">Control total sobre credenciales y verificación instantánea.</p>
          </div>

          <div>
            <h3 className="text-2xl font-semibold text-white mb-3">Para Creadores de Contenido</h3>
            <p className="text-white/80">Certifica cursos, mentorías y marca personal en sectores sin jurisdicción, otorgando valor verificable a tu comunidad.</p>
          </div>

          <div>
            <h3 className="text-2xl font-semibold text-white mb-3">Para Empleadores</h3>
            <p className="text-white/80">Confianza máxima y falsificación imposible a nivel práctico.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
