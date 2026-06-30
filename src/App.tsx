import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "../cable/hooks/useCart";
import { Loader2 } from "lucide-react";

// Page-level routes: lazy-loaded so they are code-split into separate
// chunks and only downloaded when the user navigates to that route.
const NotFound     = lazy(() => import("@/pages/not-found"));
const ProductDetail = lazy(() => import("@/pages/ProductDetail"));
const TrackOrder   = lazy(() => import("@/pages/TrackOrder"));
const ShippingPolicy = lazy(() => import("@/pages/ShippingPolicy"));
const ReturnsWarranty = lazy(() => import("@/pages/ReturnsWarranty"));
const FAQs         = lazy(() => import("@/pages/FAQs"));
const Contact      = lazy(() => import("@/pages/Contact"));
const Checkout     = lazy(() => import("@/pages/Checkout"));
const TermsOfService = lazy(() => import("@/pages/TermsOfService"));

// Home-page sections: eagerly imported because they are shown immediately.
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import StatsMarquee from "@/components/StatsMarquee";
import Products from "@/components/Products";
import Categories from "@/components/Categories";
import Features from "@/components/Features";
import Reviews from "@/components/Reviews";
import Newsletter from "@/components/Newsletter";
import Footer from "@/components/Footer";
import CartSidebar from "@/components/CartSidebar";

// Shown while lazy-loaded route chunks are downloading.
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
      <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-brown)]" />
    </div>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Fail fast instead of spinning forever if the backend is down.
      retry: 1,
      retryDelay: 1000,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

function Home() {
  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <Hero />
        <StatsMarquee />
        <Products />
        <Categories />
        <Features />
        <Reviews />
        <Newsletter />
      </main>
      <Footer />
      <CartSidebar />
    </div>
  );
}

function AnimatedRoutes() {
  const [location] = useLocation();

  // Scroll to top on every route change.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [location]);

  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/products/:id" component={ProductDetail} />
        <Route path="/track-order" component={TrackOrder} />
        <Route path="/shipping-policy" component={ShippingPolicy} />
        <Route path="/returns-warranty" component={ReturnsWarranty} />
        <Route path="/faqs" component={FAQs} />
        <Route path="/contact" component={Contact} />
        <Route path="/checkout" component={Checkout} />
        <Route path="/terms-of-service" component={TermsOfService} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <CartProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <AnimatedRoutes />
          </WouterRouter>
          <Toaster />
        </CartProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
