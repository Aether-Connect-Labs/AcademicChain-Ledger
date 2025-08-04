import { motion } from 'framer-motion';

const stats = [
  { number: "10,000+", label: "Transacciones por Segundo" },
  { number: "<$0.0001", label: "Costo por Verificación" },
  { number: "<3s", label: "Tiempo de Finalización" },
  { number: "100%", label: "Inmutable y Auditable" }
];

export const StatsSection = () => {
  return (
    <section className="bg-gray-950 py-20 border-y border-gray-800/50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              viewport={{ once: true }}
            >
              <p className="text-4xl font-bold text-cyan-400">{stat.number}</p>
              <p className="mt-2 text-sm text-gray-400 uppercase tracking-wider">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};