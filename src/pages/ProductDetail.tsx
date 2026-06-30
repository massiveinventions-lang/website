import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "../../cable/hooks/useCart";
import { imgSrc, imgPosition } from "@/lib/api";
import { useProduct } from "@/lib/queries";
import Navbar from "@/components/Navbar";
import CartSidebar from "@/components/CartSidebar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShoppingBag, Zap, Star, Check, Loader2, AlertCircle } from "lucide-react";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => {
        const fill = Math.min(1, Math.max(0, rating - s + 1));
        return (
          <svg key={s} className="w-4 h-4" viewBox="0 0 20 20">
            <defs>
              <linearGradient id={`sg-${s}-${rating}`} x1="0" x2="1" y1="0" y2="0">
                <stop offset={`${fill * 100}%`} stopColor="#C07838" />
                <stop offset={`${fill * 100}%`} stopColor="#D4C4A8" />
              </linearGradient>
            </defs>
            <path
              fill={`url(#sg-${s}-${rating})`}
              d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
            />
          </svg>
        );
      })}
    </div>
  );
}

function SpecsTab({ specs }: { specs: { label: string; value: string }[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {specs.map((spec) => (
        <div key={spec.label} className="flex justify-between items-center py-3 px-4 rounded-xl bg-[var(--soft-gray)]">
          <span className="text-sm text-[var(--foreground)]/60 font-medium">{spec.label}</span>
          <span className="text-sm font-bold text-[var(--foreground)] text-right ml-4">{spec.value}</span>
        </div>
      ))}
    </div>
  );
}

function FeaturesTab({ features }: { features: string[] }) {
  return (
    <ul className="space-y-3">
      {features.map((f) => (
        <li key={f} className="flex items-start gap-3">
          <div className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-[var(--accent-brown)]/15 flex items-center justify-center">
            <Check className="w-3 h-3 text-[var(--accent-brown)]" />
          </div>
          <span className="text-[var(--foreground)]/80">{f}</span>
        </li>
      ))}
    </ul>
  );
}

function ReviewsTab({ rating, reviews }: { rating: number; reviews: number }) {
  const sampleReviews = [
    { author: "Arjun S.", stars: 5, date: "March 2025", text: "Absolutely stunning build quality. The sound is warm and rich — exactly what I was looking for. Worth every rupee." },
    { author: "Priya K.", stars: 5, date: "January 2025", text: "Exceeded my expectations. Fast delivery and the product looks even better in person. Highly recommend." },
    { author: "Rahul M.", stars: 4, date: "December 2024", text: "Really solid product. Build quality is top-notch. Knocked one star only because delivery took a bit longer than expected." },
    { author: "Sneha T.", stars: 5, date: "November 2024", text: "Gifted this and the recipient absolutely loves it. The packaging itself feels premium. 10/10." },
  ];

  const ratingBars = [
    { stars: 5, pct: 78 },
    { stars: 4, pct: 14 },
    { stars: 3, pct: 5 },
    { stars: 2, pct: 2 },
    { stars: 1, pct: 1 },
  ];

  return (
    <div className="space-y-8">
      <div className="flex gap-10 items-center">
        <div className="text-center">
          <div className="text-6xl font-black text-[var(--foreground)]">{rating}</div>
          <StarRating rating={rating} />
          <div className="text-sm text-[var(--foreground)]/50 mt-1">{reviews.toLocaleString("en-IN")} reviews</div>
        </div>
        <div className="flex-1 space-y-2">
          {ratingBars.map((bar) => (
            <div key={bar.stars} className="flex items-center gap-3">
              <span className="text-xs text-[var(--foreground)]/60 w-4">{bar.stars}</span>
              <div className="flex-1 h-2 bg-[var(--soft-gray)] rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${bar.pct}%` }}
                  transition={{ duration: 0.8, delay: bar.stars * 0.05 }}
                  className="h-full bg-[var(--accent-brown)] rounded-full"
                />
              </div>
              <span className="text-xs text-[var(--foreground)]/40 w-8">{bar.pct}%</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {sampleReviews.map((review) => (
          <div key={review.author} className="p-5 rounded-2xl border border-[var(--foreground)]/8 bg-white">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[var(--accent-brown)]/20 flex items-center justify-center text-sm font-bold text-[var(--accent-brown)]">
                  {review.author[0]}
                </div>
                <span className="font-semibold text-[var(--foreground)]">{review.author}</span>
              </div>
              <div className="flex items-center gap-2">
                <StarRating rating={review.stars} />
                <span className="text-xs text-[var(--foreground)]/40">{review.date}</span>
              </div>
            </div>
            <p className="text-[var(--foreground)]/70 text-sm leading-relaxed">{review.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { addToCart, setIsCartOpen } = useCart();

  const { data, isLoading, error } = useProduct(id);
  const product = data?.product;

  const [selectedImage, setSelectedImage] = useState(0);
  const [activeTab, setActiveTab] = useState<"specs" | "features" | "reviews">("features");
  const [buyNowFlash, setBuyNowFlash] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="flex items-center gap-3 text-[var(--foreground)]/60">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading product…</span>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="text-center max-w-md p-6">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <h1 className="text-2xl font-bold text-[var(--foreground)] mb-4">Product not found</h1>
          <p className="text-[var(--foreground)]/60 mb-6">
            {error
              ? "Could not load this product. Make sure the backend is running on port 4000."
              : "This product does not exist."}
          </p>
          <Button onClick={() => navigate("/")} variant="outline">Back to Home</Button>
        </div>
      </div>
    );
  }

  const handleAddToCart = () =>
    addToCart({
      ...product,
      // Normalize image to a plain URL — backend returns either a URL or
      // a JSON-stringified `{src, position}` object; the cart sidebar
      // uses this directly as <img src>.
      image: imgSrc(product.image) || undefined,
    });

  const handleBuyNow = () => {
    addToCart({
      ...product,
      image: imgSrc(product.image) || undefined,
    });
    // Skip the cart sidebar flash and go straight to checkout.
    navigate("/checkout");
  };

  const tabs = [
    { id: "features" as const, label: "Highlights" },
    { id: "specs" as const, label: "Specifications" },
    { id: "reviews" as const, label: `Reviews (${product.reviews.toLocaleString("en-IN")})` },
  ];

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      <Navbar />

      <main className="flex-grow">
        <div className="container mx-auto px-6 lg:px-12 py-8">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-[var(--foreground)]/50 hover:text-[var(--foreground)] transition-colors mb-8 text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Products
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 xl:gap-20">
            {/* Product Image Gallery */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="sticky top-24">
                {/* Main image — true 1:1 frame */}
                <div
                  className="relative aspect-square w-full rounded-3xl overflow-hidden bg-[var(--retro-cream)] border border-[var(--foreground)]/8"
                >
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={selectedImage}
                      initial={{ opacity: 0, scale: 1.04 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.97 }}
                      transition={{ duration: 0.35 }}
                      src={imgSrc((product.images ?? [product.image])[selectedImage])}
                      alt={product.name}
                      className="absolute inset-0 w-full h-full object-cover"
                      style={{ objectPosition: imgPosition((product.images ?? [product.image])[selectedImage]) }}
                    />
                  </AnimatePresence>
                </div>

                {/* Thumbnails — only shown when multiple images exist */}
                {product.images && product.images.length > 1 && (
                  <div className="mt-4 flex gap-3 justify-center">
                    {product.images.map((img, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedImage(i)}
                        className="relative rounded-2xl overflow-hidden flex-shrink-0 transition-all bg-[var(--retro-cream)] border border-[var(--foreground)]/8 aspect-square"
                        style={{
                          width: 72,
                          boxShadow: selectedImage === i
                            ? "0 0 0 2.5px var(--accent-brown)"
                            : "0 0 0 1.5px rgba(0,0,0,0)",
                          opacity: selectedImage === i ? 1 : 0.65,
                        }}
                      >
                        <img src={imgSrc(img)} alt={`View ${i + 1}`} loading="lazy" decoding="async" className="w-full h-full object-cover" style={{ objectPosition: imgPosition(img) }} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>

            {/* Product info */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="flex flex-col"
            >
              <div className="flex items-start gap-3 mb-3">
                {product.badge && (
                  <span className="bg-[var(--accent-brown)] text-white text-xs font-bold px-3 py-1 rounded-full mt-1">
                    {product.badge}
                  </span>
                )}
                <span className="text-xs font-semibold text-[var(--foreground)]/40 uppercase tracking-widest mt-1.5">
                  {product.category}
                </span>
              </div>

              <h1 className="text-4xl xl:text-5xl font-black tracking-tight text-[var(--foreground)] mb-3">
                {product.name}
              </h1>

              <div className="flex items-center gap-3 mb-4">
                <StarRating rating={product.rating} />
                <span className="text-sm text-[var(--foreground)]/55">
                  {product.rating} · {product.reviews.toLocaleString("en-IN")} reviews
                </span>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-3 mb-6">
                <span className="text-4xl font-black text-[var(--accent-brown)]">
                  ₹{product.price.toLocaleString("en-IN")}
                </span>
                {product.originalPrice && (
                  <span className="text-lg text-[var(--foreground)]/40 line-through">
                    ₹{product.originalPrice.toLocaleString("en-IN")}
                  </span>
                )}
              </div>

              <p className="text-[var(--foreground)]/65 leading-relaxed mb-8">
                {product.longDescription}
              </p>

              {/* CTA Buttons */}
              <div className="space-y-3">
                {product.inStock ? (
                  <>
                    <motion.div
                      animate={buyNowFlash ? { scale: [1, 0.97, 1] } : {}}
                      transition={{ duration: 0.3 }}
                    >
                      <Button
                        className="w-full h-14 rounded-2xl bg-[var(--foreground)] hover:bg-[var(--accent-brown)] text-white font-bold text-base shadow-lg transition-all"
                        onClick={handleBuyNow}
                      >
                        <Zap className="w-4 h-4 mr-2" />
                        Buy Now — ₹{product.price.toLocaleString("en-IN")}
                      </Button>
                    </motion.div>
                    <Button
                      variant="outline"
                      className="w-full h-12 rounded-2xl border-2 border-[var(--foreground)]/20 hover:border-[var(--accent-brown)] hover:text-[var(--accent-brown)] font-semibold text-[var(--foreground)] transition-all"
                      onClick={handleAddToCart}
                    >
                      <ShoppingBag className="w-4 h-4 mr-2" />
                      Add to Cart
                    </Button>
                  </>
                ) : (
                  <div className="space-y-3">
                    <Button
                      className="w-full h-14 rounded-2xl bg-[var(--foreground)] hover:bg-[var(--accent-brown)] text-white font-bold text-base"
                      onClick={handleAddToCart}
                    >
                      Join Waitlist
                    </Button>
                    <p className="text-center text-xs text-[var(--foreground)]/40">
                      This item is sold out. Join the waitlist for priority access.
                    </p>
                  </div>
                )}
              </div>

              {/* Trust badges */}
              <div className="mt-6 flex items-center justify-center gap-6 text-xs text-[var(--foreground)]/40 border-t border-[var(--foreground)]/8 pt-5 flex-wrap">
                <span className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-green-500" />
                  Free shipping on all orders
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-green-500" />
                  7-day easy returns
                </span>
                <span className="flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 text-[var(--accent-brown)]" />
                  1-year warranty
                </span>
              </div>
            </motion.div>
          </div>

          {/* Tabs section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-20"
          >
            <div className="flex gap-1 p-1.5 bg-[var(--soft-gray)] rounded-full w-fit mb-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all ${
                    activeTab === tab.id
                      ? "bg-white text-[var(--foreground)] shadow-sm"
                      : "text-[var(--foreground)]/50 hover:text-[var(--foreground)]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
              >
                {activeTab === "specs" && <SpecsTab specs={product.specs} />}
                {activeTab === "features" && <FeaturesTab features={product.features} />}
                {activeTab === "reviews" && <ReviewsTab rating={product.rating} reviews={product.reviews} />}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
      </main>

      <Footer />
      <CartSidebar />
    </div>
  );
}
