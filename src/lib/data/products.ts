export interface Product {
  id: string;
  name: string;
  category: "Electronics" | "Fashion";
  price: number;
  image: string;
  tags: string[];
  description: string;
}

export const products: Product[] = [
  // === ELECTRONICS (10 products) ===
  {
    id: "e1",
    name: "ProMax Wireless Earbuds",
    category: "Electronics",
    price: 149.99,
    image: "🎧",
    tags: ["wireless", "audio", "portable", "premium", "bluetooth", "noise-cancelling"],
    description: "Premium wireless earbuds with active noise cancellation and spatial audio.",
  },
  {
    id: "e2",
    name: "UltraBook Pro 16\"",
    category: "Electronics",
    price: 1899.99,
    image: "💻",
    tags: ["laptop", "premium", "professional", "portable", "high-performance", "creative"],
    description: "Powerful laptop for professionals with M-series chip and Retina display.",
  },
  {
    id: "e3",
    name: "SmartWatch Series X",
    category: "Electronics",
    price: 399.99,
    image: "⌚",
    tags: ["wearable", "fitness", "smart", "portable", "health", "bluetooth"],
    description: "Advanced smartwatch with health monitoring and always-on display.",
  },
  {
    id: "e4",
    name: "4K Action Camera",
    category: "Electronics",
    price: 329.99,
    image: "📷",
    tags: ["camera", "portable", "outdoor", "adventure", "waterproof", "4k"],
    description: "Rugged 4K action camera with stabilization for extreme sports.",
  },
  {
    id: "e5",
    name: "Smart Home Speaker",
    category: "Electronics",
    price: 99.99,
    image: "🔊",
    tags: ["audio", "smart", "home", "wireless", "bluetooth", "voice-assistant"],
    description: "AI-powered smart speaker with room-filling sound and voice control.",
  },
  {
    id: "e6",
    name: "Gaming Mechanical Keyboard",
    category: "Electronics",
    price: 179.99,
    image: "⌨️",
    tags: ["gaming", "mechanical", "rgb", "high-performance", "ergonomic"],
    description: "RGB mechanical keyboard with hot-swappable switches for gamers.",
  },
  {
    id: "e7",
    name: "Noise-Cancelling Headphones",
    category: "Electronics",
    price: 349.99,
    image: "🎵",
    tags: ["audio", "noise-cancelling", "wireless", "premium", "bluetooth", "over-ear"],
    description: "Studio-quality over-ear headphones with 30-hour battery life.",
  },
  {
    id: "e8",
    name: "Portable Power Bank 20K",
    category: "Electronics",
    price: 49.99,
    image: "🔋",
    tags: ["portable", "charging", "travel", "outdoor", "usb-c"],
    description: "20,000mAh portable charger with fast charging for all devices.",
  },
  {
    id: "e9",
    name: "Wireless Gaming Mouse",
    category: "Electronics",
    price: 129.99,
    image: "🖱️",
    tags: ["gaming", "wireless", "high-performance", "ergonomic", "rgb"],
    description: "Ultra-lightweight wireless gaming mouse with 25K DPI sensor.",
  },
  {
    id: "e10",
    name: "Smart Tablet Pro",
    category: "Electronics",
    price: 799.99,
    image: "📱",
    tags: ["tablet", "portable", "creative", "premium", "professional", "stylus"],
    description: "Professional tablet with stylus support for digital artists.",
  },

  // === FASHION (10 products) ===
  {
    id: "f1",
    name: "Urban Runner Sneakers",
    category: "Fashion",
    price: 129.99,
    image: "👟",
    tags: ["sneakers", "athletic", "casual", "comfortable", "street-style"],
    description: "Lightweight running sneakers with responsive cushioning.",
  },
  {
    id: "f2",
    name: "Premium Leather Jacket",
    category: "Fashion",
    price: 499.99,
    image: "🧥",
    tags: ["outerwear", "leather", "premium", "classic", "winter"],
    description: "Italian leather jacket with a timeless biker design.",
  },
  {
    id: "f3",
    name: "Designer Crossbody Bag",
    category: "Fashion",
    price: 259.99,
    image: "👜",
    tags: ["bag", "designer", "premium", "everyday", "leather"],
    description: "Minimalist crossbody bag crafted from premium vegan leather.",
  },
  {
    id: "f4",
    name: "Polarized Aviator Sunglasses",
    category: "Fashion",
    price: 189.99,
    image: "🕶️",
    tags: ["sunglasses", "outdoor", "classic", "uv-protection", "premium"],
    description: "Classic aviator sunglasses with polarized lenses and titanium frame.",
  },
  {
    id: "f5",
    name: "Slim Fit Chino Pants",
    category: "Fashion",
    price: 79.99,
    image: "👖",
    tags: ["pants", "casual", "office", "comfortable", "versatile"],
    description: "Stretch chino pants that transition from office to weekend.",
  },
  {
    id: "f6",
    name: "Merino Wool Sweater",
    category: "Fashion",
    price: 149.99,
    image: "🧶",
    tags: ["sweater", "winter", "premium", "comfortable", "classic"],
    description: "Ultra-soft merino wool sweater in a relaxed fit.",
  },
  {
    id: "f7",
    name: "Canvas Tote Bag",
    category: "Fashion",
    price: 39.99,
    image: "🛍️",
    tags: ["bag", "casual", "everyday", "eco-friendly", "versatile"],
    description: "Durable organic canvas tote for everyday essentials.",
  },
  {
    id: "f8",
    name: "Athletic Performance Hoodie",
    category: "Fashion",
    price: 89.99,
    image: "🏃",
    tags: ["athletic", "casual", "comfortable", "street-style", "fitness"],
    description: "Moisture-wicking hoodie designed for workouts and street wear.",
  },
  {
    id: "f9",
    name: "Classic Oxford Dress Shoes",
    category: "Fashion",
    price: 299.99,
    image: "👞",
    tags: ["shoes", "formal", "leather", "classic", "premium", "office"],
    description: "Hand-stitched leather Oxford shoes for formal occasions.",
  },
  {
    id: "f10",
    name: "Water-Resistant Parka",
    category: "Fashion",
    price: 349.99,
    image: "🧥",
    tags: ["outerwear", "winter", "outdoor", "waterproof", "adventure"],
    description: "Insulated parka with weather-resistant shell for harsh winters.",
  },
];

export function getProductById(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}

export function getProductsByIds(ids: string[]): Product[] {
  return ids.map((id) => products.find((p) => p.id === id)).filter(Boolean) as Product[];
}
