import React, { useState, useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Wrench, Book, CircleDollarSign, ArrowRight, CheckCircle2 } from 'lucide-react';

// Mock hook if useAnalytics is not available or we can simplify
// import { useAnalytics } from './useAnalytics'; 

const CTASection = ({ 
  title = "Blindaje Total contra el Fraude Académico",
  subtitle = "Fe pública digital con garantía perpetua y estándar global para credenciales verificables.",
  showDemoForm = true
}) => {
  const [email, setEmail] = useState('');
  const [institution, setInstitution] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [institutionCount, setInstitutionCount] = useState(0);
  
  const navigate = useNavigate();

  const [ref, inView] = useInView({
    threshold: 0.1,
    triggerOnce: true
  });

  // Institution Counter Animation
  useEffect(() => {
    if (inView) {
      const target = 57;
      const duration = 2000;
      const steps = 60;
      const increment = target / steps;
      let current = 0;

      const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
          setInstitutionCount(target);
          clearInterval(timer);
        } else {
          setInstitutionCount(Math.floor(current));
        }
      }, duration / steps);

      return () => clearInterval(timer);
    }
  }, [inView]);

  const handleDemoSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setSubmitStatus('success');
    setIsSubmitting(false);
  };

  const features = [
    { icon: <ShieldCheck size={16} />, text: 'Soporte 24/7' },
    { icon: <Wrench size={16} />, text: 'Migración Asistida' },
    { icon: <Book size={16} />, text: 'Training Completo' },
    { icon: <CircleDollarSign size={16} />, text: 'Sin Costos Ocultos' }
  ];

  return (
    <section 
      ref={ref}
      className="relative py-24 bg-[#050505] overflow-hidden"
    >
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-900/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-900/10 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,black,transparent)]"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          
          {/* Trust Badge */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#0d0d0d]/60 border border-emerald-500/20 mb-8 backdrop-blur-md"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-sm text-emerald-100/80">
              <span className="font-bold text-emerald-400">{institutionCount}+</span> Instituciones Confían en Nosotros
            </span>
          </motion.div>

          {/* Title */}
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight tracking-tight"
          >
            {title}
          </motion.h2>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2 }}
            className="text-xl text-slate-400 mb-12 leading-relaxed"
          >
            {subtitle}
          </motion.p>

          {/* Demo Form */}
          {showDemoForm && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: 0.3 }}
              className="relative max-w-md mx-auto"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-2xl blur opacity-20"></div>
              <div className="relative bg-[#0d0d0d]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
                <AnimatePresence mode="wait">
                  {submitStatus === 'success' ? (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-center py-8"
                    >
                      <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
                        <CheckCircle2 size={32} className="text-emerald-500" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">¡Solicitud Recibida!</h3>
                      <p className="text-slate-400 mb-6">
                        Te contactaremos en breve para agendar tu demo.
                      </p>
                      <button
                        onClick={() => setSubmitStatus(null)}
                        className="text-emerald-400 hover:text-emerald-300 text-sm font-medium"
                      >
                        Enviar otra solicitud
                      </button>
                    </motion.div>
                  ) : (
                    <motion.form 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onSubmit={handleDemoSubmit} 
                      className="space-y-4"
                    >
                      <h3 className="text-xl font-bold text-white mb-6">Agenda una Demo</h3>
                      <div>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="tu.email@institucion.edu"
                          className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                          required
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={institution}
                          onChange={(e) => setInstitution(e.target.value)}
                          placeholder="Nombre de tu institución"
                          className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                          required
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-4 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold rounded-lg shadow-lg shadow-emerald-500/20 transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? (
                          <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            Solicitar Demo Gratuita <ArrowRight size={18} />
                          </>
                        )}
                      </button>
                    </motion.form>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {/* Features Footer */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ delay: 0.4 }}
            className="mt-16 pt-8 border-t border-white/5"
          >
            <p className="text-xs text-slate-500 uppercase tracking-widest mb-6 font-semibold">
              Incluye sin costo adicional
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {features.map((feature, idx) => (
                <div key={idx} className="flex items-center justify-center gap-2 text-slate-400 text-sm">
                  <span className="text-emerald-500/80">{feature.icon}</span>
                  <span>{feature.text}</span>
                </div>
              ))}
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default CTASection;
