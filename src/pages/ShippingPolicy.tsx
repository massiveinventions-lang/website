import { useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Truck,
  Package,
  Clock,
  Globe,
  MapPin,
  ShieldCheck,
  Zap,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import CartSidebar from "@/components/CartSidebar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";

const SHIPPING_METHODS = [
  {
    icon: Zap,
    name: "Standard Delivery",
    eta: "3–5 business days",
    cost: "Free on orders above ₹499 · otherwise ₹49",
    desc: "Our most popular option. Tracked end-to-end with the country's best couriers.",
  },
  {
    icon: Truck,
    name: "Express Delivery",
    eta: "1–2 business days",
    cost: "₹149 flat",
    desc: "Priority dispatch from our warehouse, with same-day handoff in metro cities.",
  },
  {
    icon: Globe,
    name: "International Shipping",
    eta: "7–14 business days",
    cost: "Calculated at checkout",
    desc: "Available to 25+ countries. Customs duties may apply at destination.",
  },
];

const STEPS = [
  {
    day: "Day 0",
    title: "Order Placed",
    body: "You complete checkout. We confirm payment and send an order confirmation email with your Order ID.",
  },
  {
    day: "Day 1",
    title: "Packed & Labeled",
    body: "Our team hand-picks, inspects, and packs your order in recyclable packaging. A tracking link is emailed to you.",
  },
  {
    day: "Day 1–2",
    title: "Shipped",
    body: "Handed to our shipping partner. The AWB and courier name appear in your tracking page.",
  },
  {
    day: "Day 2–5",
    title: "Out for Delivery",
    body: "The package reaches your city and is dispatched from the local hub for last-mile delivery.",
  },
  {
    day: "Day 3–5",
    title: "Delivered",
    body: "Package delivered to your address. You receive a delivery confirmation with a photo (where available).",
  },
];

export default function ShippingPolicy() {
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
              Shipping Policy
            </span>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-[var(--foreground)] mb-4">
              Fast, Tracked, Insured.
            </h1>
            <p className="text-[var(--foreground)]/70 text-lg max-w-xl">
              We ship every order within 24 hours. Here's exactly what to expect, from checkout to
              doorstep.
            </p>
            <p className="text-xs text-[var(--foreground)]/40 mt-4">
              Last updated: January 2025
            </p>
          </motion.div>

          {/* Shipping methods */}
          <section className="mt-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-black tracking-tight text-[var(--foreground)] mb-3">
                Delivery Options
              </h2>
              <p className="text-[var(--foreground)]/60 max-w-xl mx-auto">
                Choose the speed that suits you. All options are fully tracked.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {SHIPPING_METHODS.map((m, i) => {
                const Icon = m.icon;
                return (
                  <motion.div
                    key={m.name}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                    className="bg-white rounded-3xl border border-[var(--foreground)]/8 p-6 sm:p-8"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-[var(--accent-brown)]/10 text-[var(--accent-brown)] flex items-center justify-center mb-5">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-lg text-[var(--foreground)] mb-1">{m.name}</h3>
                    <p className="text-sm font-semibold text-[var(--accent-brown)] mb-3">
                      {m.eta}
                    </p>
                    <p className="text-sm text-[var(--foreground)]/70 leading-relaxed mb-4">
                      {m.desc}
                    </p>
                    <div className="pt-4 border-t border-[var(--foreground)]/8">
                      <p className="text-xs font-semibold text-[var(--foreground)]/50 uppercase tracking-wider">
                        Cost
                      </p>
                      <p className="text-sm font-semibold text-[var(--foreground)] mt-1">
                        {m.cost}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </section>

          {/* Timeline */}
          <section className="mt-24 bg-[var(--retro-cream)] rounded-[2rem] sm:rounded-[2.5rem] p-8 sm:p-12 lg:p-16">
            <div className="max-w-3xl">
              <span className="text-[var(--accent-brown)] font-bold tracking-wider uppercase text-sm mb-4 block">
                What Happens After Checkout
              </span>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight text-[var(--foreground)] mb-10">
                Your Order's Journey
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 md:gap-4">
              {STEPS.map((s, i) => (
                <motion.div
                  key={s.day}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                  className="relative"
                >
                  <div className="flex md:flex-col items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-[var(--foreground)] text-white text-sm font-black flex items-center justify-center flex-shrink-0">
                      {i + 1}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[var(--accent-brown)] uppercase tracking-wider mb-1">
                        {s.day}
                      </p>
                      <p className="font-bold text-[var(--foreground)] mb-1">{s.title}</p>
                      <p className="text-sm text-[var(--foreground)]/70 leading-relaxed">
                        {s.body}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Coverage / fine print */}
          <section className="mt-24 grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="bg-[var(--soft-gray)] rounded-3xl p-6 sm:p-8"
            >
              <MapPin className="w-7 h-7 text-[var(--accent-brown)] mb-4" />
              <h3 className="text-xl font-bold text-[var(--foreground)] mb-3">
                Where We Ship
              </h3>
              <ul className="space-y-2 text-sm text-[var(--foreground)]/70">
                <li>• All 28 states and 8 union territories across India</li>
                <li>• Same-day dispatch in Bengaluru, Mumbai, Delhi NCR, Hyderabad, Chennai, Pune</li>
                <li>• International shipping to 25+ countries via trusted global couriers</li>
                <li>• PO Box addresses accepted for Standard Delivery only</li>
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="bg-[var(--soft-gray)] rounded-3xl p-6 sm:p-8"
            >
              <ShieldCheck className="w-7 h-7 text-[var(--accent-brown)] mb-4" />
              <h3 className="text-xl font-bold text-[var(--foreground)] mb-3">
                Shipping Guarantees
              </h3>
              <ul className="space-y-2 text-sm text-[var(--foreground)]/70">
                <li>• Every order is insured against loss and damage in transit</li>
                <li>• Free replacement if your package is lost in transit</li>
                <li>• Signature on delivery for orders above ₹2,000</li>
                <li>• Real-time tracking via SMS, email, and our website</li>
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="bg-[var(--soft-gray)] rounded-3xl p-6 sm:p-8"
            >
              <Package className="w-7 h-7 text-[var(--accent-brown)] mb-4" />
              <h3 className="text-xl font-bold text-[var(--foreground)] mb-3">
                Packaging Standards
              </h3>
              <ul className="space-y-2 text-sm text-[var(--foreground)]/70">
                <li>• 100% recyclable outer packaging</li>
                <li>• Custom-fit foam inserts for fragile items (speakers, chargers)</li>
                <li>• Tamper-evident sealing on every parcel</li>
                <li>• Branded unboxing experience included</li>
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="bg-[var(--soft-gray)] rounded-3xl p-6 sm:p-8"
            >
              <Clock className="w-7 h-7 text-[var(--accent-brown)] mb-4" />
              <h3 className="text-xl font-bold text-[var(--foreground)] mb-3">
                Delays & Exceptions
              </h3>
              <ul className="space-y-2 text-sm text-[var(--foreground)]/70">
                <li>• Monsoon, regional holidays, and courier strikes can add 1–2 days</li>
                <li>• Remote PIN codes (e.g. J&K, Andaman, Lakshadweep) may take 5–7 days</li>
                <li>• International orders subject to customs clearance at destination</li>
                <li>• We proactively notify you of any expected delay</li>
              </ul>
            </motion.div>
          </section>

          <div className="mt-20 text-center">
            <p className="text-[var(--foreground)]/60 mb-4">
              Have a specific question about your shipment?
            </p>
            <Button
              onClick={() => navigate("/contact")}
              className="h-12 px-6 rounded-xl bg-[var(--foreground)] hover:bg-[var(--accent-brown)] text-white font-bold transition-colors"
            >
              Contact Support
            </Button>
          </div>
        </div>
      </main>
      <Footer />
      <CartSidebar />
    </div>
  );
}
