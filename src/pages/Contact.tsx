import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  CheckCircle2,
  MessageCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { SiInstagram } from "react-icons/si";
import Navbar from "@/components/Navbar";
import CartSidebar from "@/components/CartSidebar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const WEB3FORMS_URL = "https://api.web3forms.com/submit";

// Real brand contact details — single source of truth shared with the footer.
const BRAND = {
  email: "massiveinventions@gmail.com",
  whatsappDisplay: "+91 94135 82708",
  whatsappLink: "https://wa.me/919413582708",
  instagramUrl: "https://www.instagram.com/massive_inventions/",
  instagramHandle: "@massive_inventions",
  studio: {
    line1: "Massive Inventions Studio",
    line2: "India",
  },
  replySla: "4 business hours",
};

const WA_GREETING = encodeURIComponent(
  "Hi Massive Inventions, I'd like to get in touch."
);

const REASONS = [
  "Order support",
  "Product question",
  "Replacement request",
  "Warranty claim",
  "Wholesale enquiry",
  "Press & partnerships",
  "Other",
];

const CONTACT_CARDS = [
  {
    icon: Mail,
    title: "Email",
    line1: BRAND.email,
    line2: `We reply within ${BRAND.replySla}`,
    href: `mailto:${BRAND.email}?subject=Inquiry%20from%20Massive%20Inventions%20website`,
  },
  {
    icon: MessageCircle,
    title: "WhatsApp",
    line1: BRAND.whatsappDisplay,
    line2: "Quick replies, 9am–9pm IST",
    href: `${BRAND.whatsappLink}?text=${WA_GREETING}`,
  },
  {
    icon: Phone,
    title: "Phone",
    line1: BRAND.whatsappDisplay,
    line2: "Mon–Sat · 10:00–19:00 IST",
    href: `tel:+919413582708`,
  },
  {
    icon: MapPin,
    title: "Studio",
    line1: BRAND.studio.line1,
    line2: BRAND.studio.line2,
    href: BRAND.instagramUrl,
  },
];

