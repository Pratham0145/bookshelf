import { db } from "./db";

const defaultCategories = [
  { name: "Fiction", description: "Fictional stories and novels" },
  { name: "Non-Fiction", description: "Real stories and factual content" },
  { name: "Science", description: "Scientific books and research" },
  { name: "Technology", description: "Technology and programming books" },
  { name: "Business", description: "Business and entrepreneurship" },
  { name: "Self-Help", description: "Personal development and self-improvement" },
  { name: "Education", description: "Educational and academic books" },
  { name: "General", description: "General reading materials" },
];

export async function initializeDatabase() {
  try {
    // Check if categories exist
    const existingCategories = await db.category.count();
    
    if (existingCategories === 0) {
      console.log("Initializing database with default categories...");
      
      // Create default categories
      await db.category.createMany({
        data: defaultCategories,
        skipDuplicates: true,
      });
      
      console.log("Database initialized successfully!");
    }
    
    return { success: true };
  } catch (error) {
    console.error("Database initialization error:", error);
    return { success: false, error };
  }
}
