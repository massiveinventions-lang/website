import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Search, ShoppingBag, Menu, X, User as UserIcon, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "../../cable/hooks/useCart";
import { useScrollToSection } from "../../cable/hooks/useScrollToSection";
import { useSession, signOut } from "@/lib/supabase";
import AuthModal from "@/components/AuthModal";

type NavItem = {
  label: string;
  // Either scrolls to a section on the homepage, or navigates to a route.
  kind: "scroll" | "route";
  target: string;
};

const NAV_ITEMS: NavItem[] = [
  { label: "Products", kind: "scroll", target: "products" },
  { label: "Categories", kind: "scroll", target: "categories" },
  { label: "Features", kind: "scroll", target: "features" },
  { label: "Reviews", kind: "scroll", target: "reviews" },
  { label: "Contact", kind: "route", target: "/contact" },
];

export default function Navbar() {
  const { itemCount, setIsCartOpen } = useCart();
  const scrollToSection = useScrollToSection();
  const { user } = useSession();
  const [authOpen, setAuthOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [, navigate] = useLocation();

  // Close the mobile drawer whenever the route changes (so a navigation
  // tap doesn't leave the menu open over the next page).
  const [location] = useLocation();
  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  // Lock body scroll while the drawer is open — without this the user
  // can still scroll the page behind the menu, which feels broken on iOS.
  useEffect(() => {
    if (mobileOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [mobileOpen]);

  const handleNavClick = (item: NavItem) => {
    setMobileOpen(false);
    if (item.kind === "route") {
      navigate(item.target);
    } else {
      scrollToSection(item.target);
    }
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 bg-white/70 backdrop-blur-md border-b border-[var(--soft-gray)] flex items-center justify-between px-4 sm:px-6 lg:px-12 transition-all duration-300">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center" aria-label="Massive Inventions">
            <img
              src="/logo.png"
              alt="Massive Inventions"
              className="h-12 w-auto"
            />
          </Link>
        </div>

        <div className="hidden md:flex items-center gap-8">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => handleNavClick(item)}
              className="text-sm font-medium text-[var(--foreground)]/80 hover:text-[var(--accent-brown)] transition-colors relative group cursor-pointer"
            >
              {item.label}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[var(--accent-brown)] transition-all duration-300 group-hover:w-full"></span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <button
            type="button"
            aria-label="Search"
            className="p-2 text-[var(--foreground)] hover:text-[var(--accent-brown)] transition-colors hidden sm:inline-flex"
          >
            <Search size={20} />
          </button>

          <button
            type="button"
            aria-label="Open cart"
            className="p-2 text-[var(--foreground)] hover:text-[var(--accent-brown)] transition-colors relative"
            onClick={() => setIsCartOpen(true)}
          >
            <ShoppingBag size={20} />
            {itemCount > 0 && (
              <span className="absolute top-0 right-0 bg-[var(--accent-brown)] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </button>

          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--soft-gray)]">
                  <div className="w-7 h-7 rounded-full bg-[var(--accent-brown)] text-white text-xs font-bold flex items-center justify-center">
                    {user.email[0]?.toUpperCase() ?? "U"}
                  </div>
                  <span className="text-xs font-medium text-[var(--foreground)]/80 max-w-[120px] truncate">
                    {user.email}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => void signOut()}
                  aria-label="Sign out"
                  className="p-2 text-[var(--foreground)]/60 hover:text-[var(--accent-brown)] transition-colors"
                >
                  <LogOut size={18} />
                </button>
              </>
            ) : (
              <Button
                variant="default"
                onClick={() => setAuthOpen(true)}
                className="bg-[var(--foreground)] text-white hover:bg-[var(--accent-brown)] rounded-full px-6"
              >
                <UserIcon className="w-4 h-4 mr-2" />
                Sign In
              </Button>
            )}
          </div>

          <button
            type="button"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen ? "true" : "false"}
            aria-controls="mobile-nav-drawer"
            onClick={() => setMobileOpen((o) => !o)}
            className="md:hidden p-2 text-[var(--foreground)] hover:text-[var(--accent-brown)] transition-colors"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
      </nav>

      {/* Mobile drawer — slides in from the right under the navbar.
          Rendered as a sibling of <nav> so z-index stacking is clean. */}
      {mobileOpen && (
        <>
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
            className="md:hidden fixed inset-0 top-16 bg-black/50 backdrop-blur-sm z-40 animate-in fade-in"
          />

          {/* Drawer panel */}
          <div
            id="mobile-nav-drawer"
            className="md:hidden fixed top-16 right-0 bottom-0 left-0 z-40 bg-white animate-in slide-in-from-top-2"
          >
            <nav className="flex flex-col p-6 gap-1 h-full overflow-y-auto">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => handleNavClick(item)}
                  className="text-left text-lg font-semibold text-[var(--foreground)] hover:text-[var(--accent-brown)] hover:bg-[var(--soft-gray)] px-4 py-4 rounded-xl transition-colors"
                >
                  {item.label}
                </button>
              ))}

              <div className="my-4 border-t border-[var(--soft-gray)]" />

              {user ? (
                <div className="flex flex-col gap-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[var(--accent-brown)] text-white text-sm font-bold flex items-center justify-center">
                      {user.email[0]?.toUpperCase() ?? "U"}
                    </div>
                    <span className="text-sm font-medium text-[var(--foreground)] truncate">
                      {user.email}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => void signOut()}
                    className="rounded-xl"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign out
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => {
                    setMobileOpen(false);
                    setAuthOpen(true);
                  }}
                  className="mx-4 bg-[var(--foreground)] text-white hover:bg-[var(--accent-brown)] rounded-xl h-12"
                >
                  <UserIcon className="w-4 h-4 mr-2" />
                  Sign In
                </Button>
              )}
            </nav>
          </div>
        </>
      )}
    </>
  );
}