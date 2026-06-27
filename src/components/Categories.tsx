import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const categories = [
  {
    title: "Speakers",
    color: "#A0785A",
    image: "/Speaker prt.png",
    description: "Premium wooden speakers with rich, warm acoustics",
  },
  {
    title: "Earphones",
    color: "#5C4033",
    image: "/earphones prt.png",
    description: "Handcrafted earphones for intimate, natural sound",
  },
  {
    title: "Chargers",
    color: "#C4A882",
    image: "/charger prt.png",
    description: "Eco-friendly charging solutions crafted from wood",
  }
];

export default function Categories() {
  return (
    <section id="categories" className="py-24 bg-[var(--retro-cream)]">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black tracking-tight text-[var(--foreground)] mb-4">Shop by Category</h2>
          <p className="text-[var(--foreground)]/70 max-w-2xl mx-auto text-lg">Explore our curated collections of premium audio and charging accessories.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {categories.map((cat, idx) => (
            <motion.div
              key={cat.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="group relative aspect-[3/4] rounded-3xl overflow-hidden cursor-pointer"
              style={{ backgroundColor: cat.color }}
            >
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-500 z-10" />

              {cat.image && (
                <img
                  src={cat.image}
                  alt={cat.title}
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 w-full h-full object-cover z-0"
                />
              )}

              {/* Decorative circles */}
              <div className="absolute top-1/4 right-1/4 w-48 h-48 rounded-full bg-white/10 blur-xl z-0" />
              <div className="absolute bottom-1/4 left-1/4 w-32 h-32 rounded-full bg-white/10 blur-xl z-0" />
              
              <div className="absolute inset-0 z-20 p-8 flex flex-col justify-end">
                {/* Description: always visible on mobile (no :hover on touch), reveals on hover for desktop. */}
                <p className="text-white/80 md:text-white/70 text-sm mb-2 translate-y-0 md:translate-y-4 md:opacity-0 md:group-hover:opacity-100 md:group-hover:translate-y-0 transition-all duration-500">
                  {cat.description}
                </p>
                <h3 className="text-3xl font-bold text-white mb-2 translate-y-0 md:translate-y-4 md:group-hover:translate-y-0 transition-transform duration-500">
                  {cat.title}
                </h3>
                {/* CTA chip: always visible on mobile, hover-only on desktop. */}
                <div className="flex items-center text-white/90 font-semibold translate-y-0 md:opacity-0 md:translate-y-4 md:group-hover:opacity-100 md:group-hover:translate-y-0 transition-all duration-500 delay-100">
                  Explore Collection <ArrowRight className="ml-2 w-5 h-5" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
