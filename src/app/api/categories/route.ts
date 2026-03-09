import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { initializeDatabase } from "@/lib/init-db";

// GET - Fetch all categories
export async function GET() {
  try {
    // Try to initialize database on first request
    await initializeDatabase();
    
    const categories = await db.category.findMany({
      include: {
        _count: {
          select: { books: true },
        },
      },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json({ error: "Failed to fetch categories", details: String(error) }, { status: 500 });
  }
}

// POST - Create a new category
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const category = await db.category.create({
      data: {
        name: data.name,
        description: data.description,
      },
    });
    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}
