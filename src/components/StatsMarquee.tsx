import { motion } from "framer-motion";

const stats = [
  { value: "10+", label: "Products" },
  { value: "1K+", label: "Customers" },
  { value: "4.9", label: "Rating" },
  { value: "1 Yr", label: "Warranty" },
];

export default function StatsMarquee() {
  return (
    <section className="bg-[var(--foreground)] py-16 text-white overflow-hidden">
      <div className="container mx-auto px-6 lg:px-12 mb-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x-0 md:divide-x divide-white/10">
          {stats.map((stat, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.6 }}
              className="text-center px-4"
            >
              <div className="text-4xl md:text-5xl font-black text-[var(--accent-light)] mb-2 tracking-tight">
                {stat.value}
              </div>
              <div className="text-sm md:text-base font-medium text-white/70 uppercase tracking-widest">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="relative flex overflow-x-hidden bg-[var(--accent-brown)] py-4 transform -rotate-2 scale-110">
        <div className="animate-marquee whitespace-nowrap flex items-center">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex items-center">
              <span className="text-xl font-bold uppercase tracking-wider mx-8">Premium Sound</span>
              <span className="text-white/50 text-xl">•</span>
              <span className="text-xl font-bold uppercase tracking-wider mx-8">1 Year Warranty</span>
              <span className="text-white/50 text-xl">•</span>
              <span className="text-xl font-bold uppercase tracking-wider mx-8">Free Shipping</span>
              <span className="text-white/50 text-xl">•</span>
              <span className="text-xl font-bold uppercase tracking-wider mx-8">Sustainable Wood</span>
              <span className="text-white/50 text-xl">•</span>
              <span className="text-xl font-bold uppercase tracking-wider mx-8">Fast Charging</span>
              <span className="text-white/50 text-xl">•</span>
              <span className="text-xl font-bold uppercase tracking-wider mx-8">Bluetooth 5.3</span>
              <span className="text-white/50 text-xl">•</span>
              <span className="text-xl font-bold uppercase tracking-wider mx-8">Award Winning</span>
              <span className="text-white/50 text-xl">•</span>
              <span className="text-xl font-bold uppercase tracking-wider mx-8">Handcrafted</span>
              <span className="text-white/50 text-xl">•</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
