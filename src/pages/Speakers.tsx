import { useState } from "react";
import { useLocation, Link } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Camera,
  Layers,
  Home,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import CartSidebar from "@/components/CartSidebar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import OptimizedImage from "@/components/OptimizedImage";
import { speakerGallery, type SpeakerTag, type SpeakerPhoto } from "@/data/speakerGallery";

type FilterId = "all" | SpeakerTag;

const FILTERS: { id: FilterId; label: string; icon: typeof Camera }[] = [
  { id: "all", label: "All", icon: Layers },
  { id: "desk", label: "On the desk", icon: Home },
  { id: "studio", label: "Studio", icon: Camera },
  { id: "wall", label: "On the wall", icon: Home },
  { id: "lifestyle", label: "Lifestyle", icon: Sparkles },
];

export default function Speakers() {
  const [, navigate] = useLocation();
  const [filter, setFilter] = useState<FilterId>("all");

  const photos: SpeakerPhoto[] =
    filter === "all"
      ? speakerGallery
      : speakerGallery.filter((p) => p.tag === filter);

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <div className="container mx-auto px-6 lg:px-12 py-12">
          {/* Back to home — same pattern as FAQs.tsx */}
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-[var(--foreground)]/50 hover:text-[var(--foreground)] transition-colors mb-8 text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>

          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-3xl"
          >
            <span className="text-[var(--accent-brown)] font-bold tracking-wider uppercase text-sm mb-4 block">
              Speakers Collection
            </span>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-[var(--foreground)] mb-4">
              Handcrafted Sound
            </h1>
            <p className="text-[var(--foreground)]/70 text-lg max-w-xl">
              A visual journey through our wooden speaker collection — each
              piece shaped by hand, each grain telling its own story. Browse
              the gallery for a closer look at the craft.
            </p>
          </motion.div>

          {/* Filter pills — same look as FAQs category pills */}
          {speakerGallery.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="mt-10 flex gap-2 overflow-x-auto pb-2"
            >
              {FILTERS.map((f) => {
                const Icon = f.icon;
                const isActive = filter === f.id;
                // "On the wall" is included for the filter UI even if no
                // photos are tagged with it yet — pills just show empty.
                const count =
                  f.id === "all"
                    ? speakerGallery.length
                    : speakerGallery.filter((p) => p.tag === f.id).length;
                return (
                  <button
                    key={f.id}
                    onClick={() => setFilter(f.id)}
                    className={`flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                      isActive
                        ? "bg-[var(--foreground)] text-white shadow-sm"
                        : "bg-white text-[var(--foreground)]/70 border border-[var(--foreground)]/10 hover:border-[var(--accent-brown)] hover:text-[var(--foreground)]"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {f.label}
                    <span
                      className={`text-xs ${
                        isActive ? "text-white/60" : "text-[var(--foreground)]/40"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </motion.div>
          )}

          {/* Gallery */}
          <section className="mt-12">
            {speakerGallery.length === 0 ? (
              <EmptyState />
            ) : photos.length === 0 ? (
              <FilteredEmpty filter={filter} onReset={() => setFilter("all")} />
            ) : (
              <Masonry photos={photos} />
            )}
          </section>

          {/* Shop CTA */}
          <div className="mt-20 bg-[var(--retro-cream)] rounded-[2rem] sm:rounded-[2.5rem] p-8 sm:p-12 text-center">
            <Camera className="w-8 h-8 text-[var(--accent-brown)] mx-auto mb-3" />
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-[var(--foreground)] mb-3">
              Ready to listen?
            </h2>
            <p className="text-[var(--foreground)]/70 max-w-lg mx-auto mb-6">
              See the speakers in person — and hear what 14 hours of
              craftsmanship sounds like.
            </p>
            <Link href="/">
              <Button className="h-12 px-6 rounded-xl bg-[var(--foreground)] hover:bg-[var(--accent-brown)] text-white font-bold transition-colors">
                Shop Speakers <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
      <CartSidebar />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                               Sub-components                                */
/* -------------------------------------------------------------------------- */

function EmptyState() {
  return (
    <div className="bg-[var(--soft-gray)] rounded-3xl p-10 sm:p-16 text-center">
      <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mx-auto mb-5 shadow-sm">
        <Camera className="w-7 h-7 text-[var(--accent-brown)]" />
      </div>
      <h3 className="text-xl font-black text-[var(--foreground)] mb-2">
        Photos coming soon
      </h3>
      <p className="text-[var(--foreground)]/60 max-w-md mx-auto">
        We're still curating the gallery. New photos will appear here shortly —
        check back to see our speakers from every angle.
      </p>
    </div>
  );
}

function FilteredEmpty({
  filter,
  onReset,
}: {
  filter: FilterId;
  onReset: () => void;
}) {
  return (
    <div className="bg-[var(--soft-gray)] rounded-3xl p-10 text-center">
      <Camera className="w-10 h-10 text-[var(--foreground)]/30 mx-auto mb-3" />
      <p className="font-semibold text-[var(--foreground)] mb-1">
        No photos in this category yet
      </p>
      <p className="text-sm text-[var(--foreground)]/60 mb-4">
        Try another filter.
      </p>
      <Button variant="outline" onClick={onReset}>
        Show all photos
      </Button>
    </div>
  );
}

/**
 * Pinterest-style masonry built on CSS columns.
 *
 * Tailwind's `columns-*` utilities split the container into N column tracks
 * and flow children top-to-bottom, left-to-right — exactly the Pinterest look.
 * Each tile uses `break-inside-avoid` so a single image never splits across
 * columns. We rely on intrinsic aspect ratios (via width/height attributes)
 * to keep tile heights varied and organic.
 */
function Masonry({ photos }: { photos: SpeakerPhoto[] }) {
  return (
    <div
      className="columns-2 sm:columns-3 lg:columns-4 gap-4"
      role="list"
    >
      {photos.map((p, i) => (
        <motion.figure
          key={`${p.src}-${i}`}
          role="listitem"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{
            duration: 0.5,
            delay: (i % 8) * 0.05, // stagger within the first viewport
            ease: [0.16, 1, 0.3, 1],
          }}
          className="group relative mb-4 break-inside-avoid rounded-2xl overflow-hidden bg-[var(--soft-gray)] shadow-sm hover:shadow-xl transition-shadow duration-500"
        >
          {/* width/height attrs reserve space so the layout doesn't jump */}
          <OptimizedImage
            src={p.src}
            alt={p.alt}
            width={p.width}
            height={p.height}
            className="w-full h-auto block transition-transform duration-700 ease-out group-hover:scale-[1.03]"
            loading="lazy"
            decoding="async"
          />
          {p.caption && (
            <figcaption className="absolute inset-x-0 bottom-0 p-3 sm:p-4 bg-gradient-to-t from-black/70 via-black/20 to-transparent translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
              <span className="text-white text-sm font-semibold drop-shadow">
                {p.caption}
              </span>
            </figcaption>
          )}
        </motion.figure>
      ))}
    </div>
  );
}
