import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { initializeDatabase } from "@/lib/init-db";

// GET - Fetch all public books or user's books
export async function GET(request: NextRequest) {
  try {
    // Try to initialize database on first request
    await initializeDatabase();
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const id = searchParams.get("id");

    if (id) {
      const book = await db.book.findUnique({
        where: { id },
        include: {
          user: {
            select: { id: true, name: true, image: true },
          },
        },
      });
      return NextResponse.json(book);
    }

    const where: Record<string, unknown> = {};

    if (userId) {
      where.authorId = userId;
    } else {
      where.isPublic = true;
    }

    if (category && category !== "all") {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { author: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const books = await db.book.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, image: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(books);
  } catch (error) {
    console.error("Error fetching books:", error);
    return NextResponse.json({ error: "Failed to fetch books", details: String(error) }, { status: 500 });
  }
}

// POST - Create a new book
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const book = await db.book.create({
      data: {
        title: data.title,
        description: data.description,
        author: data.author || session.user.name || "Unknown",
        authorId: session.user.id,
        coverImage: data.coverImage,
        pdfUrl: data.pdfUrl,
        pages: data.pages || 0,
        category: data.category || "General",
        categoryId: data.categoryId,
        tags: data.tags,
        isPublic: data.isPublic ?? true,
      },
    });

    return NextResponse.json(book, { status: 201 });
  } catch (error) {
    console.error("Error creating book:", error);
    return NextResponse.json({ error: "Failed to create book" }, { status: 500 });
  }
}

// PUT - Update a book
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const existingBook = await db.book.findUnique({
      where: { id: data.id },
    });

    if (!existingBook || existingBook.authorId !== session.user.id) {
      return NextResponse.json({ error: "Not authorized to edit this book" }, { status: 403 });
    }

    const book = await db.book.update({
      where: { id: data.id },
      data: {
        title: data.title,
        description: data.description,
        coverImage: data.coverImage,
        pdfUrl: data.pdfUrl,
        pages: data.pages,
        category: data.category,
        tags: data.tags,
        isPublic: data.isPublic,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(book);
  } catch (error) {
    console.error("Error updating book:", error);
    return NextResponse.json({ error: "Failed to update book" }, { status: 500 });
  }
}

// DELETE - Delete a book
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Book ID required" }, { status: 400 });
    }

    const existingBook = await db.book.findUnique({
      where: { id },
    });

    if (!existingBook || existingBook.authorId !== session.user.id) {
      return NextResponse.json({ error: "Not authorized to delete this book" }, { status: 403 });
    }

    await db.book.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Book deleted successfully" });
  } catch (error) {
    console.error("Error deleting book:", error);
    return NextResponse.json({ error: "Failed to delete book" }, { status: 500 });
  }
}
