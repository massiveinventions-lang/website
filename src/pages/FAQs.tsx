import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Search,
  HelpCircle,
  Package,
  Truck,
  RefreshCw,
  ShieldCheck,
  CreditCard,
  Phone,
  ChevronRight,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import CartSidebar from "@/components/CartSidebar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";

const CATEGORIES = [
  { id: "all", label: "All", icon: HelpCircle },
  { id: "orders", label: "Orders & Shipping", icon: Truck },
  { id: "products", label: "Products", icon: Package },
  { id: "returns", label: "Returns & Refunds", icon: RefreshCw },
  { id: "warranty", label: "Warranty", icon: ShieldCheck },
  { id: "payment", label: "Payment", icon: CreditCard },
] as const;

const FAQS = [
  {
    cat: "orders",
    q: "How long does delivery take?",
    a: "Standard delivery within India takes 3–5 business days. Express delivery is 1–2 business days. International orders take 7–14 business days depending on the destination and customs clearance.",
  },
  {
    cat: "orders",
    q: "How can I track my order?",
    a: "Once your order is shipped, you'll receive an email and SMS with a tracking link. You can also use the Track Order page with your Order ID — it shows real-time status updates and the courier's tracking URL once dispatched.",
  },
  {
    cat: "orders",
    q: "Can I change or cancel my order after placing it?",
    a: "You can cancel or modify an order within 2 hours of placing it, as long as it hasn't been shipped yet. Email returns@massiveinventions.com or contact us via the Contact page with your Order ID.",
  },
  {
    cat: "orders",
    q: "Do you ship internationally?",
    a: "Yes, we ship to 25+ countries. International shipping costs are calculated at checkout based on destination and weight. Customs duties and import taxes (if any) are the responsibility of the recipient.",
  },
  {
    cat: "products",
    q: "Are your speakers made from real wood?",
    a: "Yes. Our Vintage Sheesham Speaker is handcrafted from sustainably sourced Indian Sheesham wood. Each piece has unique grain patterns, which we consider a feature, not a defect. Solid wood is a natural material and may show subtle variations over time.",
  },
  {
    cat: "products",
    q: "Are the earbuds waterproof?",
    a: "The Massive Earbuds X carry an IPX5 rating, which protects against splashes, rain, and sweat during workouts. They are not designed for swimming or full submersion.",
  },
  {
    cat: "products",
    q: "Do the chargers work with iPhones?",
    a: "Yes. The Massive Fast C to C bundle (33W PD) works with iPhone 15 and newer via the included USB-C to USB-C cable. For older iPhones with Lightning, you'll need a separate USB-A to Lightning cable — or any of our USB-A chargers (the Super VOOC 80W or Massive Fast C to C) will work with that cable.",
  },
  {
    cat: "returns",
    q: "What is your return policy?",
    a: "We accept returns within 7 days of delivery for unopened items in original packaging, and within 48 hours for damaged or defective items. See our Returns & Warranty page for full details, or contact support to start a return.",
  },
  {
    cat: "returns",
    q: "When will I receive my refund?",
    a: "Once we receive and inspect your return, refunds are issued within 5 business days to the original payment method. Bank processing may add another 2–3 business days depending on your card issuer.",
  },
  {
    cat: "returns",
    q: "Who pays for return shipping?",
    a: "For defective, damaged, or wrong-item returns within India, we provide a prepaid shipping label — return shipping is on us. For change-of-mind returns, the customer covers return shipping.",
  },
  {
    cat: "warranty",
    q: "How long is the warranty on Massive Inventions products?",
    a: "Speakers and earbuds come with a 1-year manufacturer warranty. Chargers and cables carry an 18-month warranty. Warranty covers defects in materials and workmanship under normal use — see the Returns & Warranty page for the full terms.",
  },
  {
    cat: "warranty",
    q: "What does the warranty not cover?",
    a: "Warranty does not cover cosmetic damage, normal wear and tear, water damage (for non-IPX-rated products), accidental damage, modifications, or repairs performed by unauthorised service centres.",
  },
  {
    cat: "payment",
    q: "What payment methods do you accept?",
    a: "We accept UPI (GPay, PhonePe, Paytm), credit and debit cards (Visa, Mastercard, RuPay, Amex), net banking from all major Indian banks, and popular wallets. All transactions are processed securely via Razorpay.",
  },
  {
    cat: "payment",
    q: "Do you offer Cash on Delivery (COD)?",
    a: "Currently, COD is not available at checkout. We're working on adding it for orders below ₹5,000 in select pin codes. All other orders can be prepaid via any of the methods above.",
  },
  {
    cat: "payment",
    q: "Is it safe to use my card on your site?",
    a: "Yes. Payments are processed via Razorpay, a PCI-DSS Level 1 certified payment gateway. We never see or store your full card number — only the last 4 digits for reference. All data is encrypted in transit with TLS 1.2+.",
  },
];

