import { useState, FormEvent } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const WEB3FORMS_URL = "https://api.web3forms.com/submit";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;

    const trimmed = email.trim();
    if (!trimmed) {
      toast.error("Please enter your email.");
      return;
    }

    setLoading(true);

    // Fire both requests in parallel. Supabase is the source of truth —
    // Web3Forms is a "ping me on new subscriber" notification, not
    // authoritative. allSettled (not all) so one failure doesn't
    // short-circuit the other.
    const [dbResult, mailResult] = await Promise.allSettled([
      fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed, source: "homepage" }),
      }),
      fetch(WEB3FORMS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_key: import.meta.env.VITE_WEB3FORMS_KEY,
          to: import.meta.env.VITE_WEB3FORMS_TO,
          subject: `New Massive Club subscriber: ${trimmed}`,
          from_name: "Massive Inventions Website",
          replyto: trimmed,
          message: [
            `New subscriber from the homepage newsletter form.`,
            ``,
            `Email: ${trimmed}`,
            `Source: homepage`,
            `Time: ${new Date().toISOString()}`,
          ].join("\n"),
        }),
      }),
    ]);

    setLoading(false);

    // Supabase failed -> show error, don't reset the email.
    const dbOk =
      dbResult.status === "fulfilled" && dbResult.value.ok;
    if (!dbOk) {
      toast.error("Couldn't subscribe right now. Please try again.");
      return;
    }

    // Web3Forms failure is non-fatal — log it, but the user is in.
    const mailOk =
      mailResult.status === "fulfilled" && mailResult.value.ok;
    if (!mailOk) {
      // eslint-disable-next-line no-console
      console.warn("[newsletter] Web3Forms notification failed (non-fatal)");
    }

    toast.success("You're in! Welcome to the Massive Club 🎉");
    setEmail("");
  };

  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="bg-[var(--foreground)] rounded-[2.5rem] p-10 md:p-16 lg:p-20 relative overflow-hidden text-center"
        >
          <div className="absolute top-[-20%] left-[-10%] w-64 h-64 rounded-full border-[20px] border-white/5 opacity-50" />
          <div className="absolute bottom-[-20%] right-[-10%] w-80 h-80 rounded-full border-[30px] border-[var(--accent-brown)]/10" />

          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-6">
              Join the <span className="text-[var(--accent-light)]">Massive</span> Club
            </h2>
            <p className="text-white/70 text-lg mb-10">
              Subscribe to get exclusive drops, early access to limited edition wooden pieces, and 10% off your first order.
            </p>

            <form
              className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto"
              onSubmit={handleSubmit}
              noValidate
            >
              <Input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="h-14 bg-white/10 border-white/20 text-white placeholder:text-white/40 rounded-full px-6 focus-visible:ring-[var(--accent-light)] text-base disabled:opacity-60"
                required
              />
              <Button
                type="submit"
                disabled={loading}
                className="h-14 bg-[var(--accent-brown)] hover:bg-[var(--accent-light)] text-white rounded-full px-8 text-base font-bold whitespace-nowrap transition-colors disabled:opacity-60"
              >
                {loading ? "Subscribing…" : "Subscribe"}
              </Button>
            </form>
            <p className="text-white/40 text-sm mt-6">We respect your privacy. Unsubscribe at any time.</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
