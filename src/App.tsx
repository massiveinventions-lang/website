import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import ProductDetail from "@/pages/ProductDetail";
import TrackOrder from "@/pages/TrackOrder";
import ShippingPolicy from "@/pages/ShippingPolicy";
import ReturnsWarranty from "@/pages/ReturnsWarranty";
import FAQs from "@/pages/FAQs";
import Contact from "@/pages/Contact";
import Checkout from "@/pages/Checkout";
import { CartProvider } from "../cable/hooks/useCart";

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
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/products/:id" component={ProductDetail} />
      <Route path="/track-order" component={TrackOrder} />
      <Route path="/shipping-policy" component={ShippingPolicy} />
      <Route path="/returns-warranty" component={ReturnsWarranty} />
      <Route path="/faqs" component={FAQs} />
      <Route path="/contact" component={Contact} />
      <Route path="/checkout" component={Checkout} />
      <Route component={NotFound} />
    </Switch>
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
