import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const reviews = [
  {
    name: "Arjun M.",
    role: "Audio Enthusiast",
    text: "The walnut speaker is absolutely stunning. The sound quality blew me away warm, punchy bass with crystal clear highs. Worth every rupee.",
    avatar: "https://api.dicebear.com/7.x/notionists/svg?seed=Arjun&backgroundColor=C4A882"
  },
  {
    name: "Priya S.",
    role: "Design Director",
    text: "Best earbuds I've ever owned. The ANC is on par with brands double the price, and the wooden accents get me compliments daily.",
    avatar: "https://api.dicebear.com/7.x/notionists/svg?seed=Priya&backgroundColor=A0785A"
  },
  {
    name: "Ravi K.",
    role: "Tech Reviewer",
    text: "The GaN charger is a game changer. Compact yet powerful enough for my laptop and phone simultaneously. 100% recommend.",
    avatar: "https://api.dicebear.com/7.x/notionists/svg?seed=Ravi&backgroundColor=5C4033"
  }
];

export default function Reviews() {
  return (
    <section id="reviews" className="py-24 bg-[var(--retro-cream)] relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[var(--accent-light)]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

      <div className="container mx-auto px-6 lg:px-12 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black tracking-tight text-[var(--foreground)] mb-4">Loved by Audiophiles</h2>
          <p className="text-[var(--foreground)]/70 max-w-2xl mx-auto text-lg">Don't just take our word for it. Hear what our community has to say.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {reviews.map((review, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="bg-white p-8 rounded-3xl shadow-sm relative group hover:shadow-xl transition-shadow duration-300"
            >
              <Quote className="absolute top-8 right-8 w-12 h-12 text-[var(--soft-gray)] opacity-50 group-hover:text-[var(--accent-light)]/20 transition-colors" />
              
              <div className="flex text-yellow-500 mb-6">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} size={18} fill="currentColor" />
                ))}
              </div>
              
              <p className="text-[var(--foreground)]/80 text-lg mb-8 relative z-10 leading-relaxed font-medium">
                "{review.text}"
              </p>
              
              <div className="flex items-center gap-4 mt-auto">
                <img src={review.avatar} alt={review.name} loading="lazy" decoding="async" width={48} height={48} className="w-12 h-12 rounded-full border-2 border-[var(--retro-cream)] bg-[var(--soft-gray)]" />
                <div>
                  <h4 className="font-bold text-[var(--foreground)]">{review.name}</h4>
                  <p className="text-sm text-[var(--foreground)]/50">{review.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
