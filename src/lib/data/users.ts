export interface User {
  id: string;
  name: string;
  avatar: string;
  persona: string;
  purchaseHistory: string[];
}

export const users: User[] = [
  {
    id: "u1",
    name: "Alex Chen",
    avatar: "🧑‍💻",
    persona: "Tech Enthusiast",
    purchaseHistory: ["e1", "e2", "e6", "e7", "e9", "e3", "e5"], // Earbuds, Laptop, Keyboard, Headphones, Mouse, Watch, Speaker
  },
  {
    id: "u2",
    name: "Jordan Park",
    avatar: "👗",
    persona: "Fashionista",
    purchaseHistory: ["f1", "f2", "f3", "f4", "f6", "f9", "e3"], // Sneakers, Jacket, Bag, Sunglasses, Sweater, Oxford, Watch
  },
  {
    id: "u3",
    name: "Sam Rivera",
    avatar: "🎨",
    persona: "Creative Professional",
    purchaseHistory: ["e2", "e10", "f3", "f5", "e7", "e1", "f2"], // Laptop, Tablet, Bag, Chinos, Headphones, Earbuds, Jacket
  },
  {
    id: "u4",
    name: "Taylor Kim",
    avatar: "💰",
    persona: "Budget-Conscious",
    purchaseHistory: ["e5", "e8", "f5", "f7", "f8", "e1", "f10"], // Speaker, Power Bank, Chinos, Tote, Hoodie, Earbuds, Parka
  },
  {
    id: "u5",
    name: "Morgan Lee",
    avatar: "💎",
    persona: "Premium Shopper",
    purchaseHistory: ["e2", "e3", "f2", "f4", "f9", "e10", "f6"], // Laptop, Watch, Jacket, Sunglasses, Oxford, Tablet, Sweater
  },
  {
    id: "u6",
    name: "Riley Zhang",
    avatar: "🎮",
    persona: "Gaming Pro",
    purchaseHistory: ["e6", "e9", "e1", "e7", "e4", "f8", "e8"], // Keyboard, Mouse, Earbuds, Headphones, Camera, Hoodie, Power Bank
  },
  {
    id: "u7",
    name: "Casey Nguyen",
    avatar: "🏔️",
    persona: "Outdoor Adventurer",
    purchaseHistory: ["e4", "e8", "f10", "f1", "f5", "e5", "f7"], // Camera, Power Bank, Parka, Sneakers, Chinos, Speaker, Tote
  },
  {
    id: "u8",
    name: "Drew Martinez",
    avatar: "✨",
    persona: "Style + Tech",
    purchaseHistory: ["e2", "e3", "f1", "f4", "f6", "e9", "f3"], // Laptop, Watch, Sneakers, Sunglasses, Sweater, Mouse, Bag
  },
];

export function getUserById(id: string): User | undefined {
  return users.find((u) => u.id === id);
}
