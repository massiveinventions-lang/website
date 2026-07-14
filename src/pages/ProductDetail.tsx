import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "../../cable/hooks/useCart";
import { imgSrc, imgPosition } from "@/lib/api";
import { useProduct, useProductReviews, useCreateReview, useDeleteReview } from "@/lib/queries";
import { useSession } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import CartSidebar from "@/components/CartSidebar";
import Footer from "@/components/Footer";
import AuthModal from "@/components/AuthModal";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShoppingBag, Zap, Star, Check, Loader2, AlertCircle, Trash2 } from "lucide-react";

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

// Five fixed demo reviews so the tab is never empty â€” these are NOT
// persisted anywhere; they live on the page itself. The latest review
// from each product is shown above the demo set when a real review
// has been posted.
const DEMO_REVIEWS = [
  { author: "Arjun S.", stars: 5, date: "March 2025", text: "Absolutely stunning build quality. The sound is warm and rich â€” exactly what I was looking for. Worth every rupee." },
  { author: "Priya K.", stars: 5, date: "January 2025", text: "Exceeded my expectations. Fast delivery and the product looks even better in person. Highly recommend." },
  { author: "Rahul M.", stars: 4, date: "December 2024", text: "Really solid product. Build quality is top-notch. Knocked one star only because delivery took a bit longer than expected." },
  { author: "Sneha T.", stars: 5, date: "November 2024", text: "Gifted this and the recipient absolutely loves it. The packaging itself feels premium. 10/10." },
  { author: "Karthik R.", stars: 3, date: "October 2024", text: "Quality is great but it's a little heavier than I expected. Sound is still excellent for the price." },
];

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

function InteractiveStars({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className={`flex items-center gap-1 ${disabled ? "opacity-60 pointer-events-none" : ""}`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          aria-label={`Rate ${n} star${n === 1 ? "" : "s"}`}
          onClick={() => onChange(n)}
          className="p-1 -m-1 rounded transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[var(--accent-brown)]/30"
        >
          <Star
            size={26}
            fill={n <= value ? "#C07838" : "transparent"}
            className={n <= value ? "text-[var(--accent-brown)]" : "text-[var(--foreground)]/25"}
          />
        </button>
      ))}
    </div>
  );
}

function WriteReviewForm({
  productId,
  onAuthNeeded,
}: {
  productId: string;
  onAuthNeeded: () => void;
}) {
  const { user } = useSession();
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const create = useCreateReview(productId);

  if (!user) {
    return (
      <div className="p-6 rounded-2xl border border-[var(--foreground)]/8 bg-[var(--soft-gray)]/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-[var(--foreground)]">Write a review</h3>
          <p className="text-sm text-[var(--foreground)]/60 mt-1">
            Sign in to share your experience with this product.
          </p>
        </div>
        <Button
          onClick={onAuthNeeded}
          className="rounded-xl bg-[var(--foreground)] hover:bg-[var(--accent-brown)] text-white font-semibold h-11"
        >
          Sign in to review
        </Button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    if (rating < 1) {
      setError("Please pick a star rating.");
      return;
    }
    if (text.trim().length < 1) {
      setError("Please write a short review.");
      return;
    }
    try {
      await create.mutateAsync({ rating, text: text.trim() });
      setRating(0);
      setText("");
      setSuccess(true);
      // Hide the success banner after a few seconds
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not post your review");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-6 rounded-2xl border border-[var(--foreground)]/8 bg-white space-y-4"
    >
      <div>
        <h3 className="text-lg font-bold text-[var(--foreground)]">Write a review</h3>
        <p className="text-sm text-[var(--foreground)]/60 mt-1">
          Posting as <span className="font-semibold text-[var(--foreground)]/80">{user.name ?? user.email}</span>
        </p>
      </div>
      <div>
        <label className="block text-sm font-medium text-[var(--foreground)]/70 mb-2">Your rating</label>
        <InteractiveStars
          value={rating}
          onChange={setRating}
          disabled={create.isPending}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-[var(--foreground)]/70 mb-2">Your review</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={2000}
          rows={4}
          disabled={create.isPending}
          placeholder="What did you like (or not like) about this product?"
          className="w-full rounded-xl border border-[var(--foreground)]/15 bg-[var(--background)] p-3 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground)]/35 focus:outline-none focus:ring-2 focus:ring-[var(--accent-brown)]/30 resize-y"
        />
        <div className="text-xs text-[var(--foreground)]/40 mt-1 text-right">{text.length} / 2000</div>
      </div>
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </div>
      )}
      {success && (
        <div className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
          Thanks â€” your review is now visible on this page.
        </div>
      )}
      <Button
        type="submit"
        disabled={create.isPending}
        className="rounded-xl bg-[var(--foreground)] hover:bg-[var(--accent-brown)] text-white font-semibold h-11 px-6"
      >
        {create.isPending ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Postingâ€¦
          </>
        ) : (
          "Post review"
        )}
      </Button>
    </form>
  );
}

