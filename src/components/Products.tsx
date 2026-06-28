import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { ShoppingBag, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "../../cable/hooks/useCart";
import { imgSrc, imgPosition } from "@/lib/api";
import { useProducts } from "@/lib/queries";
import OptimizedImage from "@/components/OptimizedImage";

const FILTERS = ["All", "Speakers", "Earbuds", "Chargers", "Cables"] as const;
type Filter = typeof FILTERS[number];

function readCategoryFromUrl(): Filter {
  if (typeof window === "undefined") return "All";
  const cat = new URLSearchParams(window.location.search).get("category");
  return (FILTERS as readonly string[]).includes(cat ?? "")
    ? (cat as Filter)
    : "All";
}

export default function Products() {
  const [filter, setFilter] = useState<Filter>(() => readCategoryFromUrl());
  const { addToCart } = useCart();
  const [location, navigate] = useLocation();

  // Keep the filter in sync with the URL when navigating between footer
  // links like "/?category=Speakers" or back to "/".
  useEffect(() => {
    setFilter(readCategoryFromUrl());
    // Scroll to the products section so the filtered grid is in view.
    if (location === "/") {
      const el = document.getElementById("products");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [location]);

  const { data, isLoading, error } = useProducts(
    filter === "All" ? {} : { category: filter }
  );
  const products = data?.products ?? [];

  const handleFilterClick = (f: Filter) => {
    setFilter(f);
    if (f === "All") {
      // Strip the query string from the URL.
      window.history.replaceState(
        null,
        "",
        window.location.pathname
      );
    } else {
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}?category=${f}`
      );
    }
  };

  return (
    <section id="products" className="py-24 bg-white">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="flex flex-col md:flex-row items-end md:items-center justify-between mb-12 gap-6">
          <div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-[var(--foreground)] mb-4">Latest Inventions</h2>
            <p className="text-[var(--foreground)]/70 max-w-xl text-lg">Handcrafted audio equipment and accessories that sound as good as they look.</p>
          </div>

          <div className="flex gap-2 p-1.5 bg-[var(--soft-gray)] rounded-full overflow-x-auto w-full md:w-auto">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => handleFilterClick(f)}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${
                  filter === f
                    ? "bg-white text-[var(--foreground)] shadow-sm"
                    : "text-[var(--foreground)]/60 hover:text-[var(--foreground)]"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>Could not load products. Make sure the backend is running on port 4000.</span>
          </div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center py-24 gap-3 text-[var(--foreground)]/50">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>Loading products…</span>
          </div>
        )}

        {!isLoading && !error && (
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
          >
            {products.map((product, index) => (
              <motion.div
                key={product.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group flex flex-col"
              >
                <div
                  className="relative aspect-square mb-4 rounded-2xl overflow-hidden bg-[var(--retro-cream)] border border-[var(--foreground)]/8 transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-xl cursor-pointer"
                  onClick={() => navigate(`/products/${product.id}`)}
                >
                  {product.badge && (
                    <div className="absolute top-3 left-3 z-20 bg-[var(--accent-brown)] px-3 py-1 rounded-full text-xs font-bold text-white">
                      {product.badge}
                    </div>
                  )}

                  {/* Base image — fills the 1:1 frame, fades out on hover when a hoverImage exists */}
                  <OptimizedImage
                    src={imgSrc(product.image)}
                    alt={product.name}
                    loading="lazy"
                    decoding="async"
                    objectPosition={imgPosition(product.image)}
                    className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 ${product.hoverImage ? "group-hover:opacity-0 group-hover:scale-105" : "group-hover:scale-105"}`}
                    style={{
                      transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                    onError={(e) => { e.currentTarget.style.display = "none"; }}
                  />

                  {/* Hover image — fades in at same anchor point */}
                  {product.hoverImage && (
                    <OptimizedImage
                      src={imgSrc(product.hoverImage)}
                      alt={`${product.name} hover`}
                      loading="lazy"
                      decoding="async"
                      objectPosition={imgPosition(product.hoverImage)}
                      className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                      style={{
                        transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
                      }}
                    />
                  )}

                  {!product.inStock && (
                    <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center">
                      <span className="font-bold text-[var(--foreground)]/50">Sold Out</span>
                    </div>
                  )}

                  <div className="absolute inset-x-0 bottom-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-20 flex flex-col gap-2">
                    {product.inStock && (
                      <Button
                        className="w-full bg-[var(--foreground)] hover:bg-[var(--accent-brown)] text-white rounded-full shadow-lg text-xs h-9"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Normalize the image to a plain URL before adding
                          // to cart. The backend returns either a URL or a
                          // JSON-stringified `{src, position}` object; the
                          // cart sidebar uses the value directly as <img src>,
                          // so it must be a plain URL string.
                          addToCart({
                            ...product,
                            image: imgSrc(product.image) || undefined,
                          });
                        }}
                      >
                        <ShoppingBag className="w-3.5 h-3.5 mr-1.5" />
                        Add to Cart
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      className="w-full bg-white/90 hover:bg-white border-white/60 text-[var(--foreground)] rounded-full shadow text-xs h-9"
                      onClick={(e) => { e.stopPropagation(); navigate(`/products/${product.id}`); }}
                    >
                      <ArrowRight className="w-3.5 h-3.5 mr-1.5" />
                      View Details
                    </Button>
                  </div>
                </div>

                <div
                  className="flex justify-between items-start cursor-pointer"
                  onClick={() => navigate(`/products/${product.id}`)}
                >
                  <div>
                    <h3 className="font-bold text-lg text-[var(--foreground)] hover:text-[var(--accent-brown)] transition-colors">{product.name}</h3>
                    <p className="text-sm text-[var(--foreground)]/60 mt-1 line-clamp-1">{product.description}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-yellow-500 text-xs">★</span>
                      <span className="text-xs text-[var(--foreground)]/60">{product.rating} ({product.reviews.toLocaleString("en-IN")})</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <span className="font-bold text-lg text-[var(--accent-brown)]">₹{product.price.toLocaleString("en-IN")}</span>
                    {product.originalPrice && (
                      <p className="text-xs text-[var(--foreground)]/40 line-through">₹{product.originalPrice.toLocaleString("en-IN")}</p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
}
