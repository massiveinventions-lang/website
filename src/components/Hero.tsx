import { motion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Star, Loader2 } from "lucide-react";
import { useRef, useEffect, Suspense, lazy } from "react";
import { useScrollToSection } from "../../cable/hooks/useScrollToSection";

// 3D model — lazy-loaded so the @react-three/* + three bundle (~800KB
// minified) is only fetched on desktop where the canvas is rendered.
// Mobile users never download this code.
const Speaker3D = lazy(() => import("./Speaker3D"));

export default function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollToSection = useScrollToSection();
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Pause the canvas animation when the hero scrolls out of view —
  // requestAnimationFrame burns CPU even when invisible.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    const particles: { x: number; y: number; s: number; v: number; a: number }[] = [];
    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        s: Math.random() * 2 + 1,
        v: Math.random() * 0.5 + 0.1,
        a: Math.random() * Math.PI * 2,
      });
    }

    let animationId: number | null = null;
    let isVisible = true;

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "#C4A882";
      particles.forEach((p) => {
        ctx.globalAlpha = Math.sin(p.a) * 0.5 + 0.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.s, 0, Math.PI * 2);
        ctx.fill();
        p.y -= p.v;
        p.x += Math.sin(p.a) * 0.5;
        p.a += 0.01;
        if (p.y < 0) p.y = height;
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
      });
      animationId = requestAnimationFrame(render);
    };
    const start = () => {
      if (animationId === null) {
        animationId = requestAnimationFrame(render);
      }
    };
    const stop = () => {
      if (animationId !== null) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
    };

    // Only run when the canvas is in the viewport.
    const io = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        if (!e) return;
        isVisible = e.isIntersecting;
        if (isVisible) start();
        else stop();
      },
      { threshold: 0 }
    );
    io.observe(canvas);

    // Resize handling.
    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    return () => {
      io.disconnect();
      window.removeEventListener("resize", handleResize);
      stop();
    };
  }, []);

  return (
    <div ref={containerRef} className="relative overflow-hidden bg-[var(--retro-cream)]">
      <div className="grain-overlay mix-blend-overlay"></div>
      <div className="scanlines mix-blend-overlay opacity-30"></div>
      
      <div className="absolute top-[-10%] right-[-10%] w-[80vw] max-w-[800px] aspect-square rounded-full bg-gradient-to-br from-[var(--accent-light)]/40 to-transparent blur-3xl animate-spin-slow pointer-events-none"></div>
      
      <div className="absolute top-20 right-20 w-96 h-96 border-[4px] border-[var(--accent-brown)]/10 rounded-full animate-pulse-arch pointer-events-none"></div>
      <div className="absolute top-10 right-10 w-[28rem] h-[28rem] border-[2px] border-[var(--accent-brown)]/10 rounded-full animate-pulse-arch pointer-events-none" style={{ animationDelay: "1s" }}></div>
      <div className="absolute top-0 right-0 w-[32rem] h-[32rem] border-[1px] border-[var(--accent-brown)]/10 rounded-full animate-pulse-arch pointer-events-none" style={{ animationDelay: "2s" }}></div>

      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[var(--accent-light)]/20 rounded-full blur-3xl animate-drift pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[var(--accent-brown)]/20 rounded-full blur-3xl animate-drift pointer-events-none" style={{ animationDelay: "-3s" }}></div>

      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none opacity-60 z-0" />

      <div className="container relative z-10 mx-auto px-6 lg:px-12 lg:min-h-screen flex flex-col lg:flex-row items-center pt-28 pb-12 lg:py-24">
        <motion.div 
          className="w-full lg:w-1/2 flex flex-col justify-center gap-6 text-left shrink-0"
          style={{ y, opacity }}
        >
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="inline-flex items-center rounded-full border border-[var(--accent-brown)]/30 bg-[var(--accent-brown)]/10 px-4 py-1.5 text-sm font-semibold text-[var(--accent-brown)] uppercase tracking-wider backdrop-blur-sm">
              Handcrafted Audio
            </span>
          </motion.div>
          
          <motion.h1
            className="text-4xl sm:text-6xl lg:text-7xl xl:text-8xl font-black text-[var(--foreground)] tracking-tighter leading-[1.1]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          >
            Modern Sound, <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent-brown)] to-[var(--retro-brown)]">Vintage Soul</span>
          </motion.h1>
          
          <motion.p
            className="text-base sm:text-lg lg:text-xl text-[var(--foreground)]/80 max-w-md sm:max-w-lg font-medium"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            Premium wooden speakers and audio accessories designed for those who appreciate the warmth of natural acoustics.
          </motion.p>
          
          <motion.div
            className="flex flex-col sm:flex-row items-center gap-4 mt-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <Button
              type="button"
              size="lg"
              onClick={() => scrollToSection("products")}
              className="w-full sm:w-auto bg-[var(--foreground)] text-white hover:bg-[var(--accent-brown)] rounded-full h-14 px-8 text-lg group"
            >
              Explore Collection
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              type="button"
              size="lg"
              variant="outline"
              onClick={() => scrollToSection("features")}
              className="w-full sm:w-auto border-2 border-[var(--foreground)] text-[var(--foreground)] hover:bg-[var(--foreground)] hover:text-white rounded-full h-14 px-8 text-lg bg-transparent"
            >
              Why Wooden?
            </Button>
          </motion.div>

          <motion.div 
            className="flex items-center gap-4 mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-[var(--retro-cream)] bg-[var(--accent-light)] flex items-center justify-center text-xs font-bold text-white overflow-hidden">
                  <img
                    src={`https://api.dicebear.com/7.x/notionists/svg?seed=${i}&backgroundColor=C4A882`}
                    alt="avatar"
                    loading="lazy"
                    decoding="async"
                    width={40}
                    height={40}
                  />
                </div>
              ))}
            </div>
            <div className="flex flex-col">
              <div className="flex text-yellow-500">
                {[1, 2, 3, 4, 5].map((i) => <Star key={i} size={14} fill="currentColor" />)}
              </div>
              <p className="text-sm font-bold text-[var(--foreground)]">1K+ Happy Customers</p>
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          className="hidden lg:block absolute right-0 top-0 bottom-0 w-1/2"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <Suspense
            fallback={
              <div className="w-full h-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-brown)]" />
              </div>
            }
          >
            <Speaker3D />
          </Suspense>
        </motion.div>

        {/* Mobile: 3D model removed for cleaner phone experience.
            Users on small screens see only the headline, copy, and CTAs
            stacked vertically — much faster to load and easier to scan. */}
      </div>
    </div>
  );
}
