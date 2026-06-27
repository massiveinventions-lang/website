import { motion, AnimatePresence } from "framer-motion";
import { X, Minus, Plus, ShoppingBag } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useCart } from "../../cable/hooks/useCart";

export default function CartSidebar() {
  const { isCartOpen, setIsCartOpen, items, updateQuantity, removeFromCart, cartTotal } = useCart();
  const [, navigate] = useLocation();

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCartOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          />

          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
          >
            <div className="flex items-center justify-between p-6 border-b border-[var(--soft-gray)]">
              <h2 className="text-2xl font-bold text-[var(--foreground)]">Your Cart</h2>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-2 hover:bg-[var(--soft-gray)] rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-[var(--foreground)]/50">
                  <ShoppingBag size={64} className="mb-4 opacity-50" />
                  <p className="text-xl font-semibold">Your cart is empty</p>
                  <p className="mt-2">Looks like you haven't added any inventions yet.</p>
                  <Button
                    className="mt-6 bg-[var(--foreground)] text-white hover:bg-[var(--accent-brown)] rounded-full"
                    onClick={() => setIsCartOpen(false)}
                  >
                    Continue Shopping
                  </Button>
                </div>
              ) : (
                items.map((item) => (
                  <motion.div
                    layout
                    key={item.id}
                    className="flex gap-4 items-center bg-[var(--soft-gray)] p-3 rounded-2xl"
                  >
                    <div className="w-20 h-20 rounded-xl bg-[var(--retro-cream)] overflow-hidden flex-shrink-0 relative">
                      <img
                        src={item.image}
                        alt={item.name}
                        loading="lazy"
                        decoding="async"
                        width={80}
                        height={80}
                        className="w-full h-full object-cover absolute inset-0"
                        onError={(e) => { e.currentTarget.style.display = "none"; }}
                      />
                    </div>

                    <div className="flex-1">
                      <h3 className="font-bold text-[var(--foreground)]">{item.name}</h3>
                      <p className="text-[var(--accent-brown)] font-semibold mt-1">₹{item.price.toLocaleString("en-IN")}</p>

                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center bg-white rounded-full px-2 py-1 shadow-sm">
                          <button
                            className="p-1 hover:text-[var(--accent-brown)]"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          >
                            <Minus size={14} />
                          </button>
                          <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                          <button
                            className="p-1 hover:text-[var(--accent-brown)]"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <button
                          className="text-xs text-[var(--foreground)]/50 hover:text-red-500 underline"
                          onClick={() => removeFromCart(item.id)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {items.length > 0 && (
              <div className="p-6 border-t border-[var(--soft-gray)] bg-white">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-[var(--foreground)]/70 text-lg">Total</span>
                  <span className="text-2xl font-black text-[var(--foreground)]">₹{cartTotal.toLocaleString("en-IN")}</span>
                </div>
                <Button
                  type="button"
                  onClick={() => {
                    setIsCartOpen(false);
                    navigate("/checkout");
                  }}
                  className="w-full h-14 text-lg bg-[var(--foreground)] hover:bg-[var(--accent-brown)] text-white rounded-full"
                >
                  Checkout Now
                </Button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
