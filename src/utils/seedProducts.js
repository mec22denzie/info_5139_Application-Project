import { collection, getDocs, addDoc } from "firebase/firestore";
import { logError } from "../services/errorLogger";

const sampleProducts = [
  { name: "Blue Denim Jacket", price: 49.99, category: "Apparel", condition: "Good", description: "Classic men's denim jacket for all seasons.", image: "B_Jacket" },
  { name: "Red Hoodie", price: 29.99, category: "Apparel", condition: "Like New", description: "Comfortable cotton hoodie for casual wear.", image: "R_Hoodie" },
  { name: "White Simple Dress", price: 59.99, category: "Apparel", condition: "New", description: "Stylish and comfortable dress for everyday use.", image: "Dress1" },
  { name: "Apple MacBook Pro", price: 1999.99, category: "Electronics", condition: "Good", description: "Powerful Apple laptop with M1 chip for professionals.", image: "MacPro" },
  { name: "Apple EarPods", price: 29.99, category: "Electronics", condition: "New", description: "High-quality wired EarPods with built-in microphone.", image: "EarPods" },
  { name: "Sony Camera", price: 899.99, category: "Electronics", condition: "Like New", description: "Compact Sony mirrorless camera for photography enthusiasts.", image: "Camera" },
  { name: "Wireless Headphones", price: 199.99, category: "Electronics", condition: "Good", description: "Noise-canceling over-ear wireless headphones for immersive sound.", image: "Headphone" },
  { name: "SkyRunner 3000", price: 129.99, category: "Footwear", condition: "Like New", description: "Sleek, lightweight sneakers with air cushioning for all-day comfort.", image: "Air_Shoes" },
  { name: "TrailBlazer WP Boots", price: 149.99, category: "Footwear", condition: "Good", description: "Waterproof, rugged boots perfect for outdoor adventures.", image: "WP_Boots" },
  { name: "FlexGrip Classics", price: 59.99, category: "Footwear", condition: "Fair", description: "Durable rubber shoes designed for everyday wear and comfort.", image: "Rubber_Shoes" },
  { name: "VibrantStep Sneakers", price: 69.99, category: "Footwear", condition: "New", description: "Eye-catching colorful shoes that combine style and comfort.", image: "Colored_Shoes" },
];

// Seed sample products into Firestore if the products collection is empty
export async function seedIfEmpty(firestore) {
  try {
    const snapshot = await getDocs(collection(firestore, "products"));
    if (!snapshot.empty) return;

    for (const p of sampleProducts) {
      if (!p.name || !p.price || !p.category || !p.description) continue;

      try {
        await addDoc(collection(firestore, "products"), {
          name: p.name,
          price: p.price,
          category: p.category,
          condition: p.condition || "Good",
          description: p.description,
          isDonation: false,
          image: p.image || null,
        });
      } catch (err) {
        logError(err, { screen: "seedProducts", metadata: { action: "addSampleProduct", productName: p.name } });
      }
    }
  } catch (err) {
    logError(err, { screen: "seedProducts", metadata: { action: "seedIfEmpty" } });
  }
}
