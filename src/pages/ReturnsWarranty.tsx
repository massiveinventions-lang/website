import { useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  RefreshCcw,
  ShieldCheck,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  Mail,
  Wrench,
  Sparkles,
  Truck,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import CartSidebar from "@/components/CartSidebar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";

const STEPS = [
  {
    icon: Mail,
    title: "Email replacements@massiveinventions.com",
    body: "Send us your order ID, the item you want to replace, and the reason. We reply within 4 business hours.",
  },
  {
    icon: Package,
    title: "Pack the item securely",
    body: "Use the original packaging if possible. Include all accessories, cables, and the original invoice.",
  },
  {
    icon: Truck,
    title: "We pick it up — free",
    body: "Our courier collects the item from your doorstep at no cost. No shipping label to print, no courier to find.",
  },
  {
    icon: CheckCircle2,
    title: "Replacement delivered",
    body: "We inspect, ship a fresh unit the same day, and you'll have it within 3–5 business days. Completely free.",
  },
];

const ELIGIBLE = [
  "Defective products (DOA or manufacturing faults)",
  "Damaged in transit — please report within 48 hours of delivery",
  "Wrong item received — we'll ship the correct one immediately",
  "Products showing functional issues within the 5-day window",
];

const NOT_ELIGIBLE = [
  "Requests raised more than 5 days after delivery",
  "Products showing signs of use, damage, or modification",
  "Items missing original packaging, accessories, or invoice",
  "Customised, personalised, or clearance items",
  "Earbuds / in-ear products with opened or used ear-tips",
  "Change-of-mind returns (we only replace defective or wrong items)",
];

const COVERAGE = [
  {
    icon: ShieldCheck,
    product: "Vintage Sheesham Speaker",
    period: "1 year",
    body: "Covers driver failure, amplifier defects, and manufacturing faults. Wood-grain variations are natural and not covered.",
  },
  {
    icon: ShieldCheck,
    product: "Massive Earbuds X",
    period: "1 year",
    body: "Covers battery degradation below 70% capacity, charging case faults, and Bluetooth connectivity defects.",
  },
  {
    icon: ShieldCheck,
    product: "Chargers & Cables",
    period: "18 months",
    body: "Covers power delivery failure, port damage under normal use, and cable fraying within the warranty window.",
  },
];

export default function ReturnsWarranty() {
  const [, navigate] = useLocation();
  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <div className="container mx-auto px-6 lg:px-12 py-12">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-[var(--foreground)]/50 hover:text-[var(--foreground)] transition-colors mb-8 text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-3xl"
          >
            <span className="text-[var(--accent-brown)] font-bold tracking-wider uppercase text-sm mb-4 block">
              Replacement & Warranty
            </span>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-[var(--foreground)] mb-4">
              5-Day Free Replacement. Real Warranty.
            </h1>
            <p className="text-[var(--foreground)]/70 text-lg max-w-xl">
              If something's not right, we replace it — fast and free. We pick up the unit from your
              doorstep and ship a fresh one, no questions asked.
            </p>
            <p className="text-xs text-[var(--foreground)]/40 mt-4">
              Last updated: January 2025
            </p>
          </motion.div>

          {/* Two-column quick facts */}
          <section className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: Clock, value: "5 Days", label: "Replacement window" },
              { icon: Truck, value: "Free", label: "Pickup & delivery in India" },
              { icon: RefreshCcw, value: "3–5 Days", label: "Replacement turnaround" },
            ].map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                  className="bg-white rounded-3xl border border-[var(--foreground)]/8 p-6 text-center"
                >
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-[var(--accent-brown)]/10 text-[var(--accent-brown)] flex items-center justify-center mb-3">
                    <Icon className="w-6 h-6" />
                  </div>
                  <p className="text-3xl font-black text-[var(--foreground)]">{s.value}</p>
                  <p className="text-sm text-[var(--foreground)]/60 mt-1">{s.label}</p>
                </motion.div>
              );
            })}
          </section>

          {/* Process steps */}
          <section className="mt-20">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-[var(--foreground)] mb-3">
              How Replacement Works
            </h2>
            <p className="text-[var(--foreground)]/60 max-w-2xl mb-10">
              Four steps. No phone calls, no shipping labels. Most replacements are delivered within a
              week.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {STEPS.map((s, i) => {
                const Icon = s.icon;
                return (
                  <motion.div
                    key={s.title}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                    className="bg-white rounded-3xl border border-[var(--foreground)]/8 p-6"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-9 h-9 rounded-full bg-[var(--accent-brown)] text-white text-sm font-black flex items-center justify-center">
                        {i + 1}
                      </div>
                      <Icon className="w-5 h-5 text-[var(--accent-brown)]" />
                    </div>
                    <h3 className="font-bold text-[var(--foreground)] mb-2">{s.title}</h3>
                    <p className="text-sm text-[var(--foreground)]/60 leading-relaxed">{s.body}</p>
                  </motion.div>
                );
              })}
            </div>
          </section>

          {/* Eligibility */}
          <section className="mt-20 grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="bg-[var(--retro-cream)] rounded-3xl p-6 sm:p-8"
            >
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
                <h3 className="text-xl font-bold text-[var(--foreground)]">Eligible for Replacement</h3>
              </div>
              <ul className="space-y-2.5 text-sm text-[var(--foreground)]/80">
                {ELIGIBLE.map((e, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>{e}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="bg-white rounded-3xl border border-[var(--foreground)]/8 p-6 sm:p-8"
            >
              <div className="flex items-center gap-3 mb-4">
                <XCircle className="w-6 h-6 text-red-500" />
                <h3 className="text-xl font-bold text-[var(--foreground)]">Not Eligible</h3>
              </div>
              <ul className="space-y-2.5 text-sm text-[var(--foreground)]/70">
                {NOT_ELIGIBLE.map((e, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <span>{e}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </section>

          {/* Warranty */}
          <section className="mt-20 bg-[var(--foreground)] text-white rounded-[2rem] sm:rounded-[2.5rem] p-8 sm:p-12 lg:p-16">
            <div className="flex items-center gap-3 mb-3">
              <Wrench className="w-6 h-6 text-[var(--accent-light)]" />
              <span className="text-[var(--accent-light)] font-bold tracking-wider uppercase text-sm">
                Warranty Coverage
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-3">
              Covered for the Long Run
            </h2>
            <p className="text-white/70 max-w-2xl mb-10">
              Every Massive Inventions product comes with a manufacturer warranty against defects in
              materials and workmanship — beyond the 5-day replacement window.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {COVERAGE.map((c, i) => {
                const Icon = c.icon;
                return (
                  <motion.div
                    key={c.product}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                    className="bg-white/5 border border-white/10 rounded-3xl p-6"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <Icon className="w-7 h-7 text-[var(--accent-light)]" />
                      <span className="text-2xl font-black text-[var(--accent-light)]">
                        {c.period}
                      </span>
                    </div>
                    <h3 className="font-bold mb-2">{c.product}</h3>
                    <p className="text-sm text-white/60 leading-relaxed">{c.body}</p>
                  </motion.div>
                );
              })}
            </div>
          </section>

          {/* Help CTA */}
          <div className="mt-16 text-center bg-[var(--soft-gray)] rounded-3xl p-8">
            <Sparkles className="w-8 h-8 text-[var(--accent-brown)] mx-auto mb-3" />
            <h3 className="text-xl font-bold text-[var(--foreground)] mb-2">
              Need a replacement or have a warranty claim?
            </h3>
            <p className="text-[var(--foreground)]/60 mb-5 max-w-md mx-auto text-sm">
              Our support team replies within 4 business hours, Monday through Saturday.
            </p>
            <Button
              onClick={() => navigate("/contact")}
              className="h-11 px-6 rounded-xl bg-[var(--foreground)] hover:bg-[var(--accent-brown)] text-white font-bold transition-colors"
            >
              Request a Replacement
            </Button>
          </div>
        </div>
      </main>
      <Footer />
      <CartSidebar />
    </div>
  );
}