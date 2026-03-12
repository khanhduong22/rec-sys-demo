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
    purchaseHistory: ["e1", "e2", "e6", "e7", "e9"], // Earbuds, Laptop, Keyboard, Headphones, Mouse
  },
  {
    id: "u2",
    name: "Jordan Park",
    avatar: "👗",
    persona: "Fashionista",
    purchaseHistory: ["f1", "f2", "f3", "f4", "f6"], // Sneakers, Jacket, Bag, Sunglasses, Sweater
  },
  {
    id: "u3",
    name: "Sam Rivera",
    avatar: "🎨",
    persona: "Creative Professional",
    purchaseHistory: ["e2", "e10", "f3", "f5", "e7"], // Laptop, Tablet, Bag, Chinos, Headphones
  },
  {
    id: "u4",
    name: "Taylor Kim",
    avatar: "💰",
    persona: "Budget-Conscious",
    purchaseHistory: ["e5", "e8", "f5", "f7", "f8"], // Speaker, Power Bank, Chinos, Tote, Hoodie
  },
  {
    id: "u5",
    name: "Morgan Lee",
    avatar: "💎",
    persona: "Premium Shopper",
    purchaseHistory: ["e2", "e3", "f2", "f4", "f9"], // Laptop, Watch, Jacket, Sunglasses, Oxford
  },
];

export function getUserById(id: string): User | undefined {
  return users.find((u) => u.id === id);
}
