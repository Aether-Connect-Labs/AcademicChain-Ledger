import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'next-i18next';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.6,
      ease: 'easeOut',
    },
  },
};

export const HeroSection = () => {
  const { t } = useTranslation('common');

  return (
    <section className="relative overflow-hidden bg-gray-950 animated-grid-background">
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24 text-center">
        <motion.div variants={containerVariants} initial="hidden" animate="visible">
          <motion.div variants={itemVariants}>
            <Link href="/status" legacyBehavior>
              <a className="inline-flex items-center justify-center px-4 py-1 text-sm font-medium text-cyan-300 bg-cyan-900/50 rounded-full mb-6 hover:bg-cyan-900/80 transition-colors">
                <ShieldCheck className="w-4 h-4 mr-2" />
                <span>{t('hero.status')}</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </a>
            </Link>
          </motion.div>
          <motion.h1 variants={itemVariants} className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
            {t('hero.title')}
          </motion.h1>
          <motion.p variants={itemVariants} className="mt-6 max-w-2xl mx-auto text-lg text-gray-400">
            {t('hero.subtitle')}
          </motion.p>
          <motion.div variants={itemVariants} className="mt-10 flex justify-center gap-4">
            <Link href="/auth/register" legacyBehavior>
              <a className="inline-block bg-cyan-500 text-gray-900 px-8 py-3 rounded-lg font-bold hover:bg-cyan-400 transition-all duration-300 shadow-lg shadow-cyan-500/30 transform hover:scale-105">
                {t('hero.cta_primary')}
              </a>
            </Link>
            <Link href="/demo" legacyBehavior>
              <a className="inline-block bg-gray-800/50 border border-gray-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-gray-700/80 transition-colors">
                {t('hero.cta_secondary')}
              </a>
            </Link>
          </motion.div>
        </motion.div>
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-gray-950 via-transparent to-gray-950 opacity-80"></div>
    </section>
  );
};