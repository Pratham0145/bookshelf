import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET - Fetch reading progress
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const bookId = searchParams.get("bookId");

    if (bookId) {
      const progress = await db.readingProgress.findUnique({
        where: {
          userId_bookId: {
            userId: session.user.id,
            bookId,
          },
        },
      });
      return NextResponse.json(progress);
    }

    const allProgress = await db.readingProgress.findMany({
      where: { userId: session.user.id },
      include: {
        book: {
          select: {
            id: true,
            title: true,
            coverImage: true,
            pages: true,
          },
        },
      },
      orderBy: { lastReadAt: "desc" },
    });

    return NextResponse.json(allProgress);
  } catch (error) {
    console.error("Error fetching progress:", error);
    return NextResponse.json({ error: "Failed to fetch progress" }, { status: 500 });
  }
}

// POST - Update reading progress
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const progress = await db.readingProgress.upsert({
      where: {
        userId_bookId: {
          userId: session.user.id,
          bookId: data.bookId,
        },
      },
      update: {
        currentPage: data.currentPage,
        lastReadAt: new Date(),
        isCompleted: data.isCompleted || false,
      },
      create: {
        userId: session.user.id,
        bookId: data.bookId,
        currentPage: data.currentPage || 1,
        isCompleted: data.isCompleted || false,
      },
    });

    return NextResponse.json(progress);
  } catch (error) {
    console.error("Error updating progress:", error);
    return NextResponse.json({ error: "Failed to update progress" }, { status: 500 });
  }
}