export default function FAQs() {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]["id"]>("all");

  const filtered = FAQS.filter((f) => {
    if (category !== "all" && f.cat !== category) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q);
    }
    return true;
  });

  const popularCount = 4;

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
              Help Center
            </span>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-[var(--foreground)] mb-4">
              Frequently Asked Questions
            </h1>
            <p className="text-[var(--foreground)]/70 text-lg max-w-xl">
              Quick answers about orders, shipping, returns, warranty, and payment. Can't find what
              you need? Reach out below.
            </p>
          </motion.div>

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="mt-10 max-w-2xl"
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--foreground)]/40 pointer-events-none" />
              <Input
                type="search"
                placeholder="Search questions…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-12 pl-12 pr-4 text-base rounded-2xl border border-[var(--foreground)]/15 focus:border-[var(--accent-brown)]"
              />
            </div>
          </motion.div>

          {/* Category pills */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="mt-6 flex gap-2 overflow-x-auto pb-2"
          >
            {CATEGORIES.map((c) => {
              const Icon = c.icon;
              const isActive = category === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setCategory(c.id)}
                  className={`flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                    isActive
                      ? "bg-[var(--foreground)] text-white shadow-sm"
                      : "bg-white text-[var(--foreground)]/70 border border-[var(--foreground)]/10 hover:border-[var(--accent-brown)] hover:text-[var(--foreground)]"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {c.label}
                </button>
              );
            })}
          </motion.div>

          {/* Quick answers (popular) */}
          {category === "all" && !search && (
            <section className="mt-16">
              <h2 className="text-2xl font-black tracking-tight text-[var(--foreground)] mb-6">
                Most Asked
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {FAQS.slice(0, popularCount).map((f, i) => (
                  <motion.button
                    key={i}
                    onClick={() => setCategory(f.cat as typeof category)}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                    className="group text-left bg-white rounded-2xl border border-[var(--foreground)]/8 p-5 hover:border-[var(--accent-brown)] transition-colors"
                  >
                    <p className="font-semibold text-[var(--foreground)] mb-2 group-hover:text-[var(--accent-brown)] transition-colors">
                      {f.q}
                    </p>
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--accent-brown)]">
                      Read answer
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </motion.button>
                ))}
              </div>
            </section>
          )}

          {/* All FAQs */}
          <section className="mt-16">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black tracking-tight text-[var(--foreground)]">
                {category === "all"
                  ? search
                    ? `Results (${filtered.length})`
                    : "All Questions"
                  : CATEGORIES.find((c) => c.id === category)?.label}
              </h2>
              {(category !== "all" || search) && (
                <button
                  onClick={() => {
                    setCategory("all");
                    setSearch("");
                  }}
                  className="text-sm font-semibold text-[var(--accent-brown)] hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>

            {filtered.length === 0 ? (
              <div className="bg-[var(--soft-gray)] rounded-3xl p-10 text-center">
                <HelpCircle className="w-10 h-10 text-[var(--foreground)]/30 mx-auto mb-3" />
                <p className="font-semibold text-[var(--foreground)] mb-1">No matches</p>
                <p className="text-sm text-[var(--foreground)]/60 mb-4">
                  Try a different search term or clear filters.
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setCategory("all");
                    setSearch("");
                  }}
                >
                  Clear filters
                </Button>
              </div>
            ) : (
              <Accordion type="single" collapsible className="space-y-3">
                {filtered.map((f, i) => (
                  <motion.div
                    key={`${f.q}-${i}`}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <AccordionItem
                      value={`item-${i}`}
                      className="bg-white rounded-2xl border border-[var(--foreground)]/8 px-5 sm:px-6 data-[state=open]:border-[var(--accent-brown)]/40"
                    >
                      <AccordionTrigger className="text-left font-semibold text-[var(--foreground)] py-4 sm:py-5 hover:no-underline">
                        {f.q}
                      </AccordionTrigger>
                      <AccordionContent className="text-[var(--foreground)]/70 leading-relaxed pb-5">
                        {f.a}
                      </AccordionContent>
                    </AccordionItem>
                  </motion.div>
                ))}
              </Accordion>
            )}
          </section>

          {/* Contact CTA */}
          <div className="mt-20 bg-[var(--retro-cream)] rounded-[2rem] sm:rounded-[2.5rem] p-8 sm:p-12 text-center">
            <Phone className="w-8 h-8 text-[var(--accent-brown)] mx-auto mb-3" />
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-[var(--foreground)] mb-3">
              Still have questions?
            </h2>
            <p className="text-[var(--foreground)]/70 max-w-lg mx-auto mb-6">
              Our support team is happy to help. We typically reply within 4 business hours.
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
