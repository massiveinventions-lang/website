import { Link } from "wouter";
import { SiInstagram } from "react-icons/si";
import { MessageCircle, Mail } from "lucide-react";

type SocialLink = {
  key: string;
  label: string;
  href: string;
  external: boolean;
  icon: React.ReactNode;
  hoverClass: string;
};

// Brand-coloured hover for each link so the user gets a visual cue
// on which service they're about to open.
const SOCIAL_LINKS: SocialLink[] = [
  {
    key: "whatsapp",
    label: "Chat on WhatsApp",
    href: "https://wa.me/919413582708?text=Hi%20Massive%20Inventions%2C%20I%27d%20like%20to%20know%20more%20about%20your%20products.",
    external: true,
    icon: <MessageCircle className="w-5 h-5" aria-hidden="true" />,
    hoverClass: "hover:bg-[#25D366] hover:text-white",
  },
  {
    key: "instagram",
    label: "Follow on Instagram",
    href: "https://www.instagram.com/massive_inventions/",
    external: true,
    icon: <SiInstagram className="w-[18px] h-[18px]" aria-hidden="true" />,
    hoverClass: "hover:bg-gradient-to-br hover:from-[#f09433] hover:via-[#e6683c] hover:to-[#bc1888] hover:text-white",
  },
  {
    key: "email",
    label: "Email us",
    href: "mailto:massiveinventions@gmail.com?subject=Inquiry%20from%20Massive%20Inventions%20website",
    external: true,
    icon: <Mail className="w-5 h-5" aria-hidden="true" />,
    hoverClass: "hover:bg-[#EA4335] hover:text-white",
  },
];

export default function Footer() {
  return (
    <footer id="contact" className="bg-[var(--foreground)] text-white pt-20 pb-10">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-2 lg:col-span-1">
            <Link href="/" className="text-2xl font-black tracking-tight text-white mb-6 inline-block">
              Massive <span className="text-[var(--accent-light)]">Inventions</span>
            </Link>
            <p className="text-white/60 mb-6 max-w-sm">
              Premium wooden speakers and audio accessories designed for those who appreciate the warmth of natural acoustics.
            </p>
            <div className="flex gap-4">
              {SOCIAL_LINKS.map((s) => (
                <a
                  key={s.key}
                  href={s.href}
                  target={s.external ? "_blank" : undefined}
                  rel={s.external ? "noopener noreferrer" : undefined}
                  aria-label={s.label}
                  title={s.label}
                  className={`w-10 h-10 rounded-full bg-white/10 text-white/80 flex items-center justify-center transition-colors ${s.hoverClass}`}
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-bold text-lg mb-6 text-white">Shop</h4>
            <ul className="space-y-4">
              {[
                { label: 'All Products', href: '/' },
                { label: 'Wooden Speakers', href: '/?category=Speakers' },
                { label: 'True Wireless', href: '/?category=Earbuds' },
                { label: 'GaN Chargers', href: '/?category=Chargers' },
                { label: 'Cables & Accessories', href: '/?category=Cables' },
              ].map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-white/60 hover:text-[var(--accent-light)] transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-lg mb-6 text-white">Support</h4>
            <ul className="space-y-4">
              {[
                { label: 'Track Order', href: '/track-order' },
                { label: 'Shipping Policy', href: '/shipping-policy' },
                { label: 'Replacement & Warranty', href: '/returns-warranty' },
                { label: 'FAQs', href: '/faqs' },
                { label: 'Contact Us', href: '/contact' },
              ].map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-white/60 hover:text-[var(--accent-light)] transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-lg mb-6 text-white">Contact</h4>
            <ul className="space-y-4 text-white/60">
              <li>
                <a
                  href="mailto:massiveinventions@gmail.com?subject=Inquiry%20from%20Massive%20Inventions%20website"
                  className="hover:text-[var(--accent-light)] transition-colors break-all"
                >
                  massiveinventions@gmail.com
                </a>
              </li>
              <li>
                <a
                  href="https://wa.me/919413582708?text=Hi%20Massive%20Inventions%2C%20I%27d%20like%20to%20know%20more%20about%20your%20products."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[var(--accent-light)] transition-colors"
                >
                  +91 94135 82708
                </a>
              </li>
              <li>
                <a
                  href="https://www.instagram.com/massive_inventions/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[var(--accent-light)] transition-colors"
                >
                  @massive_inventions
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-white/40 text-sm">
          <p>© {new Date().getFullYear()} Massive Inventions. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <Link href="/terms-of-service" className="hover:text-white transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
