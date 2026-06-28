/**
 * Seed data — kept in sync with src/data/products.ts in the frontend.
 * If you change one, change the other.
 */

type ImageObj = { src: string; position: string };
type Spec = { label: string; value: string };
type Color = { name: string; hex: string };

export type SeedProduct = {
  name: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviews: number;
  category: "Speakers" | "Earbuds" | "Chargers" | "Cables";
  badge?: string;
  image: ImageObj;
  hoverImage?: ImageObj;
  images?: ImageObj[];
  description: string;
  longDescription: string;
  inStock: boolean;
  stock: number;
  specs: Spec[];
  features: string[];
  colors: Color[];
  sku?: string;
};

export const seedProducts: SeedProduct[] = [
  {
    name: "Vintage Sheesham Speaker",
    price: 1399,
    originalPrice: 5999,
    rating: 4.9,
    reviews: 1287,
    category: "Speakers",
    badge: "Handcrafted",
    image: { src: "/speaker-1.png", position: "center" },
    hoverImage: { src: "/speaker-2.png", position: "center" },
    images: [
      { src: "/speaker-1.png", position: "center" },
      { src: "/speaker-2.png", position: "center" },
      { src: "/speaker-3.png", position: "center" },
      { src: "/speaker-4.png", position: "center" },
    ],
    description:
      "Handcrafted from sustainable Sheesham wood with rich, warm acoustics and 12-hour battery life.",
    longDescription:
      "The Vintage Sheesham Speaker is a tribute to classic audio craftsmanship. Each enclosure is handcrafted from sustainably sourced Indian Sheesham wood, finished to bring out the natural grain. Premium 40mm drivers deliver rich mids and crisp highs with deep, controlled bass. Bluetooth 5.3 with multipoint pairing, 12-hour battery, USB-C fast charging.",
    inStock: true,
    stock: 50,
    specs: [
      { label: "Driver", value: "2× 40mm Full Range" },
      { label: "Power", value: "20W RMS" },
      { label: "Battery", value: "12 hours (4,000 mAh)" },
      { label: "Connectivity", value: "Bluetooth 5.3, AUX 3.5mm" },
      { label: "Material", value: "Solid Sheesham Wood" },
      { label: "Charging", value: "USB-C (5V/2A)" },
      { label: "Weight", value: "780 g" },
    ],
    features: [
      "Handcrafted solid Sheesham wood enclosure",
      "20W RMS with 40mm full-range drivers",
      "Bluetooth 5.3 with multipoint pairing",
      "12-hour battery life with USB-C fast charging",
      "AUX 3.5mm input for wired sources",
      "Built-in mic for hands-free calls",
    ],
    colors: [
      { name: "Natural", hex: "#A0785A" },
      { name: "Walnut", hex: "#5C4033" },
    ],
    sku: "SPK-SHEESHAM-001",
  },
  {
    name: "Massive Earbuds X",
    price: 999,
    originalPrice: 1499,
    rating: 4.7,
    reviews: 3421,
    category: "Earbuds",
    badge: "ANC",
    image: { src: "/earphone-1.png", position: "center" },
    hoverImage: { src: "/earphone-2.png", position: "center" },
    images: [
      { src: "/earphone-1.png", position: "center" },
      { src: "/earphone-2.png", position: "center" },
      { src: "/earphone-3.png", position: "center" },
      { src: "/earphone-4.png", position: "center" },
      { src: "/earphone-5.png", position: "center" },
    ],
    description:
      "True wireless with hybrid ANC, 8h playtime, IPX5 and USB-C fast charge.",
    longDescription:
      "Massive Earbuds X deliver studio-grade sound in a pocket-sized package. Hybrid active noise cancellation blocks up to 35 dB of ambient noise. 8 hours of playtime per charge, 32 hours with the case. IPX5 water resistance and USB-C fast charging.",
    inStock: true,
    stock: 200,
    specs: [
      { label: "Driver", value: "10mm Dynamic" },
      { label: "ANC", value: "Hybrid ANC up to 35 dB" },
      { label: "Battery (Buds)", value: "8 hours" },
      { label: "Battery (Case)", value: "32 hours total" },
      { label: "Bluetooth", value: "5.3 with aptX Adaptive" },
      { label: "Water Resistance", value: "IPX5" },
      { label: "Charging", value: "USB-C & Qi Wireless" },
    ],
    features: [
      "Hybrid ANC — up to 35 dB noise reduction",
      "10mm dynamic drivers with aptX Adaptive",
      "8h buds + 24h case = 32h total playtime",
      "IPX5 sweat and rain resistant",
      "Qi wireless + USB-C fast charging",
      "Touch controls with custom EQ app",
    ],
    colors: [
      { name: "Matte Black", hex: "#1a1a1a" },
      { name: "Pearl White", hex: "#F5F5F0" },
      { name: "Navy Blue", hex: "#1B2A4A" },
    ],
    sku: "EARBUDS-X-001",
  },
  {
    name: "Massive Super VOOC 80W",
    price: 399,
    rating: 4.8,
    reviews: 2211,
    category: "Chargers",
    badge: "80W",
    image: { src: "/adapter-1.png", position: "center" },
    hoverImage: { src: "/adapter-2.png", position: "center" },
    images: [
      { src: "/adapter-1.png", position: "center" },
      { src: "/adapter-2.png", position: "center" },
      { src: "/adapter-3.png", position: "center" },
    ],
    description:
      "80W Super VOOC ultra-fast charging. BIS certified for India.",
    longDescription:
      "The Massive Super VOOC 80W charger delivers lightning-fast charging at up to 80W for compatible devices. Supports VOOC, SuperVOOC, PD 3.0 and QC 3.0 protocols with multi-layer safety protection. BIS certified for India.",
    inStock: true,
    stock: 300,
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
    sku: "CHG-VOOC80-001",
  },
  {
    name: "Massive Data Flow USB-C",
    price: 9,
    rating: 4.6,
    reviews: 4087,
    category: "Cables",
    badge: "66W",
    image: { src: "/cable-1.png", position: "center" },
    hoverImage: { src: "/cable-2.png", position: "center" },
    images: [
      { src: "/cable-1.png", position: "center" },
      { src: "/cable-2.png", position: "center" },
      { src: "/cable-3.png", position: "center" },
    ],
    description:
      "6A fast charging up to 66W. 480 Mbps data sync. Flat tangle-free design.",
    longDescription:
      "The Massive Data Flow USB-C cable supports 6A fast charging up to 66W and 480 Mbps data transfer. The flat tangle-free design makes it ideal for everyday carry. Universal compatibility with all USB-C devices.",
    inStock: true,
    stock: 500,
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
    sku: "CABLE-USB-C-001",
  },
  {
    name: "Massive Fast C to C",
    price: 349,
    rating: 4.8,
    reviews: 1563,
    category: "Chargers",
    badge: "33W PD",
    image: { src: "/charger-1.png", position: "center" },
    hoverImage: { src: "/charger-2.png", position: "center" },
    images: [
      { src: "/charger-1.png", position: "center" },
      { src: "/charger-2.png", position: "center" },
      { src: "/charger-3.png", position: "center" },
    ],
    description:
      "33W PD fast charging with USB-C cable included. Works with iPhone 15+.",
    longDescription:
      "The Massive Fast C to C Charger bundle includes a 33W PD wall adapter and a USB-C to USB-C cable. Reversible connectors mean no wrong way to plug in. Compatible with iPhone 15+, Android, tablets and laptops. Built to perform. Made to last.",
    inStock: true,
    stock: 200,
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
    sku: "CHG-C2C-33W-001",
  },
];
