import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Package,
  Search,
  Truck,
  CheckCircle2,
  MapPin,
  Clock,
  Box,
  AlertCircle,
  Loader2,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import CartSidebar from "@/components/CartSidebar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAuthToken } from "@/lib/supabase";
import { ApiError, orders as ordersApi } from "@/lib/api";
import { useCart } from "@/lib/cart";

type Stage = "pending" | "paid" | "shipped" | "out_for_delivery" | "delivered";

const STAGES: { id: Stage; label: string; icon: typeof Box; desc: string }[] = [
  { id: "pending", label: "Order Placed", icon: Box, desc: "We've received your order." },
  { id: "paid", label: "Payment Confirmed", icon: CheckCircle2, desc: "Payment verified successfully." },
  { id: "shipped", label: "Shipped", icon: Package, desc: "Handed to our shipping partner." },
  { id: "out_for_delivery", label: "Out for Delivery", icon: Truck, desc: "On the way to your address." },
  { id: "delivered", label: "Delivered", icon: MapPin, desc: "Package delivered. Enjoy!" },
];

const STAGE_INDEX: Record<Stage, number> = {
  pending: 0,
  paid: 1,
  shipped: 2,
  out_for_delivery: 3,
  delivered: 4,
  cancelled: -1,
  refunded: -1,
};

interface FoundOrder {
  id: string;
  status: string;
  total: number;
  customerEmail?: string | null;
  shippingInfo?: { awb?: string; courier?: string; trackingUrl?: string };
  shippingAddress?: { line1?: string; city?: string; state?: string; pincode?: string };
  createdAt: string;
  items: { name: string; quantity: number; price: number }[];
}