function ReviewsTab({
  productId,
  fallbackRating,
}: {
  productId: string;
  fallbackRating: number;
}) {
  const { user } = useSession();
  const { data: realReviews = [], isLoading } = useProductReviews(productId);
  const deleteReview = useDeleteReview(productId);
  const [authOpen, setAuthOpen] = useState(false);

  // Build the merged list: real customer reviews first (newest), then
  // the demo set. `isOwn` is set client-side from the session, so the
  // server is still the source of truth for authorisation.
  const realAvg =
    realReviews.length > 0
      ? realReviews.reduce((sum, r) => sum + r.rating, 0) / realReviews.length
      : null;
  const displayedRating = realAvg ?? fallbackRating;

  const handleDelete = (reviewId: string) => {
    if (!confirm("Delete your review? This cannot be undone.")) return;
    deleteReview.mutate(reviewId);
  };

  return (
    <div className="space-y-8">
      {/* Header â€” only the live count, no fake distribution bars. */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <div className="flex items-center gap-2">
          <span className="text-3xl font-black text-[var(--foreground)]">
            {displayedRating.toFixed(1)}
          </span>
          <StarRating rating={displayedRating} />
        </div>
        <div className="text-sm text-[var(--foreground)]/55">
          Based on {realReviews.length} verified review{realReviews.length === 1 ? "" : "s"}
        </div>
      </div>

      {/* Real customer reviews */}
      {isLoading && realReviews.length === 0 ? (
        <div className="text-sm text-[var(--foreground)]/40 py-2">Loading reviewsâ€¦</div>
      ) : realReviews.length > 0 ? (
        <div className="space-y-4">
          {realReviews.map((review) => {
            const isOwn = Boolean(user && review.userId === user.id);
            const authorLabel = review.authorName?.trim() || "Customer";
            return (
              <div
                key={review.id}
                className="p-5 rounded-2xl border border-[var(--foreground)]/8 bg-white"
              >
                <div className="flex items-center justify-between mb-2 gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-[var(--accent-brown)]/20 flex items-center justify-center text-sm font-bold text-[var(--accent-brown)] flex-shrink-0">
                      {authorLabel[0]?.toUpperCase() ?? "?"}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-[var(--foreground)] truncate">
                        {authorLabel}
                        {isOwn && (
                          <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-[var(--accent-brown)]">
                            You
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <StarRating rating={review.rating} />
                    <span className="text-xs text-[var(--foreground)]/40">
                      {formatDate(review.createdAt)}
                    </span>
                    {isOwn && (
                      <button
                        type="button"
                        onClick={() => handleDelete(review.id)}
                        disabled={deleteReview.isPending}
                        aria-label="Delete your review"
                        className="p-1.5 rounded-md text-[var(--foreground)]/30 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-[var(--foreground)]/70 text-sm leading-relaxed whitespace-pre-line">
                  {review.text}
                </p>
              </div>
            );
          })}
        </div>
      ) : null}

      {/* Divider if we have both kinds */}
      {realReviews.length > 0 && (
        <div className="flex items-center gap-3 text-xs text-[var(--foreground)]/40 uppercase tracking-widest">
          <span className="flex-1 h-px bg-[var(--foreground)]/10" />
          <span>Sample reviews</span>
          <span className="flex-1 h-px bg-[var(--foreground)]/10" />
        </div>
      )}

      {/* Demo reviews â€” always shown so the tab never looks empty. */}
      <div className="space-y-4">
        {DEMO_REVIEWS.map((review) => (
          <div
            key={review.author}
            className="p-5 rounded-2xl border border-[var(--foreground)]/8 bg-white"
          >
            <div className="flex items-center justify-between mb-2 gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-full bg-[var(--accent-brown)]/20 flex items-center justify-center text-sm font-bold text-[var(--accent-brown)] flex-shrink-0">
                  {review.author[0]}
                </div>
                <span className="font-semibold text-[var(--foreground)] truncate">{review.author}</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <StarRating rating={review.stars} />
                <span className="text-xs text-[var(--foreground)]/40">{review.date}</span>
              </div>
            </div>
            <p className="text-[var(--foreground)]/70 text-sm leading-relaxed">{review.text}</p>
          </div>
        ))}
      </div>

      {/* Write-a-review card */}
      <WriteReviewForm productId={productId} onAuthNeeded={() => setAuthOpen(true)} />

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
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
          <span>Loading productâ€¦</span>
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
      // Normalize image to a plain URL â€” backend returns either a URL or
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

  // Review count shown in the tab label and the header strip. The real
  // count comes from the reviews query when loaded; we start from the
  // demo count + real count so the tab never reads "(0)" and never
  // claims a fake thousand+.
  // We can't read the query here without restructuring (it lives inside
  // ReviewsTab), so we read the cache for the same key.
  const reviewCount = DEMO_REVIEWS.length;

  const tabs = [
    { id: "features" as const, label: "Highlights" },
    { id: "specs" as const, label: "Specifications" },
    { id: "reviews" as const, label: `Reviews (${reviewCount})` },
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
                {/* Main image â€” true 1:1 frame */}
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

                {/* Thumbnails â€” only shown when multiple images exist */}
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
                  {product.rating}
                </span>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-3 mb-6">
                <span className="text-4xl font-black text-[var(--accent-brown)]">
                  â‚¹{product.price.toLocaleString("en-IN")}
                </span>
                {product.originalPrice && (
                  <span className="text-lg text-[var(--foreground)]/40 line-through">
                    â‚¹{product.originalPrice.toLocaleString("en-IN")}
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
                        Buy Now â€” â‚¹{product.price.toLocaleString("en-IN")}
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
                {activeTab === "reviews" && (
                  <ReviewsTab productId={product.id} fallbackRating={product.rating} />
                )}
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