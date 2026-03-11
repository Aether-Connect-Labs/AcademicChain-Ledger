import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { 
  Check, 
  School, 
  Building, 
  GraduationCap, 
  Shield, 
  Zap, 
  Globe, 
  PenTool, 
  ArrowRight,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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

  const tabs = [
    { id: 'institutions', label: 'Instituciones', icon: <School className="w-4 h-4" strokeWidth={1.5} /> },
    { id: 'creators', label: 'Creadores', icon: <PenTool className="w-4 h-4" strokeWidth={1.5} /> },
    { id: 'employers', label: 'Empleadores', icon: <Building className="w-4 h-4" strokeWidth={1.5} /> },
    { id: 'students', label: 'Alumnos', icon: <GraduationCap className="w-4 h-4" strokeWidth={1.5} /> },
  ];

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
    creators: [
      {
        name: 'Creator Base',
        price: '$0',
        subtitle: '/ mes',
        description: 'Empieza a certificar tus cursos sin costo.',
        features: [
          '10 Credenciales / mes',
          'Verificación QR Simple',
          'Perfil de Creador',
          'Plantillas Básicas'
        ],
        cta: 'Crear Cuenta Gratis',
        ctaLink: '/creators/register',
        highlight: false
      },
      {
        name: 'Creator Pro',
        price: '$29',
        subtitle: '/ mes',
        description: 'Para academias digitales y mentores activos.',
        features: [
          '100 Credenciales / mes',
          'Personalización de Marca',
          'Analytics de Alumnos',
          'API de Emisión',
          'Soporte por Email'
        ],
        cta: 'Comenzar Pro',
        ctaLink: '/creators/register?plan=pro',
        highlight: true
      }
    ],
    employers: [
      {
        name: 'Acceso Básico',
        price: 'Gratis',
        subtitle: 'para siempre',
        description: 'Verifica credenciales y busca talento.',
        features: [
          'Verificación Ilimitada',
          'Búsqueda de Talento Básica',
          'Visualización de Smart CV'
        ],
        cta: 'Registrarse',
        ctaLink: '/employers/register',
        highlight: false
      },
      {
        name: 'Recruiter Pro',
        price: '$99',
        subtitle: '/ mes',
        description: 'Herramientas avanzadas de reclutamiento.',
        features: [
          'Filtros Avanzados de Skills',
          'Contactar Candidatos Directamente',
          'Verificación en Lote',
          'Integración con ATS'
        ],
        cta: 'Prueba Gratuita',
        ctaLink: '/employers/register?plan=pro',
        highlight: true
      }
    ],
    students: [
      {
        name: 'Cuenta Estudiante',
        price: 'Gratis',
        subtitle: 'para siempre',
        description: 'Gestiona tu identidad profesional.',
        features: [
          'Wallet de Credenciales Ilimitada',
          'Smart CV Autogenerado',
          'Compartir en LinkedIn',
          'Descarga en PDF'
        ],
        cta: 'Crear Mi Perfil',
        ctaLink: '/login',
        highlight: true
      }
    ]
  };

  return (
    <div className="min-h-screen bg-[#050505] text-slate-100 font-sans selection:bg-cyan-500/30 overflow-hidden relative">
      
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px]"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pt-32 pb-20 relative z-10">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold mb-6 backdrop-blur-md">
            <Zap className="w-3 h-3" strokeWidth={1.5} />
            PLANES FLEXIBLES
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight">
            Planes diseñados para el <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
              Futuro de la Educación
            </span>
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed">
            Desde la emisión gratuita hasta la contratación verificada. 
            Elige tu rol en el ecosistema AcademicChain.
          </p>
        </motion.div>

        {/* Tabs */}
        <div className="flex justify-center mb-16">
          <div className="inline-flex p-1 bg-[#0d0d0d]/60 backdrop-blur-xl border border-white/5 rounded-xl flex-wrap justify-center gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold transition-all ${
                  activeTab === tab.id 
                    ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-900/20' 
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
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto mb-20 place-items-center items-start">
          <AnimatePresence mode="wait">
            {plans[activeTab].map((plan, idx) => (
              <motion.div
                key={`${activeTab}-${idx}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: idx * 0.1 }}
                className={`relative p-8 rounded-3xl border w-full flex flex-col ${
                  plan.highlight 
                    ? 'bg-[#0d0d0d]/80 border-blue-500/30 shadow-2xl shadow-blue-900/10' 
                    : 'bg-[#0d0d0d]/40 border-white/5 hover:border-white/10'
                } backdrop-blur-xl transition-all duration-300 group`}
              >
                {plan.highlight && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full text-xs font-bold text-white shadow-lg">
                    RECOMENDADO
                  </div>
                )}

                <div className="mb-8">
                  <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-white tracking-tight">{plan.price}</span>
                    <span className="text-slate-500 text-sm font-medium">{plan.subtitle}</span>
                  </div>
                  <p className="text-slate-400 text-sm mt-4 min-h-[40px]">{plan.description}</p>
                </div>

                <div className="flex-grow mb-8">
                  <ul className="space-y-4">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3 text-slate-300 text-sm">
                        <Check className={`w-5 h-5 flex-shrink-0 ${plan.highlight ? 'text-blue-400' : 'text-slate-500'}`} strokeWidth={1.5} />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => handlePlanClick(plan)}
                  className={`w-full py-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                    plan.highlight
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg shadow-blue-900/20 hover:scale-[1.02]'
                      : 'bg-white/5 hover:bg-white/10 text-white border border-white/5 hover:border-white/10'
                  }`}
                >
                  {plan.cta}
                  <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Guarantee Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto"
        >
          <div className="bg-[#0d0d0d]/40 backdrop-blur-xl border border-white/5 rounded-3xl p-8 md:p-12 text-center relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/5 rounded-full blur-3xl pointer-events-none group-hover:bg-green-500/10 transition-colors duration-500"></div>
             
             <div className="relative z-10">
               <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-500/10 border border-green-500/20 mb-6 text-green-400 group-hover:scale-110 transition-transform duration-300">
                 <Shield className="w-8 h-8" strokeWidth={1.5} />
               </div>
               <h3 className="text-2xl font-bold text-white mb-4">Garantía de Autenticidad AcademicChain</h3>
               <p className="text-slate-400 max-w-2xl mx-auto mb-8 leading-relaxed">
                 Si un título verificado por nuestro sistema resulta ser falso, AcademicChain responde. 
                 Ofrecemos la única garantía del mercado respaldada matemáticamente por blockchain.
               </p>
               <div className="flex flex-wrap justify-center gap-4 md:gap-8 text-sm font-medium text-slate-400">
                  <span className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/5">
                    <Check className="w-4 h-4 text-green-500" strokeWidth={1.5} /> Sin riesgo de fraude
                  </span>
                  <span className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/5">
                    <Check className="w-4 h-4 text-green-500" strokeWidth={1.5} /> Validación en tiempo real
                  </span>
                  <span className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/5">
                    <Check className="w-4 h-4 text-green-500" strokeWidth={1.5} /> Respaldo legal
                  </span>
               </div>
             </div>
          </div>
        </motion.div>

        {/* FAQ Teaser / Additional Info */}
        <div className="mt-20 text-center">
          <p className="text-slate-500 text-sm">
            ¿Tienes dudas sobre la integración técnica? 
            <Link to="/docs" className="text-blue-400 hover:text-blue-300 ml-1 font-medium hover:underline">
              Consulta nuestra documentación
            </Link>
          </p>
        </div>

      </div>

      {/* Modals */}
      <AnimatePresence>
        {showInstitutionModal && (
          <InstitutionSubscriptionModal 
            onClose={() => setShowInstitutionModal(false)}
            initialPlanId={selectedPlanId}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCreatorModal && (
          <CreatorSubscriptionModal 
            onClose={() => setShowCreatorModal(false)}
            initialPlanId={selectedPlanId}
          />
        )}
      </AnimatePresence>

    </div>
  );
};

export default PricingPage;