import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, FileText } from "lucide-react";
import Navbar from "@/components/Navbar";
import CartSidebar from "@/components/CartSidebar";
import Footer from "@/components/Footer";

const SECTIONS = [
  {
    title: "1. Acceptance of Terms",
    body: "By using our website or purchasing products from Massive Inventions Pvt. Ltd., you confirm that you have read, understood, and agreed to these Terms of Service.",
  },
  {
    title: "2. Products and Services",
    body: "Massive Inventions designs, manufactures, and sells consumer electronics, wooden audio products, accessories, and related products.\n\nWe strive to ensure that all product descriptions, specifications, pricing, and images are accurate. However, minor variations in color, finish, or appearance may occur, especially for handcrafted products made from natural materials such as wood.",
  },
  {
    title: "3. Orders",
    body: "All orders are subject to acceptance and availability.",
    bullets: [
      "Accept or reject any order.",
      "Cancel orders in cases of pricing errors, suspected fraud, or product unavailability.",
      "Limit quantities purchased by a customer.",
    ],
    bulletPreamble: "We reserve the right to:",
    bulletSuffix: "If your order is cancelled after payment, any eligible refund will be processed through the original payment method.",
  },
  {
    title: "4. Pricing and Payments",
    body: "All prices are displayed in Indian Rupees (INR) unless stated otherwise.\n\nApplicable taxes, shipping charges, and other fees will be displayed during checkout.\n\nPayments are processed securely through authorized payment providers. Massive Inventions does not store your payment card information.",
  },
  {
    title: "5. Shipping and Delivery",
    body: "We aim to dispatch orders as quickly as possible.\n\nEstimated delivery times are provided for convenience and may vary depending on courier operations, weather conditions, public holidays, or other circumstances beyond our control.\n\nOwnership and risk of the product pass to the customer upon successful delivery.",
  },
  {
    title: "6. Returns and Refunds",
    body: "Returns and refunds are subject to our Return & Refund Policy.",
    bullets: [
      "Have been used or damaged by the customer.",
      "Are missing accessories or original packaging.",
      "Are customized or personalized.",
    ],
    bulletPreamble: "Products may not be eligible for return if they:",
    bulletSuffix: "Approved refunds will be processed through the original payment method.",
  },
  {
    title: "7. Warranty",
    body: "Certain products sold by Massive Inventions include a limited warranty.",
    bullets: [
      "Physical damage",
      "Water or liquid damage",
      "Fire damage",
      "Unauthorized modifications or repairs",
      "Normal wear and tear",
      "Damage caused by misuse or improper handling",
    ],
    bulletPreamble: "The warranty does not cover:",
    bulletSuffix: "Warranty terms may vary depending on the product.",
  },
  {
    title: "8. Customer Responsibilities",
    body: "Customers agree to:",
    bullets: [
      "Provide accurate billing and shipping information.",
      "Use products according to the provided instructions.",
      "Not misuse or alter products in a way that may create safety risks.",
      "Comply with all applicable laws while using our products and services.",
    ],
  },
];

export default function TermsOfService() {
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

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-3xl mb-14"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-[var(--accent-brown)]/10 text-[var(--accent-brown)] flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <span className="text-[var(--accent-brown)] font-bold tracking-wider uppercase text-sm">
                Legal
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-[var(--foreground)] mb-4">
              Terms of Service
            </h1>
            <p className="text-[var(--foreground)]/60 text-base">
              Welcome to Massive Inventions Pvt. Ltd. ("Massive", "we", "our", or "us"). These Terms
              of Service ("Terms") govern your use of our website, products, and services. By
              accessing our website or purchasing our products, you agree to these Terms.
            </p>
            <p className="text-xs text-[var(--foreground)]/40 mt-4">
              Effective Date: June 27, 2026
            </p>
          </motion.div>

          {/* Sections */}
          <div className="max-w-3xl space-y-8">
            {SECTIONS.map((section, i) => (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                className="bg-white rounded-3xl border border-[var(--foreground)]/8 p-6 sm:p-8"
              >
                <h2 className="text-xl font-bold text-[var(--foreground)] mb-4">
                  {section.title}
                </h2>

                {section.body.split("\n\n").map((para, j) => (
                  <p key={j} className="text-[var(--foreground)]/70 leading-relaxed mb-3 text-sm">
                    {para}
                  </p>
                ))}

                {section.bulletPreamble && (
                  <p className="text-[var(--foreground)]/70 text-sm mb-2">
                    {section.bulletPreamble}
                  </p>
                )}

                {section.bullets && (
                  <ul className="space-y-2 mb-3 ml-2">
                    {section.bullets.map((bullet, k) => (
                      <li key={k} className="flex items-start gap-2 text-sm text-[var(--foreground)]/70">
                        <span className="mt-2 w-1.5 h-1.5 rounded-full bg-[var(--accent-brown)] flex-shrink-0" />
                        {bullet}
                      </li>
                    ))}
                  </ul>
                )}

                {section.bulletSuffix && (
                  <p className="text-[var(--foreground)]/70 text-sm mt-3">
                    {section.bulletSuffix}
                  </p>
                )}
              </motion.div>
            ))}
          </div>

          {/* Contact CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-3xl mt-10 bg-[var(--retro-cream)] rounded-3xl p-8 text-center"
          >
            <h3 className="text-lg font-bold text-[var(--foreground)] mb-2">
              Questions about these Terms?
            </h3>
            <p className="text-[var(--foreground)]/60 text-sm mb-5">
              Reach out to us at{" "}
              <a
                href="mailto:massiveinventions@gmail.com"
                className="text-[var(--accent-brown)] hover:underline font-medium"
              >
                massiveinventions@gmail.com
              </a>{" "}
              and we'll get back to you within 2 business days.
            </p>
          </motion.div>
        </div>
      </main>
      <Footer />
      <CartSidebar />
    </div>
  );
}
