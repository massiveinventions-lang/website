import { useEffect, useState, FormEvent } from "react";
import { useLocation, Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import AuthModal from "@/components/AuthModal";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Package,
  CreditCard,
  Lock,
  Truck,
  Tag,
  X,
} from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import CartSidebar from "@/components/CartSidebar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "../../cable/hooks/useCart";
import { useSession, getAuthToken } from "@/lib/supabase";
import { orders } from "@/lib/api";

type ShippingAddress = {
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  phone: string;
};

const EMPTY_ADDRESS: ShippingAddress = {
  line1: "",
  line2: "",
  city: "",
  state: "",
  pincode: "",
  country: "India",
  phone: "",
};

// Lazily inject the Razorpay checkout script — we only need it once
// per browser session. The widget is hosted by Razorpay, no API key
// needed for the script itself (the key is passed to `open()` later).
function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if ((window as unknown as { Razorpay?: unknown }).Razorpay) {
      resolve(true);
      return;
    }
    const existing = document.querySelector(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    );
    if (existing) {
      existing.addEventListener("load", () => resolve(true));
      existing.addEventListener("error", () => resolve(false));
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

// Pincode lookup is intentionally simple — validate it's 6 digits and
// contains only digits. A real KYC service (e.g. SmartShip, IndiaPost
// Pincodes API) would be a paid add-on.
const PINCODE_RE = /^\d{6}$/;
const PHONE_RE = /^\d{10}$/;

export default function Checkout() {
  const [, navigate] = useLocation();
  const { user } = useSession();
  const { items, cartTotal, clearCart, setIsCartOpen } = useCart();

  const [address, setAddress] = useState<ShippingAddress>(EMPTY_ADDRESS);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successOrderId, setSuccessOrderId] = useState<string | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof ShippingAddress, string>>>({});

  // When the auth modal closes successfully (user signed in), the
  // session updates and the page re-renders — no manual navigation
  // needed, the inline sign-in screen disappears automatically.

  // NOTE: We do NOT auto-redirect when the user isn't signed in or the
  // cart is empty. Auto-redirect on first mount causes the user to see
  // the page "blink" through home — they hit /checkout and bounce back
  // to / without ever seeing what's happening. Instead, we render inline
  // sign-in / empty-cart states below (after the form is defined).

  const validate = (): boolean => {
    const errs: Partial<Record<keyof ShippingAddress, string>> = {};
    if (!address.line1.trim()) errs.line1 = "Street address is required";
    if (!address.city.trim()) errs.city = "City is required";
    if (!address.state.trim()) errs.state = "State is required";
    if (!PINCODE_RE.test(address.pincode))
      errs.pincode = "Pincode must be 6 digits";
    if (!PHONE_RE.test(address.phone))
      errs.phone = "Phone must be 10 digits";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const freeShippingThreshold = 999;
  const shippingCalc =
    cartTotal === 0 ? 0 : cartTotal >= freeShippingThreshold ? 0 : 49;
  const total = cartTotal + shippingCalc;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!validate()) return;
    if (items.length === 0) return;

    setSubmitting(true);
    try {
      const token = await getAuthToken();
      if (!token) {
        setError("Please sign in to place an order.");
        setSubmitting(false);
        return;
      }

      // Step 1: create the order on the server, get a Razorpay order ID.
      const created = await orders.create(
        {
          items: items.map((i) => ({
            productId: i.id,
            quantity: i.quantity,
          })),
          shippingAddress: {
            line1: address.line1.trim(),
            line2: address.line2.trim() || undefined,
            city: address.city.trim(),
            state: address.state.trim(),
            pincode: address.pincode.trim(),
            country: address.country.trim() || "India",
            phone: address.phone.trim(),
          },
        },
        token
      );

      const orderId = created.order.id;
      const amountPaise = created.razorpay.amountPaise;
      const razorpayOrderId = created.razorpay.orderId;
      const keyId = created.razorpay.keyId;
      const isStub = created.razorpay.stub === true;

      // MOCK MODE: backend returned a stub order, no real Razorpay
      // needed. Verify the (fake) signature directly to complete the
      // order and clear the cart. This is what makes the flow work
      // end-to-end without real Razorpay credentials in dev.
      if (isStub) {
        await orders.verify(
          {
            razorpayOrderId,
            razorpayPaymentId: `mock_pay_${orderId}`,
            razorpaySignature: `mock_sig_${razorpayOrderId}`,
          },
          token
        );
        clearCart();
        setIsCartOpen(false);
        setSuccessOrderId(orderId);
        toast.success("Order placed (dev mode)");
        return;
      }

      // PRODUCTION: load Razorpay widget, open it, then verify on success.
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        setError(
          "Could not load Razorpay checkout. Please disable any ad blockers and try again."
        );
        return;
      }

      const RazorpayCtor = (
        window as unknown as {
          Razorpay?: new (opts: Record<string, unknown>) => {
            open: () => void;
            on: (event: string, cb: (resp: Record<string, string>) => void) => void;
          };
        }
      ).Razorpay;
      if (!RazorpayCtor) {
        setError("Razorpay is not available on this page.");
        return;
      }

      const rzp = new RazorpayCtor({
        key: keyId,
        amount: amountPaise,
        currency: "INR",
        name: "Massive Inventions",
        description: `Order ${orderId.slice(0, 8)}`,
        order_id: razorpayOrderId,
        handler: async (resp: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          try {
            await orders.verify(
              {
                razorpayOrderId: resp.razorpay_order_id,
                razorpayPaymentId: resp.razorpay_payment_id,
                razorpaySignature: resp.razorpay_signature,
              },
              token
            );
            clearCart();
            setIsCartOpen(false);
            setSuccessOrderId(orderId);
            toast.success("Payment successful!");
          } catch (e) {
            setError(
              e instanceof Error
                ? `Payment captured but verification failed: ${e.message}`
                : "Payment verification failed"
            );
          }
        },
        prefill: {
          email: user?.email,
          contact: address.phone,
        },
        theme: {
          color: "#C07838", // brand accent
        },
        modal: {
          ondismiss: () => {
            setSubmitting(false);
          },
        },
      });

      rzp.on("payment.failed", (resp: { error?: { description?: string } }) => {
        setError(
          resp?.error?.description ?? "Payment failed. Please try again or use a different method."
        );
        setSubmitting(false);
      });

      rzp.open();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not place order");
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex flex-col">
        <Navbar />
        <main className="flex-grow flex items-center justify-center px-6 lg:px-12 py-12 lg:py-20">
          <div className="w-full max-w-md bg-white rounded-3xl border border-[var(--foreground)]/8 p-6 sm:p-8 text-center shadow-sm">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-[var(--accent-brown)]/10 text-[var(--accent-brown)] flex items-center justify-center mb-4">
              <Lock className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-black text-[var(--foreground)] mb-2">
              Sign in to checkout
            </h1>
            <p className="text-[var(--foreground)]/60 mb-6 text-sm">
              You'll need an account to place an order. We'll email you a one-time code — no password to remember.
            </p>
            <button
              type="button"
              onClick={() => setAuthOpen(true)}
              className="w-full h-12 rounded-xl bg-[var(--foreground)] hover:bg-[var(--accent-brown)] text-white font-bold transition-colors"
            >
              Sign in & continue
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsCartOpen(false);
                setTimeout(() => navigate("/"), 0);
              }}
              className="w-full h-10 mt-2 text-sm font-semibold text-[var(--foreground)]/60 hover:text-[var(--foreground)] transition-colors"
            >
              Continue shopping
            </button>
          </div>
        </main>
        <Footer />
        <CartSidebar />
      </div>
    );
  }

  // Empty-cart state — also inline, no redirect.
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex flex-col">
        <Navbar />
        <main className="flex-grow flex items-center justify-center px-6 lg:px-12 py-12 lg:py-20">
          <div className="w-full max-w-md bg-white rounded-3xl border border-[var(--foreground)]/8 p-6 sm:p-8 text-center shadow-sm">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-[var(--accent-brown)]/10 text-[var(--accent-brown)] flex items-center justify-center mb-4">
              <Package className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-black text-[var(--foreground)] mb-2">
              Your cart is empty
            </h1>
            <p className="text-[var(--foreground)]/60 mb-6 text-sm">
              Add a product to your cart, then come back here to checkout.
            </p>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsCartOpen(false);
                // Use setTimeout to ensure the cart state update
                // flushes before navigation — prevents a re-render race
                // that can cause the click handler to be re-invoked
                // mid-navigation.
                setTimeout(() => navigate("/"), 0);
              }}
              className="w-full h-12 rounded-xl bg-[var(--foreground)] hover:bg-[var(--accent-brown)] text-white font-bold transition-colors"
            >
              Browse products
            </button>
          </div>
        </main>
        <Footer />
        <CartSidebar />
      </div>
    );
  }

  if (successOrderId) {
    return (
      <SuccessPage
        orderId={successOrderId}
        email={user.email}
        onContinueShopping={() => {
          clearCart();
          setSuccessOrderId(null);
          navigate("/");
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <div className="container mx-auto px-6 lg:px-12 py-8 lg:py-12">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-[var(--foreground)]/50 hover:text-[var(--foreground)] text-sm font-medium mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* LEFT: shipping form */}
            <div className="lg:col-span-2">
              <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2">
                Checkout
              </h1>
              <p className="text-[var(--foreground)]/60 mb-8">
                {items.length} {items.length === 1 ? "item" : "items"} in your cart
              </p>

              <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                <Section
                  icon={<Truck className="w-5 h-5" />}
                  title="Shipping address"
                >
                  <Field
                    label="Street address"
                    required
                    error={fieldErrors.line1}
                    value={address.line1}
                    onChange={(v) => updateField(setAddress, "line1", v)}
                  />
                  <Field
                    label="Apartment / Floor (optional)"
                    value={address.line2}
                    onChange={(v) => updateField(setAddress, "line2", v)}
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field
                      label="City"
                      required
                      error={fieldErrors.city}
                      value={address.city}
                      onChange={(v) => updateField(setAddress, "city", v)}
                    />
                    <Field
                      label="State"
                      required
                      error={fieldErrors.state}
                      value={address.state}
                      onChange={(v) => updateField(setAddress, "state", v)}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field
                      label="Pincode"
                      required
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="6 digits"
                      error={fieldErrors.pincode}
                      value={address.pincode}
                      onChange={(v) =>
                        updateField(setAddress, "pincode", v.replace(/\D/g, ""))
                      }
                    />
                    <Field
                      label="Phone"
                      required
                      inputMode="numeric"
                      maxLength={10}
                      placeholder="10 digits"
                      error={fieldErrors.phone}
                      value={address.phone}
                      onChange={(v) =>
                        updateField(setAddress, "phone", v.replace(/\D/g, ""))
                      }
                    />
                  </div>
                </Section>

                <Section
                  icon={<CreditCard className="w-5 h-5" />}
                  title="Payment"
                >
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-[var(--soft-gray)] border border-transparent">
                    <Lock className="w-4 h-4 text-[var(--foreground)]/60" />
                    <p className="text-sm text-[var(--foreground)]/70">
                      Pay securely with Razorpay. Cards, UPI, Net Banking, Wallets — all supported.
                    </p>
                  </div>
                </Section>

                {error && (
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={submitting || items.length === 0}
                  className="w-full h-14 rounded-2xl bg-[var(--foreground)] hover:bg-[var(--accent-brown)] text-white font-bold text-base shadow-lg transition-colors disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing…
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 mr-2" />
                      Pay ₹{total.toLocaleString("en-IN")}
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-[var(--foreground)]/40">
                  By placing this order you agree to our Terms of Service and Replacement Policy.
                </p>
              </form>
            </div>

            {/* RIGHT: order summary */}
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <OrderSummary
                items={items}
                cartTotal={cartTotal}
                shipping={shippingCalc}
              />
            </aside>
          </div>
        </div>
      </main>
      <Footer />
      <CartSidebar />

      {/* Local AuthModal instance so the "Sign in & continue" button can
          open it inline. The Navbar's own AuthModal stays closed; this
          one only opens when we set authOpen=true. */}
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} initialMode="signin" />
    </div>
  );
}

function updateField(
  setAddress: React.Dispatch<React.SetStateAction<ShippingAddress>>,
  key: keyof ShippingAddress,
  value: string
) {
  setAddress((prev) => ({ ...prev, [key]: value }));
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white rounded-3xl border border-[var(--foreground)]/8 p-5 sm:p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-2xl bg-[var(--accent-brown)]/10 text-[var(--accent-brown)] flex items-center justify-center">
          {icon}
        </div>
        <h2 className="font-bold text-[var(--foreground)]">{title}</h2>
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
  error,
  inputMode,
  maxLength,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  error?: string;
  inputMode?: "numeric" | "text" | "tel" | "email";
  maxLength?: number;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-[var(--foreground)]/60 mb-1.5 uppercase tracking-wider">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        inputMode={inputMode}
        maxLength={maxLength}
        placeholder={placeholder}
        className={`h-11 text-sm ${error ? "border-red-300 focus:border-red-500" : ""}`}
      />
      {error && (
        <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
    </div>
  );
}

function OrderSummary({
  items,
  cartTotal,
  shipping,
}: {
  items: Array<{ id: string; name: string; price: number; quantity: number; image?: string }>;
  cartTotal: number;
  shipping: number;
}) {
  const total = cartTotal + shipping;
  return (
    <div className="bg-white rounded-3xl border border-[var(--foreground)]/8 p-5 sm:p-6">
      <h3 className="font-bold text-[var(--foreground)] mb-4">Order summary</h3>

      <div role="list" className="space-y-3 mb-4">
        <AnimatePresence initial={false}>
          {items.map((item) => (
            <motion.div
              key={item.id}
              role="listitem"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="flex gap-3"
            >
              <div className="w-14 h-14 rounded-xl bg-[var(--retro-cream)] border border-[var(--foreground)]/8 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    loading="lazy"
                    decoding="async"
                    width={56}
                    height={56}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Package className="w-5 h-5 text-[var(--foreground)]/40" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[var(--foreground)] truncate">
                  {item.name}
                </p>
                <p className="text-xs text-[var(--foreground)]/60">
                  Qty {item.quantity} · ₹{item.price.toLocaleString("en-IN")}
                </p>
              </div>
              <p className="text-sm font-bold text-[var(--foreground)] whitespace-nowrap">
                ₹{(item.price * item.quantity).toLocaleString("en-IN")}
              </p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="border-t border-[var(--foreground)]/8 pt-4 space-y-2 text-sm">
        <Row label="Subtotal" value={`₹${cartTotal.toLocaleString("en-IN")}`} />
        <Row
          label="Shipping"
          value={shipping === 0 ? "Free" : `₹${shipping.toLocaleString("en-IN")}`}
        />
        {shipping === 0 && cartTotal > 0 && (
          <p className="text-xs text-green-700 flex items-center gap-1">
            <Tag className="w-3 h-3" />
            Free shipping unlocked (orders ₹999+)
          </p>
        )}
        <div className="flex justify-between items-baseline pt-3 border-t border-[var(--foreground)]/8 mt-3">
          <span className="font-black text-base">Total</span>
          <span className="font-black text-lg text-[var(--accent-brown)]">
            ₹{total.toLocaleString("en-IN")}
          </span>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-[var(--foreground)]/70">
      <span>{label}</span>
      <span className="font-semibold text-[var(--foreground)]">{value}</span>
    </div>
  );
}

function SuccessPage({
  orderId,
  email,
  onContinueShopping,
}: {
  orderId: string;
  email: string;
  onContinueShopping: () => void;
}) {
  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      <Navbar />
      <main className="flex-grow flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-md w-full bg-white rounded-3xl border border-[var(--foreground)]/8 p-8 sm:p-10 text-center shadow-sm"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              duration: 0.5,
              ease: [0.16, 1, 0.3, 1],
              delay: 0.1,
            }}
            className="w-20 h-20 mx-auto rounded-full bg-green-100 flex items-center justify-center mb-6"
          >
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </motion.div>

          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-[var(--foreground)] mb-2">
            Order placed!
          </h1>
          <p className="text-[var(--foreground)]/60 mb-6">
            Thank you. A confirmation email is on its way to{" "}
            <span className="font-semibold text-[var(--foreground)]">{email}</span>.
          </p>

          <div className="bg-[var(--soft-gray)] rounded-2xl p-4 mb-6">
            <p className="text-xs text-[var(--foreground)]/60 mb-1">Order ID</p>
            <p className="font-mono text-sm font-bold text-[var(--foreground)] break-all">
              {orderId}
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Link
              href={`/track-order?id=${orderId}`}
              className="w-full h-12 rounded-2xl bg-[var(--foreground)] hover:bg-[var(--accent-brown)] text-white font-bold inline-flex items-center justify-center transition-colors"
            >
              Track your order
            </Link>
            <button
              type="button"
              onClick={onContinueShopping}
              className="w-full h-12 rounded-2xl border border-[var(--foreground)]/15 hover:bg-[var(--soft-gray)] text-[var(--foreground)] font-semibold inline-flex items-center justify-center transition-colors"
            >
              Continue shopping
            </button>
          </div>

          <p className="text-xs text-[var(--foreground)]/40 mt-6">
            Need help? Reach us at{" "}
            <a
              href="https://wa.me/919413582708"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--accent-brown)] hover:underline font-semibold"
            >
              WhatsApp
            </a>
            .
          </p>
        </motion.div>
      </main>
      <Footer />
      <CartSidebar />
    </div>
  );
}