import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Check, Shield, School, GraduationCap, Building, PenTool } from 'lucide-react';
import { motion } from 'framer-motion';
import InstitutionSubscriptionModal from './InstitutionSubscriptionModal';
import CreatorSubscriptionModal from './CreatorSubscriptionModal';

const PricingPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('employers'); // Default to employers based on user flow
  const [showInstitutionModal, setShowInstitutionModal] = useState(false);
  const [showCreatorModal, setShowCreatorModal] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab && ['institutions', 'employers', 'students', 'creators'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [location]);

  const handlePlanClick = (plan) => {
    if (activeTab === 'institutions') {
      setSelectedPlanId(plan.name.toLowerCase().includes('esencial') ? 'esencial' : 'professional');
      setShowInstitutionModal(true);
    } else if (activeTab === 'creators') {
      setSelectedPlanId(plan.name.toLowerCase().includes('base') ? 'creator-base' : 'creator-pro');
      setShowCreatorModal(true);
    } else if (plan.ctaLink) {
      navigate(plan.ctaLink);
    }
  };

  const plans = {
    institutions: [
      {
        name: 'Esencial',
        price: '$45',
        subtitle: '/ mes',
        description: 'Para instituciones que inician su transformación digital.',
        features: [
          'Registro en Hedera Testnet',
          '50 Emisiones / mes',
          'Alojamiento en IPFS',
          'Soporte Básico',
          'Acceso a Studio Holográfico'
        ],
        cta: 'Comenzar',
        ctaLink: '/institution/register?plan=esencial',
        highlight: false
      },
      {
        name: 'Profesional',
        price: '$154',
        subtitle: '/ mes',
        description: 'Seguridad multicadena y análisis de mercado.',
        features: [
          'Doble Sello: Hedera + XRP Ledger',
          '220 Emisiones / mes',
          'Acceso API (Headless)',
          'Heatmap de Empleabilidad (IA)',
          'Soporte Prioritario 24/7'
        ],
        cta: 'Mejorar Plan',
        ctaLink: '/institution/upgrade?plan=profesional',
        highlight: true
      },
      {
        name: 'Enterprise',
        price: 'A medida',
        subtitle: 'o $1.00 por título',
        description: 'Infraestructura dedicada y máxima seguridad.',
        features: [
          'Triple Sello: Hedera + XRP + Algorand',
          'Emisiones Ilimitadas',
          'Nodos Dedicados',
          'SLA 99.99%',
          'Opción On-Premise'
        ],
        cta: 'Contactar Ventas',
        ctaLink: '/agenda',
        highlight: false
      }
    ],
    employers: [
      {
        name: 'Business',
        price: '$49',
        subtitle: '/ mes',
        description: 'Ideal para Startups y Pymes en crecimiento.',
        features: [
          'Búsqueda por habilidades con IA',
          '20 verificaciones de identidad (KYC) / mes',
          'Acceso al Smart CV de candidatos',
          'Alertas de nuevos talentos',
          'Panel de gestión básico'
        ],
        cta: 'Empezar Prueba',
        ctaLink: '/employer/dashboard', // Simulation flow
        highlight: false
      },
      {
        name: 'Enterprise',
        price: '$199 - $399',
        subtitle: '/ mes',
        description: 'Potencia masiva para Grandes Corporaciones y Headhunters.',
        features: [
          'Perfect Match ilimitado',
          'API de integración RR.HH.',
          'Prioridad en candidatos "Identidad Blindada"',
          'Headhunting asistido por IA',
          'Garantía de Autenticidad'
        ],
        cta: 'Solicitar Demo',
        ctaLink: '/agenda',
        highlight: true
      }
    ],
    students: [
      {
        name: 'Básico',
        price: 'Gratis',
        subtitle: 'Para siempre',
        description: 'Tus logros, seguros y compartibles.',
        features: [
          'Título alojado en IPFS',
          'QR verificado para LinkedIn',
          'Perfil público básico',
          'Acceso a ofertas de empleo'
        ],
        cta: 'Crear Perfil',
        ctaLink: '/students/register',
        highlight: false
      },
      {
        name: 'Career Pro',
        price: '$9.99',
        subtitle: 'pago único',
        description: 'Destaca entre la multitud y acelera tu carrera.',
        features: [
          'Generación de Smart CV optimizado con IA',
          'Verificación de carnet/pasaporte (KYC)',
          'Badge "Candidato Verificado"',
          'Prioridad en búsquedas de empleadores',
          'Análisis de brecha de habilidades'
        ],
        cta: 'Obtener Pro',
        ctaLink: '/students/upgrade',
        highlight: true
      }
    ],
    creators: [
      {
        name: 'Creador Base',
        price: '$50',
        subtitle: '/ mes',
        description: 'Tus cursos ahora tienen validez criptográfica inmediata.',
        features: [
          'Sello de Autor exclusivo en Hedera',
          '50 Emisiones / mes',
          'Certificados de Habilidades',
          'Validez inmediata',
          'Panel de gestión simplificado'
        ],
        cta: 'Empezar como Creador',
        ctaLink: '/creators/register?plan=base',
        highlight: false
      },
      {
        name: 'Creador Pro / Enterprise',
        price: 'A medida',
        subtitle: 'para alto volumen',
        description: 'Para creadores con miles de alumnos y academias online.',
        features: [
          'Redes: Hedera + XRP + Algorand',
          'Conexión directa a Buscador de Talentos',
          'Alumnos destacados aparecen primero',
          'Emisiones masivas automatizadas',
          'API de integración LMS'
        ],
        cta: 'Contactar Ventas',
        ctaLink: '/agenda',
        highlight: true
      }
    ]
  };

  const tabs = [
    { id: 'institutions', label: 'Instituciones', icon: <School className="w-4 h-4" /> },
    { id: 'creators', label: 'Creadores', icon: <PenTool className="w-4 h-4" /> },
    { id: 'employers', label: 'Empleadores', icon: <Building className="w-4 h-4" /> },
    { id: 'students', label: 'Alumnos', icon: <GraduationCap className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-slate-950 pt-24 pb-20 px-4 relative overflow-hidden font-sans text-slate-200">
      
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px]"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight">
            Planes diseñados para el <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
              Futuro de la Educación
            </span>
          </h1>
          <p className="text-xl text-slate-400 leading-relaxed">
            Desde la emisión gratuita hasta la contratación verificada. 
            Elige tu rol en el ecosistema AcademicChain.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-16">
          <div className="inline-flex p-1 bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-xl">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold transition-all ${
                  activeTab === tab.id 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-20">
          {plans[activeTab].map((plan, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`relative p-8 rounded-3xl border ${
                plan.highlight 
                  ? 'bg-slate-900/80 border-blue-500/50 shadow-2xl shadow-blue-900/20' 
                  : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
              } flex flex-col`}
            >
              {plan.highlight && (
                <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-2">
                  <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                    Recomendado
                  </span>
                </div>
              )}

              <div className="mb-8">
                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                <p className="text-slate-400 text-sm h-10">{plan.description}</p>
              </div>

              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-5xl font-black text-white tracking-tight">{plan.price}</span>
                <span className="text-slate-500 font-medium">{plan.subtitle}</span>
              </div>

              <div className="space-y-4 mb-8 flex-grow">
                {plan.features.map((feature, fIdx) => (
                  <div key={fIdx} className="flex items-start gap-3">
                    <div className="mt-1 w-5 h-5 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-blue-400" />
                    </div>
                    <span className="text-slate-300 text-sm leading-relaxed">{feature}</span>
                  </div>
                ))}
              </div>

              <button 
                onClick={() => handlePlanClick(plan)}
                className={`w-full py-4 rounded-xl font-bold transition-all ${
                plan.highlight
                  ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/40'
                  : 'bg-white text-slate-900 hover:bg-slate-100'
              }`}>
                {plan.cta}
              </button>
            </motion.div>
          ))}
        </div>

        {showInstitutionModal && (
          <InstitutionSubscriptionModal 
            onClose={() => setShowInstitutionModal(false)}
            onSubscribe={(planId) => {
              console.log('Subscribed to:', planId);
              // Handle subscription logic or redirect
              navigate('/institution/dashboard');
            }}
            currentPlanId={selectedPlanId}
          />
        )}

        {showCreatorModal && (
          <CreatorSubscriptionModal 
            onClose={() => setShowCreatorModal(false)}
            onSubscribe={(planId) => {
              console.log('Creator subscribed to:', planId);
              navigate('/portal-creadores');
            }}
            currentPlanId={selectedPlanId}
          />
        )}

        {/* Guarantee Section */}
        <div className="max-w-4xl mx-auto bg-slate-900/50 border border-slate-800 rounded-3xl p-8 md:p-12 text-center relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/10 rounded-full blur-3xl pointer-events-none"></div>
           
           <div className="relative z-10">
             <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-800 mb-6 text-green-400">
               <Shield className="w-8 h-8" />
             </div>
             <h3 className="text-2xl font-bold text-white mb-4">Garantía de Autenticidad AcademicChain</h3>
             <p className="text-slate-400 max-w-2xl mx-auto mb-8">
               Si un título verificado por nuestro sistema resulta ser falso, AcademicChain responde. 
               Ofrecemos la única garantía del mercado respaldada matemáticamente por blockchain.
             </p>
             <div className="flex flex-wrap justify-center gap-8 text-sm font-medium text-slate-500">
                <span className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" /> Sin riesgo de fraude
                </span>
                <span className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" /> Validación en tiempo real
                </span>
                <span className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" /> Respaldo legal
                </span>
             </div>
           </div>
        </div>

      </div>
    </div>
  );
};

export default PricingPage;