export default function Contact() {
  const [, navigate] = useLocation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState("Order support");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      setError("Please fill in all fields before sending.");
      return;
    }

    setLoading(true);
    try {
      // Replacement requests go to the dedicated backend endpoint so
      // they show up in the admin panel. Everything else goes to
      // Web3Forms (email-only, no DB record) for inbox triage.
      if (reason === "Replacement request") {
        const res = await fetch("/api/replacement-requests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            email,
            reason,
            message: `Subject: ${subject}\n\n${message}`,
          }),
        });
        const body = (await res.json().catch(() => ({}))) as {
          message?: string;
          error?: string;
        };
        if (!res.ok) throw new Error(body.error ?? `Server returned ${res.status}`);
        toast.success(body.message ?? "Replacement request submitted");
        setSent(true);
        return;
      }

      // Default path: send the form to Web3Forms (real inbox delivery,
      // same pattern as the newsletter). We don't store contact-form
      // messages in the DB; they live in your email so you can triage
      // them naturally.
      const res = await fetch(WEB3FORMS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_key: import.meta.env.VITE_WEB3FORMS_KEY,
          to: import.meta.env.VITE_WEB3FORMS_TO,
          subject: `[Contact form · ${reason}] ${subject}`,
          from_name: name,
          replyto: email,
          message: [
            `New contact-form submission from the website.`,
            ``,
            `Name:    ${name}`,
            `Email:   ${email}`,
            `Reason:  ${reason}`,
            `Subject: ${subject}`,
            ``,
            `Message:`,
            message,
            ``,
            `—`,
            `Sent at: ${new Date().toISOString()}`,
          ].join("\n"),
        }),
      });

      if (!res.ok) throw new Error(`Web3Forms returned ${res.status}`);

      setSent(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Couldn't send message. Please try WhatsApp or email instead."
      );
    } finally {
      setLoading(false);
    }
  };

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
              Get In Touch
            </span>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-[var(--foreground)] mb-4">
              We'd Love to Hear From You
            </h1>
            <p className="text-[var(--foreground)]/70 text-lg max-w-xl">
              Questions about an order, a product, or a partnership? Pick a channel below or fill
              out the form — we usually reply within {BRAND.replySla}.
            </p>
          </motion.div>

          {/* Quick contact cards */}
          <section className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {CONTACT_CARDS.map((c, i) => {
              const Icon = c.icon;
              const isExternal = c.href.startsWith("http") || c.href.startsWith("https");
              return (
                <motion.a
                  key={c.title}
                  href={c.href}
                  target={isExternal ? "_blank" : undefined}
                  rel={isExternal ? "noopener noreferrer" : undefined}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                  className="group bg-white rounded-3xl border border-[var(--foreground)]/8 p-6 hover:border-[var(--accent-brown)] transition-colors"
                >
                  <div className="w-12 h-12 rounded-2xl bg-[var(--accent-brown)]/10 text-[var(--accent-brown)] flex items-center justify-center mb-4 group-hover:bg-[var(--accent-brown)] group-hover:text-white transition-colors">
                    <Icon className="w-6 h-6" />
                  </div>
                  <p className="font-bold text-[var(--foreground)] mb-1">{c.title}</p>
                  <p className="text-sm font-semibold text-[var(--foreground)] break-all">
                    {c.line1}
                  </p>
                  <p className="text-xs text-[var(--foreground)]/60 mt-1">{c.line2}</p>
                </motion.a>
              );
            })}
          </section>

          {/* Form + business hours */}
          <section className="mt-16 grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-2 bg-white rounded-3xl border border-[var(--foreground)]/8 p-6 sm:p-8"
            >
              {sent ? (
                <div className="text-center py-10">
                  <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-black text-[var(--foreground)] mb-2">
                    Message sent!
                  </h2>
                  <p className="text-[var(--foreground)]/70 max-w-md mx-auto mb-6">
                    Thanks for reaching out. We've received your message and will get back to you
                    within {BRAND.replySla}.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setSent(false);
                      setName("");
                      setEmail("");
                      setSubject("");
                      setMessage("");
                      setReason("Order support");
                    }}
                  >
                    Send another message
                  </Button>
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-black text-[var(--foreground)] mb-1">
                    Send us a message
                  </h2>
                  <p className="text-sm text-[var(--foreground)]/60 mb-6">
                    Fill in the form and we'll get back to you within {BRAND.replySla}.
                  </p>

                  <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-[var(--foreground)]/60 mb-1.5 uppercase tracking-wider">
                          Full Name
                        </label>
                        <Input
                          required
                          placeholder="Your name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="h-11 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[var(--foreground)]/60 mb-1.5 uppercase tracking-wider">
                          Email
                        </label>
                        <Input
                          required
                          type="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="h-11 text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[var(--foreground)]/60 mb-1.5 uppercase tracking-wider">
                        What's this about?
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {REASONS.map((r) => {
                          const isActive = reason === r;
                          return (
                            <button
                              key={r}
                              type="button"
                              onClick={() => setReason(r)}
                              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                                isActive
                                  ? "bg-[var(--foreground)] text-white"
                                  : "bg-[var(--soft-gray)] text-[var(--foreground)]/70 hover:bg-[var(--accent-brown)]/15 hover:text-[var(--accent-brown)]"
                              }`}
                            >
                              {r}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[var(--foreground)]/60 mb-1.5 uppercase tracking-wider">
                        Subject
                      </label>
                      <Input
                        required
                        placeholder="Brief summary of your question"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="h-11 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[var(--foreground)]/60 mb-1.5 uppercase tracking-wider">
                        Message
                      </label>
                      <Textarea
                        required
                        rows={6}
                        placeholder="Tell us a bit more. Order IDs, product names, and screenshots help us answer faster."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="text-sm"
                      />
                    </div>

                    {error && (
                      <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800">
                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>{error}</span>
                      </div>
                    )}

                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full sm:w-auto h-11 px-6 rounded-xl bg-[var(--foreground)] hover:bg-[var(--accent-brown)] text-white font-bold transition-colors"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Sending…
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Send Message
                        </>
                      )}
                    </Button>
                  </form>
                </>
              )}
            </motion.div>

            {/* Sidebar */}
            <motion.aside
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-6"
            >
              <div className="bg-[var(--foreground)] text-white rounded-3xl p-6 sm:p-7">
                <Clock className="w-7 h-7 text-[var(--accent-light)] mb-3" />
                <h3 className="text-lg font-bold mb-3">Business Hours</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex justify-between">
                    <span className="text-white/70">Monday – Friday</span>
                    <span className="font-semibold">10:00 – 19:00</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-white/70">Saturday</span>
                    <span className="font-semibold">10:00 – 17:00</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-white/70">Sunday</span>
                    <span className="font-semibold text-white/50">Closed</span>
                  </li>
                </ul>
                <p className="text-xs text-white/50 mt-4 leading-relaxed">
                  All times in IST. Phone and WhatsApp support are available during business
                  hours. Email support replies within {BRAND.replySla}.
                </p>
              </div>

              <div className="bg-white rounded-3xl border border-[var(--foreground)]/8 p-6 sm:p-7">
                <h3 className="text-lg font-bold text-[var(--foreground)] mb-1">
                  Find us on
                </h3>
                <p className="text-sm text-[var(--foreground)]/60 mb-5">
                  Behind-the-scenes content, new launches, and customer stories.
                </p>
                <div className="flex flex-wrap gap-3">
                  <a
                    href={BRAND.instagramUrl}
                    aria-label="Instagram"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-11 h-11 rounded-full bg-[var(--soft-gray)] hover:bg-gradient-to-br hover:from-[#f09433] hover:via-[#e6683c] hover:to-[#bc1888] hover:text-white text-[var(--foreground)]/70 flex items-center justify-center transition-colors"
                  >
                    <SiInstagram className="w-5 h-5" />
                  </a>
                  <a
                    href={`${BRAND.whatsappLink}?text=${WA_GREETING}`}
                    aria-label="WhatsApp"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-11 h-11 rounded-full bg-[var(--soft-gray)] hover:bg-[#25D366] hover:text-white text-[var(--foreground)]/70 flex items-center justify-center transition-colors"
                  >
                    <MessageCircle className="w-5 h-5" />
                  </a>
                  <a
                    href={`mailto:${BRAND.email}?subject=Inquiry%20from%20Massive%20Inventions%20website`}
                    aria-label="Email"
                    className="w-11 h-11 rounded-full bg-[var(--soft-gray)] hover:bg-[#EA4335] hover:text-white text-[var(--foreground)]/70 flex items-center justify-center transition-colors"
                  >
                    <Mail className="w-5 h-5" />
                  </a>
                </div>
              </div>

              <div className="bg-[var(--retro-cream)] rounded-3xl p-6 sm:p-7">
                <h3 className="text-base font-bold text-[var(--foreground)] mb-2">
                  Press & Partnerships
                </h3>
                <p className="text-sm text-[var(--foreground)]/70 leading-relaxed mb-3">
                  For media enquiries, review units, and bulk / wholesale requests, email our
                  partnerships team directly.
                </p>
                <a
                  href={`mailto:${BRAND.email}?subject=Press%20%2F%20Partnership%20enquiry`}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--accent-brown)] hover:underline break-all"
                >
                  {BRAND.email} →
                </a>
              </div>
            </motion.aside>
          </section>
        </div>
      </main>
      <Footer />
      <CartSidebar />
    </div>
  );
}
