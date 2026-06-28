export interface ProductSpec {
  label: string;
  value: string;
}

export interface ProductImage {
  src: string;
  /** CSS object-position value, e.g. "center", "center 75%", "right center" */
  position?: string;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviews: number;
  category: string;
  badge?: string;
  image: string | ProductImage;
  hoverImage?: string | ProductImage;
  images?: (string | ProductImage)[];
  description: string;
  longDescription: string;
  inStock: boolean;
  specs: ProductSpec[];
  features: string[];
  colors: { name: string; hex: string }[];
}

/** Helper to read src/position from a string-or-object image entry. */
export function imgSrc(img: string | ProductImage): string {
  return typeof img === "string" ? img : img.src;
}

/** Helper to read position from a string-or-object image entry. Defaults to "center". */
export function imgPosition(img: string | ProductImage): string {
  return typeof img === "string" ? "center" : img.position ?? "center";
}

export const products: Product[] = [
  {
    id: 1,
    name: "Vintage Sheesham Speaker",
    price: 1399,
    rating: 4.9,
    reviews: 1847,
    category: "Speakers",
    badge: "Handcrafted",
    image: "/speaker-1.png",
    hoverImage: { src: "/speaker-2.png", position: "center 75%" },
    images: [
      "/speaker-1.png",
      { src: "/speaker-2.png", position: "center 75%" },
      "/speaker-3.png",
      { src: "/speaker-4.png", position: "right center" },
    ],
    description: "Hand-turned from premium aged sheesham wood. 10W warm wide soundstage.",
    longDescription: "The Vintage Sheesham Speaker is a statement of craft. Each cabinet is hand-turned by artisans in Jaipur from sustainably sourced premium aged sheesham. The grain is unique on every unit — no two speakers are identical. 10W of warm, wide audio fills the room the way only real wood can.",
    inStock: true,
    specs: [
      { label: "Speaker Output", value: "10 Watts" },
      { label: "Wood Type", value: "Aged Sheesham (40 Year)" },
      { label: "Connectivity", value: "Bluetooth 5.1, AUX, USB" },
      { label: "Battery Life", value: "Up to 12 Hours" },
      { label: "Frequency Response", value: "20 Hz – 20 kHz" },
      { label: "Origin", value: "Made in India — Jaipur" },
    ],
    features: [
      "Hand-turned from premium aged sheesham wood",
      "10W warm wide soundstage",
      "Brass-fitted knobs & controls",
      "Handcrafted by artisans in Jaipur",
      "Bluetooth 5.1 with AUX & USB input",
    ],
    colors: [
      { name: "Sheesham Brown", hex: "#7B3F1A" },
      { name: "Natural Teak", hex: "#A0632A" },
    ],
  },
  {
    id: 2,
    name: "Massive Earbuds X",
    price: 450,
    rating: 4.7,
    reviews: 3124,
    category: "Earbuds",
    badge: "Best Seller",
    image: "/earphone-1.png",
    hoverImage: "/earphone-2.png",
    images: ["/earphone-1.png", "/earphone-2.png", "/earphone-3.png", "/earphone-4.png", "/earphone-5.png"],
    description: "Deep bass with AI-powered noise cancellation. 8 hrs + 60 hrs with case.",
    longDescription: "Massive Earbuds X are engineered for those who demand clarity in every environment. The 10mm dynamic drivers deliver deep, punchy bass while the AI-powered ANC intelligently filters out ambient noise. Engineered for clarity. Designed for life.",
    inStock: true,
    specs: [
      { label: "Driver Size", value: "10mm Dynamic" },
      { label: "ANC", value: "Active Noise Cancellation" },
      { label: "Battery (Buds)", value: "8 Hours" },
      { label: "Battery (Case)", value: "60 Hours Total (depends on usage)" },
      { label: "Connectivity", value: "Bluetooth 5.1" },
      { label: "Water Resistance", value: "IPX4" },
      { label: "Charging", value: "USB-C Fast Charge" },
    ],
    features: [
      "Deep bass with AI-powered noise cancellation",
      "8 hrs playtime + 60 hrs with case (depends on usage)",
      "IPX4 splash resistant",
      "Ultra-light ergonomic fit",
      "USB-C fast charging — 10 min = 2 hrs",
    ],
    colors: [
      { name: "Matte Black", hex: "#1a1a1a" },
      { name: "Pearl White", hex: "#F0EDE8" },
      { name: "Navy Blue", hex: "#1B2A4A" },
    ],
  },
  {
    id: 3,
    name: "Massive Super VOOC 80W",
    price: 399,
    rating: 4.8,
    reviews: 2211,
    category: "Chargers",
    badge: "80W",
    image: "/adapter-1.png",
    hoverImage: "/adapter-2.png",
    images: ["/adapter-1.png", "/adapter-2.png", "/adapter-3.png"],
    description: "80W Super VOOC ultra-fast charging. BIS certified for India.",
    longDescription: "The Massive Super VOOC 80W charger delivers lightning-fast charging at up to 80W for compatible devices. Supports VOOC, SuperVOOC, PD 3.0 and QC 3.0 protocols with multi-layer safety protection. BIS certified for India.",
    inStock: true,
    specs: [
      { label: "Output Power", value: "80W Super VOOC / 33W PD" },
      { label: "Charging Protocol", value: "VOOC, SuperVOOC, PD 3.0, QC 3.0" },
      { label: "Port", value: "1× USB-A" },
      { label: "Output Voltage", value: "5V / 9V / 12V / 20V" },
      { label: "Max Output Current", value: "6A (at 11V)" },
      { label: "Input", value: "100–240V AC (BIS Certified)" },
      { label: "Safety", value: "OVP / OCP / OTP / Short Circuit" },
    ],
    features: [
      "80W Super VOOC ultra-fast charging",
      "Compatible with VOOC, SuperVOOC, PD 3.0 & QC 3.0 protocols",
      "Multi-layer OVP, OCP and thermal protection",
      "Universal 100–240V BIS-certified input",
      "Compact foldable pin design — carry anywhere",
    ],
    colors: [
      { name: "Matte Black", hex: "#1a1a1a" },
      { name: "White", hex: "#F5F5F0" },
    ],
  },
  {
    id: 4,
    name: "Massive Data Flow USB-C",
    price: 9,
    rating: 4.6,
    reviews: 4087,
    category: "Cables",
    badge: "66W",
    image: "/cable-1.png",
    hoverImage: "/cable-2.png",
    images: ["/cable-1.png", "/cable-2.png", "/cable-3.png"],
    description: "6A fast charging up to 66W. 480 Mbps data sync. Flat tangle-free design.",
    longDescription: "The Massive Data Flow USB-C cable supports 6A fast charging up to 66W and 480 Mbps data transfer. The flat tangle-free design makes it ideal for everyday carry. Universal compatibility with all USB-C devices.",
    inStock: true,
    specs: [
      { label: "Charging Speed", value: "6A / 66W Fast Charge" },
      { label: "Data Transfer", value: "480 Mbps (USB 2.0)" },
      { label: "Cable Length", value: "1 Metre" },
      { label: "Connector", value: "USB-A to USB-C" },
      { label: "Build", value: "Flat Tangle-Free TPE" },
      { label: "Compatibility", value: "All USB-C devices" },
      { label: "Protection", value: "OVP / Short Circuit" },
    ],
    features: [
      "6A fast charging — up to 66W with compatible charger",
      "480 Mbps high-speed data sync",
      "Flat tangle-free design for daily use",
      "Built-in overload and short circuit protection",
      "Universal — works with all USB-C smartphones, tablets & laptops",
    ],
    colors: [
      { name: "Matte Black", hex: "#1a1a1a" },
      { name: "Space Grey", hex: "#6B6B70" },
    ],
  },
  {
    id: 5,
    name: "Massive Fast C to C",
    price: 349,
    rating: 4.8,
    reviews: 1563,
    category: "Chargers",
    badge: "33W PD",
    image: "/charger-1.png",
    hoverImage: "/charger-2.png",
    images: ["/charger-1.png", "/charger-2.png", "/charger-3.png"],
    description: "33W PD fast charging with USB-C cable included. Works with iPhone 15+.",
    longDescription: "The Massive Fast C to C Charger bundle includes a 33W PD wall adapter and a USB-C to USB-C cable. Reversible connectors mean no wrong way to plug in. Compatible with iPhone 15+, Android, tablets and laptops. Built to perform. Made to last.",
    inStock: true,
    specs: [
      { label: "Charging Standard", value: "PD Fast Charging (USB Power Delivery)" },
      { label: "Connector", value: "USB-A to Type-C (included cable)" },
      { label: "Max Output", value: "33W PD" },
      { label: "Output Voltage", value: "5V / 9V / 12V / 20V" },
      { label: "Data Transfer", value: "480 Mbps" },
      { label: "Cable Length", value: "1 Metre" },
      { label: "Safety", value: "OVP / Short Circuit / OTP" },
    ],
    features: [
      "33W PD fast charging via included USB-C cable",
      "Reversible Type-C connector — plug in any way",
      "Works with iPhone 15+, Android phones, tablets & laptops",
      "480 Mbps high-speed data transfer",
      "Smart chip for safe & stable charging",
    ],
    colors: [
      { name: "Matte Black", hex: "#1a1a1a" },
      { name: "White", hex: "#F5F5F0" },
    ],
  },
];

export const categories = [
  { name: "Speakers", icon: "🔊", count: 1 },
  { name: "Earbuds", icon: "🎧", count: 1 },
  { name: "Chargers", icon: "⚡", count: 2 },
  { name: "Cables", icon: "🔌", count: 1 },
];
