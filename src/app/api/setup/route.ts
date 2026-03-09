import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    // Check environment
    const dbUrl = process.env.DATABASE_URL;
    const dbUrlStatus = dbUrl ? `Set (${dbUrl.substring(0, 20)}...)` : "NOT SET";
    
    // Test database connection
    await db.$queryRaw`SELECT 1`;
    
    // Check if categories exist
    const categoryCount = await db.category.count();
    
    if (categoryCount === 0) {
      // Create default categories
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
      
      await db.category.createMany({
        data: defaultCategories,
        skipDuplicates: true,
      });
      
      return NextResponse.json({ 
        status: "initialized", 
        message: "Database tables created and categories added",
        categories: defaultCategories.length,
        databaseUrl: dbUrlStatus
      });
    }
    
    return NextResponse.json({ 
      status: "ok", 
      message: "Database connection successful",
      categories: categoryCount,
      databaseUrl: dbUrlStatus
    });
  } catch (error) {
    console.error("Database setup error:", error);
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    return NextResponse.json({ 
      error: "Database connection failed", 
      message: errorMessage,
      databaseUrl: process.env.DATABASE_URL ? "Set" : "NOT SET",
      hint: "Make sure DATABASE_URL is correctly set and Neon database is accessible"
    }, { status: 500 });
  }
}