export default function TrackOrder() {
  const [, navigate] = useLocation();
  const { clearCart } = useCart();
  const [orderId, setOrderId] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<FoundOrder | null>(null);

  // Auto-load order if ID is in the URL, and clear cart if requested
  useEffect(() => {
    const qs = new URLSearchParams(window.location.search);
    const idFromUrl = qs.get("id");
    const shouldClear = qs.get("clear_cart");

    if (shouldClear === "1") {
      clearCart();
      // Clean up URL so refresh doesn't trigger it again
      const newUrl = window.location.pathname + (idFromUrl ? `?id=${idFromUrl}` : "");
      window.history.replaceState({}, "", newUrl);
    }

    if (idFromUrl && !orderId) {
      setOrderId(idFromUrl);
      // Automatically trigger the lookup
      setLoading(true);
      const fetchOrder = async () => {
        try {
          const token = await getAuthToken();
          // if there's no token, we just fail silently and let them manually enter email
          if (token) {
            const res = await ordersApi.get(idFromUrl, token);
            setOrder(res.order as unknown as FoundOrder);
          }
        } catch (err) {
          // Silent catch on auto-load
        } finally {
          setLoading(false);
        }
      };
      fetchOrder();
    }
  }, [clearCart]);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setOrder(null);
    const id = orderId.trim();
    if (!id) {
      setError("Please enter an order ID.");
      return;
    }
    setLoading(true);
    try {
      // In dev mode the token is the email — prefer it for auth.
      const token = (await getAuthToken()) ?? (email || undefined);
      if (!token) {
        setError("Please enter the email used for the order, or sign in.");
        setLoading(false);
        return;
      }
      const res = await ordersApi.get(id, token);
      setOrder(res.order as unknown as FoundOrder);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(
          err.status === 404
            ? "We couldn't find an order with that ID. Double-check and try again."
            : err.status === 401
            ? "Please enter the email used for the order, or sign in."
            : "Something went wrong. Please try again."
        );
      } else {
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    } finally {
      setLoading(false);
    }
  };

  const stageIdx = order ? STAGE_INDEX[order.status as Stage] ?? 0 : -1;

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
            className="max-w-3xl mx-auto"
          >
            <span className="text-[var(--accent-brown)] font-bold tracking-wider uppercase text-sm mb-4 block">
              Order Tracking
            </span>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-[var(--foreground)] mb-4">
              Where's My Order?
            </h1>
            <p className="text-[var(--foreground)]/70 text-lg max-w-xl">
              Enter your order ID to see real-time status updates, tracking info, and delivery ETA.
            </p>
          </motion.div>

          {/* Search form */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="mt-10 max-w-3xl mx-auto"
          >
            <form
              onSubmit={handleTrack}
              className="bg-white rounded-3xl border border-[var(--foreground)]/8 p-6 sm:p-8"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--foreground)]/60 mb-1.5 uppercase tracking-wider">
                    Order ID
                  </label>
                  <Input
                    placeholder="e.g. 8a3f2c91-…"
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                    className="h-11 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--foreground)]/60 mb-1.5 uppercase tracking-wider">
                    Email (optional)
                  </label>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 text-sm"
                  />
                </div>
              </div>

              {error && (
                <div className="mt-4 flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="mt-5 w-full sm:w-auto h-11 px-6 rounded-xl bg-[var(--foreground)] hover:bg-[var(--accent-brown)] text-white font-bold transition-colors"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Looking up…
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Track Order
                  </>
                )}
              </Button>
            </form>
          </motion.div>

          {/* Order details */}
          {order && (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="mt-10 max-w-3xl mx-auto space-y-6"
            >
              <div className="bg-white rounded-3xl border border-[var(--foreground)]/8 p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                  <div>
                    <p className="text-xs font-semibold text-[var(--foreground)]/50 uppercase tracking-wider">
                      Order
                    </p>
                    <p className="text-base font-mono text-[var(--foreground)] break-all">
                      {order.id}
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-xs font-semibold text-[var(--foreground)]/50 uppercase tracking-wider">
                      Total
                    </p>
                    <p className="text-2xl font-black text-[var(--accent-brown)]">
                      ₹{order.total.toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>

                {/* Status timeline */}
                {order.status !== "cancelled" && order.status !== "refunded" ? (
                  <div className="space-y-1">
                    {STAGES.map((stage, i) => {
                      const Icon = stage.icon;
                      const isDone = i <= stageIdx;
                      const isCurrent = i === stageIdx;
                      return (
                        <div key={stage.id} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                                isDone
                                  ? "bg-[var(--accent-brown)] text-white"
                                  : "bg-[var(--soft-gray)] text-[var(--foreground)]/30"
                              } ${isCurrent ? "ring-4 ring-[var(--accent-brown)]/20" : ""}`}
                            >
                              <Icon className="w-5 h-5" />
                            </div>
                            {i < STAGES.length - 1 && (
                              <div
                                className={`w-0.5 flex-1 my-1 ${
                                  i < stageIdx ? "bg-[var(--accent-brown)]" : "bg-[var(--soft-gray)]"
                                }`}
                                style={{ minHeight: 24 }}
                              />
                            )}
                          </div>
                          <div className="pb-6">
                            <p
                              className={`font-bold ${
                                isDone ? "text-[var(--foreground)]" : "text-[var(--foreground)]/40"
                              }`}
                            >
                              {stage.label}
                              {isCurrent && (
                                <span className="ml-2 inline-flex items-center text-xs font-semibold text-[var(--accent-brown)] bg-[var(--accent-brown)]/10 px-2 py-0.5 rounded-full">
                                  Current
                                </span>
                              )}
                            </p>
                            <p
                              className={`text-sm mt-0.5 ${
                                isDone ? "text-[var(--foreground)]/60" : "text-[var(--foreground)]/30"
                              }`}
                            >
                              {stage.desc}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <div>
                      <p className="font-bold">Order {order.status}</p>
                      <p className="text-sm">Please contact support for help with this order.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Shipment details */}
              {order.shippingInfo?.awb && (
                <div className="bg-white rounded-3xl border border-[var(--foreground)]/8 p-6 sm:p-8">
                  <h2 className="text-lg font-bold text-[var(--foreground)] mb-4">Shipment Details</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-xs font-semibold text-[var(--foreground)]/50 uppercase tracking-wider mb-1">
                        AWB Number
                      </p>
                      <p className="font-mono text-[var(--foreground)]">{order.shippingInfo.awb}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[var(--foreground)]/50 uppercase tracking-wider mb-1">
                        Courier
                      </p>
                      <p className="text-[var(--foreground)]">{order.shippingInfo.courier ?? "—"}</p>
                    </div>
                    {order.shippingInfo.trackingUrl && (
                      <div className="sm:col-span-2">
                        <a
                          href={order.shippingInfo.trackingUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 text-[var(--accent-brown)] font-semibold hover:underline"
                        >
                          <Truck className="w-4 h-4" />
                          Track on courier website →
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Items */}
              <div className="bg-white rounded-3xl border border-[var(--foreground)]/8 p-6 sm:p-8">
                <h2 className="text-lg font-bold text-[var(--foreground)] mb-4">Items in this order</h2>
                <ul className="divide-y divide-[var(--foreground)]/8">
                  {order.items.map((item, i) => (
                    <li key={i} className="py-3 flex justify-between items-start gap-4">
                      <div>
                        <p className="font-semibold text-[var(--foreground)]">{item.name}</p>
                        <p className="text-sm text-[var(--foreground)]/60">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-semibold text-[var(--foreground)]">
                        ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Address */}
              {order.shippingAddress && (
                <div className="bg-white rounded-3xl border border-[var(--foreground)]/8 p-6 sm:p-8">
                  <h2 className="text-lg font-bold text-[var(--foreground)] mb-3 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-[var(--accent-brown)]" />
                    Delivering to
                  </h2>
                  <p className="text-[var(--foreground)]/70 leading-relaxed text-sm">
                    {order.shippingAddress.line1}
                    {order.shippingAddress.city ? `, ${order.shippingAddress.city}` : ""}
                    {order.shippingAddress.state ? `, ${order.shippingAddress.state}` : ""}
                    {order.shippingAddress.pincode ? ` — ${order.shippingAddress.pincode}` : ""}
                  </p>
                </div>
              )}

              <p className="text-center text-sm text-[var(--foreground)]/50 pt-2">
                Need help?{" "}
                <Link href="/contact" className="text-[var(--accent-brown)] font-semibold hover:underline">
                  Contact support
                </Link>
                .
              </p>
            </motion.div>
          )}

          {/* Help footer */}
          {!order && (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="mt-10 max-w-3xl mx-auto bg-[var(--soft-gray)] rounded-3xl p-6 sm:p-8"
            >
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-[var(--accent-brown)] flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-[var(--foreground)] mb-1">Where's my Order ID?</h3>
                  <p className="text-sm text-[var(--foreground)]/70 leading-relaxed">
                    Your order ID was sent to your email right after checkout. It starts with a
                    UUID like <code className="font-mono text-[var(--accent-brown)]">a3f2c8e1-…</code>.
                    You can also find it in your account's order history.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </main>
      <Footer />
      <CartSidebar />
    </div>
  );
}
