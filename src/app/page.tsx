"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession, signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  BookOpen,
  Upload,
  Download,
  Search,
  Library,
  User,
  Home,
  Plus,
  Eye,
  FileText,
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Settings,
  LogOut,
  Menu,
  Globe,
} from "lucide-react";
import { AuthButton } from "@/components/shared/AuthButton";

interface Book {
  id: string;
  title: string;
  description: string | null;
  author: string;
  authorId: string;
  coverImage: string | null;
  pdfUrl: string;
  pages: number;
  category: string;
  tags: string | null;
  isPublic: boolean;
  downloadCount: number;
  viewCount: number;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

interface Category {
  id: string;
  name: string;
  description: string | null;
  _count?: { books: number };
}

interface UserStats {
  totalBooks: number;
  booksRead: number;
  currentlyReading: number;
}

export default function BookPlatform() {
  const { data: session, status } = useSession();
  const [currentView, setCurrentView] = useState<"home" | "browse" | "dashboard" | "profile">("home");
  const [books, setBooks] = useState<Book[]>([]);
  const [myBooks, setMyBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isReading, setIsReading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(100);

  // Form state for book upload
  const [uploadForm, setUploadForm] = useState({
    title: "",
    description: "",
    author: "",
    category: "General",
    tags: "",
    isPublic: true,
    coverImage: null as File | null,
    pdfFile: null as File | null,
  });
  const [isUploading, setIsUploading] = useState(false);

  // Use NextAuth signIn for Google login
  const handleGoogleLogin = useCallback(() => {
    // Use NextAuth's built-in signIn which will use the correct redirect_uri
    signIn('google', { callbackUrl: '/' });
  }, []);

  // Fetch books
  const fetchBooks = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (selectedCategory !== "all") params.append("category", selectedCategory);

      const response = await fetch(`/api/books?${params}`);
      const data = await response.json();
      setBooks(data);
    } catch (error) {
      toast.error("Failed to fetch books");
    }
  }, [searchQuery, selectedCategory]);

  // Fetch user's books
  const fetchMyBooks = useCallback(async () => {
    if (!session?.user?.id) return;
    try {
      const response = await fetch(`/api/books?userId=${session.user.id}`);
      const data = await response.json();
      setMyBooks(data);
    } catch (error) {
      toast.error("Failed to fetch your books");
    }
  }, [session?.user?.id]);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch("/api/categories");
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error("Failed to fetch categories");
    }
  }, []);

  // Fetch user stats
  const fetchUserStats = useCallback(async () => {
    if (!session?.user?.id) return;
    try {
      const response = await fetch("/api/user");
      const data = await response.json();
      setUserStats(data.stats);
    } catch (error) {
      console.error("Failed to fetch user stats");
    }
  }, [session?.user?.id]);

  useEffect(() => {
    fetchBooks();
    fetchCategories();
  }, [fetchBooks, fetchCategories]);

  useEffect(() => {
    if (session?.user?.id) {
      fetchMyBooks();
      fetchUserStats();
    }
  }, [session?.user?.id, fetchMyBooks, fetchUserStats]);

  // Handle file upload
  const handleFileUpload = async (file: File, type: "pdf" | "cover") => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) throw new Error("Upload failed");
    return await response.json();
  };

  // Handle book submission
  const handleSubmitBook = async () => {
    if (!uploadForm.title || !uploadForm.pdfFile) {
      toast.error("Please fill in the title and upload a PDF file");
      return;
    }

    setIsUploading(true);
    try {
      // Upload PDF
      const pdfResult = await handleFileUpload(uploadForm.pdfFile, "pdf");
      
      // Upload cover if provided
      let coverUrl = null;
      if (uploadForm.coverImage) {
        const coverResult = await handleFileUpload(uploadForm.coverImage, "cover");
        coverUrl = coverResult.url;
      }

      // Create book record
      const response = await fetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: uploadForm.title,
          description: uploadForm.description,
          author: uploadForm.author,
          category: uploadForm.category,
          tags: uploadForm.tags,
          isPublic: uploadForm.isPublic,
          pdfUrl: pdfResult.url,
          coverImage: coverUrl,
          pages: 100,
        }),
      });

      if (response.ok) {
        toast.success("Book uploaded successfully!");
        setIsUploadModalOpen(false);
        setUploadForm({
          title: "",
          description: "",
          author: "",
          category: "General",
          tags: "",
          isPublic: true,
          coverImage: null,
          pdfFile: null,
        });
        fetchMyBooks();
        fetchBooks();
      } else {
        throw new Error("Failed to create book");
      }
    } catch (error) {
      toast.error("Failed to upload book");
    } finally {
      setIsUploading(false);
    }
  };

  // Handle book deletion
  const handleDeleteBook = async (bookId: string) => {
    if (!confirm("Are you sure you want to delete this book?")) return;
    
    try {
      const response = await fetch(`/api/books?id=${bookId}`, { method: "DELETE" });
      if (response.ok) {
        toast.success("Book deleted successfully");
        fetchMyBooks();
        fetchBooks();
      }
    } catch (error) {
      toast.error("Failed to delete book");
    }
  };

  // Handle download
  const handleDownload = async (book: Book) => {
    try {
      const link = document.createElement("a");
      link.href = book.pdfUrl;
      link.download = `${book.title}.pdf`;
    link.click();
    
    toast.success("Download started!");
    } catch (error) {
      toast.error("Download failed");
    }
  };

  // Start reading
  const startReading = (book: Book) => {
    setSelectedBook(book);
    setIsReading(true);
    setTotalPages(book.pages || 10);
    setCurrentPage(1);
  };

  // Navigation component
  const Navigation = () => (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => { setCurrentView("home"); setIsReading(false); }}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              BookShelf
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
            <Button
              variant={currentView === "home" ? "default" : "ghost"}
              onClick={() => { setCurrentView("home"); setIsReading(false); }}
              className={currentView === "home" ? "bg-emerald-500 hover:bg-emerald-600" : ""}
            >
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
            <Button
              variant={currentView === "browse" ? "default" : "ghost"}
              onClick={() => { setCurrentView("browse"); setIsReading(false); }}
              className={currentView === "browse" ? "bg-emerald-500 hover:bg-emerald-600" : ""}
            >
              <Library className="w-4 h-4 mr-2" />
              Browse
            </Button>
            {session && (
              <>
                <Button
                  variant={currentView === "dashboard" ? "default" : "ghost"}
                  onClick={() => { setCurrentView("dashboard"); setIsReading(false); }}
                  className={currentView === "dashboard" ? "bg-emerald-500 hover:bg-emerald-600" : ""}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  My Books
                </Button>
                <Button
                  variant={currentView === "profile" ? "default" : "ghost"}
                  onClick={() => { setCurrentView("profile"); setIsReading(false); }}
                  className={currentView === "profile" ? "bg-emerald-500 hover:bg-emerald-600" : ""}
                >
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </Button>
              </>
            )}
          </div>

          {/* Auth / Mobile Menu */}
          <div className="flex items-center gap-4">
            {session && (
              <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 hidden sm:flex">
                    <Plus className="w-4 h-4 mr-2" />
                    Upload Book
                  </Button>
                </DialogTrigger>
              </Dialog>
            )}
            <AuthButton onGoogleLogin={handleGoogleLogin} />
            
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <Menu className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 p-4 space-y-2">
          <Button
            variant={currentView === "home" ? "default" : "ghost"}
            onClick={() => { setCurrentView("home"); setIsMobileMenuOpen(false); setIsReading(false); }}
            className="w-full justify-start"
          >
            <Home className="w-4 h-4 mr-2" />
            Home
          </Button>
          <Button
            variant={currentView === "browse" ? "default" : "ghost"}
            onClick={() => { setCurrentView("browse"); setIsMobileMenuOpen(false); setIsReading(false); }}
            className="w-full justify-start"
          >
            <Library className="w-4 h-4 mr-2" />
            Browse
          </Button>
          {session && (
            <>
              <Button
                variant={currentView === "dashboard" ? "default" : "ghost"}
                onClick={() => { setCurrentView("dashboard"); setIsMobileMenuOpen(false); setIsReading(false); }}
                className="w-full justify-start"
              >
                <FileText className="w-4 h-4 mr-2" />
                My Books
              </Button>
              <Button
                variant={currentView === "profile" ? "default" : "ghost"}
                onClick={() => { setCurrentView("profile"); setIsMobileMenuOpen(false); setIsReading(false); }}
                className="w-full justify-start"
              >
                <User className="w-4 h-4 mr-2" />
                Profile
              </Button>
              <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full bg-gradient-to-r from-emerald-500 to-teal-500">
                    <Plus className="w-4 h-4 mr-2" />
                    Upload Book
                  </Button>
                </DialogTrigger>
              </Dialog>
            </>
          )}
        </div>
      )}
    </nav>
  );

  // PDF Viewer Component
  const PDFViewer = () => {
    if (!selectedBook) return null;

    return (
      <div className="fixed inset-0 z-50 bg-gray-900 flex flex-col">
        {/* Header */}
        <div className="bg-gray-800 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              className="text-white hover:bg-gray-700"
              onClick={() => setIsReading(false)}
            >
              <X className="w-5 h-5 mr-2" />
              Close
            </Button>
            <h2 className="text-lg font-semibold truncate max-w-md">{selectedBook.title}</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-gray-700"
                onClick={() => setZoomLevel(Math.max(50, zoomLevel - 10))}
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-sm">{zoomLevel}%</span>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-gray-700"
                onClick={() => setZoomLevel(Math.min(200, zoomLevel + 10))}
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
            </div>
            <Button
              variant="ghost"
              className="text-white hover:bg-gray-700"
              onClick={() => handleDownload(selectedBook)}
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </div>
        </div>

        {/* PDF Content */}
        <div className="flex-1 flex items-center justify-center overflow-auto p-4">
          <div
            className="bg-white shadow-2xl transition-transform duration-200"
            style={{ transform: `scale(${zoomLevel / 100})` }}
          >
            <div className="w-[595px] h-[842px] bg-white p-12 flex flex-col">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">{selectedBook.title}</h1>
                <p className="text-lg text-gray-600">by {selectedBook.author}</p>
              </div>
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <FileText className="w-16 h-16 mx-auto mb-4" />
                  <p className="text-lg">Page {currentPage} of {totalPages}</p>
                  <p className="text-sm mt-2">
                    This is a demo PDF viewer. In production, use react-pdf for actual PDF rendering.
                  </p>
                  <p className="text-sm mt-4 text-gray-400">
                    PDF URL: {selectedBook.pdfUrl}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-800 text-white p-4 flex items-center justify-between">
          <Button
            variant="ghost"
            className="text-white hover:bg-gray-700"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
          >
            <ChevronLeft className="w-5 h-5 mr-2" />
            Previous
          </Button>
          <div className="flex items-center gap-4">
            <span>Page {currentPage} of {totalPages}</span>
            <Progress value={(currentPage / totalPages) * 100} className="w-32" />
          </div>
          <Button
            variant="ghost"
            className="text-white hover:bg-gray-700"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
          >
            Next
            <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    );
  };

  // Upload Modal
  const UploadModal = () => (
    <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Upload a New Book</DialogTitle>
          <DialogDescription>
            Share your book with the community or keep it private.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="Enter book title"
              value={uploadForm.title}
              onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="author">Author</Label>
            <Input
              id="author"
              placeholder="Enter author name"
              value={uploadForm.author}
              onChange={(e) => setUploadForm({ ...uploadForm, author: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Enter book description"
              value={uploadForm.description}
              onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={uploadForm.category}
                onValueChange={(value) => setUploadForm({ ...uploadForm, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="General">General</SelectItem>
                  <SelectItem value="Fiction">Fiction</SelectItem>
                  <SelectItem value="Non-Fiction">Non-Fiction</SelectItem>
                  <SelectItem value="Science">Science</SelectItem>
                  <SelectItem value="Technology">Technology</SelectItem>
                  <SelectItem value="Business">Business</SelectItem>
                  <SelectItem value="Self-Help">Self-Help</SelectItem>
                  <SelectItem value="Education">Education</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="visibility">Visibility</Label>
              <Select
                value={uploadForm.isPublic ? "public" : "private"}
                onValueChange={(value) => setUploadForm({ ...uploadForm, isPublic: value === "public" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select visibility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      Public
                    </div>
                  </SelectItem>
                  <SelectItem value="private">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Private
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma separated)</Label>
            <Input
              id="tags"
              placeholder="e.g., programming, technology, guide"
              value={uploadForm.tags}
              onChange={(e) => setUploadForm({ ...uploadForm, tags: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cover">Cover Image</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              <input
                id="cover"
                type="file"
                accept="image/*"
                onChange={(e) => setUploadForm({ ...uploadForm, coverImage: e.target.files?.[0] || null })}
                className="w-full"
              />
              {uploadForm.coverImage && (
                <p className="text-sm text-emerald-600 mt-2">Selected: {uploadForm.coverImage.name}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pdf">PDF File *</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              <input
                id="pdf"
                type="file"
                accept=".pdf"
                onChange={(e) => setUploadForm({ ...uploadForm, pdfFile: e.target.files?.[0] || null })}
                className="w-full"
              />
              {uploadForm.pdfFile && (
                <p className="text-sm text-emerald-600 mt-2">Selected: {uploadForm.pdfFile.name}</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={() => setIsUploadModalOpen(false)}>
            Cancel
          </Button>
          <Button
            className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
            onClick={handleSubmitBook}
            disabled={isUploading}
          >
            {isUploading ? "Uploading..." : "Upload Book"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  // Book Card Component
  const BookCard = ({ book, showActions = false }: { book: Book; showActions?: boolean }) => (
    <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      <div className="aspect-[3/4] bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
        {book.coverImage ? (
          <img
            src={book.coverImage}
            alt={book.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-500 to-teal-600">
            <BookOpen className="w-16 h-16 text-white/80" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
          <Button
            size="sm"
            className="bg-white text-gray-900 hover:bg-gray-100"
            onClick={() => startReading(book)}
          >
            <Eye className="w-4 h-4 mr-2" />
            Read
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="bg-transparent border-white text-white hover:bg-white/20"
            onClick={() => handleDownload(book)}
          >
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <CardHeader className="p-4">
        <CardTitle className="text-lg line-clamp-1">{book.title}</CardTitle>
        <CardDescription className="line-clamp-1">by {book.author}</CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <p className="text-sm text-gray-600 line-clamp-2">{book.description || "No description available"}</p>
        <div className="flex flex-wrap gap-1 mt-3">
          <Badge variant="secondary" className="text-xs">{book.category}</Badge>
          {book.tags?.split(",").slice(0, 2).map((tag, i) => (
            <Badge key={i} variant="outline" className="text-xs">{tag.trim()}</Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between items-center text-sm text-gray-500">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Eye className="w-4 h-4" />
            {book.viewCount}
          </span>
          <span className="flex items-center gap-1">
            <Download className="w-4 h-4" />
            {book.downloadCount}
          </span>
        </div>
        {showActions && session?.user?.id === book.authorId && (
          <Button
            variant="ghost"
            size="sm"
            className="text-red-500 hover:text-red-700 hover:bg-red-50"
            onClick={() => handleDeleteBook(book.id)}
          >
            Delete
          </Button>
        )}
      </CardFooter>
    </Card>
  );

  // Hero Section
  const HeroSection = () => (
    <section className="relative py-20 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-teal-50" />
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-emerald-100/50 to-transparent" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div>
              <Badge className="mb-4 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                🚀 New Platform Launch
              </Badge>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Discover, Read & Share{" "}
                <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  Amazing Books
                </span>
              </h1>
              <p className="mt-6 text-xl text-gray-600 leading-relaxed">
                Join our community of book lovers. Upload your books, discover new reads, and connect with fellow readers from around the world.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              {!session ? (
                <>
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-lg px-8"
                    onClick={() => setCurrentView("browse")}
                  >
                    <Library className="w-5 h-5 mr-2" />
                    Browse Books
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="text-lg px-8 border-2"
                    onClick={handleGoogleLogin}
                  >
                    Sign in with Google
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-lg px-8"
                    onClick={() => setCurrentView("browse")}
                  >
                    <Library className="w-5 h-5 mr-2" />
                    Browse Library
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="text-lg px-8 border-2"
                    onClick={() => setIsUploadModalOpen(true)}
                  >
                    <Upload className="w-5 h-5 mr-2" />
                    Upload Your Book
                  </Button>
                </>
              )}
            </div>

            <div className="grid grid-cols-3 gap-6 pt-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-emerald-600">{books.length}+</div>
                <div className="text-sm text-gray-600">Books Available</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-teal-600">Free</div>
                <div className="text-sm text-gray-600">To Read</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">∞</div>
                <div className="text-sm text-gray-600">Possibilities</div>
              </div>
            </div>
          </div>

          <div className="hidden lg:block relative">
            <div className="absolute -top-10 -left-10 w-72 h-72 bg-emerald-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse" />
            <div className="absolute -bottom-10 -right-10 w-72 h-72 bg-teal-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse delay-1000" />
            <div className="relative grid grid-cols-2 gap-4">
              {books.slice(0, 4).map((book, i) => (
                <div
                  key={book.id}
                  className={`transform ${i % 2 === 0 ? "translate-y-8" : ""} hover:scale-105 transition-transform duration-300`}
                >
                  <div className="aspect-[3/4] rounded-lg overflow-hidden shadow-xl">
                    {book.coverImage ? (
                      <img src={book.coverImage} alt={book.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                        <BookOpen className="w-12 h-12 text-white" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {books.length === 0 && (
                <>
                  <div className="aspect-[3/4] rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 shadow-xl transform translate-y-8 flex items-center justify-center">
                    <BookOpen className="w-12 h-12 text-white" />
                  </div>
                  <div className="aspect-[3/4] rounded-lg bg-gradient-to-br from-teal-400 to-cyan-500 shadow-xl flex items-center justify-center">
                    <BookOpen className="w-12 h-12 text-white" />
                  </div>
                  <div className="aspect-[3/4] rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 shadow-xl flex items-center justify-center">
                    <BookOpen className="w-12 h-12 text-white" />
                  </div>
                  <div className="aspect-[3/4] rounded-lg bg-gradient-to-br from-blue-400 to-indigo-500 shadow-xl transform translate-y-8 flex items-center justify-center">
                    <BookOpen className="w-12 h-12 text-white" />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );

  // Featured Books Section
  const FeaturedBooks = () => (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Featured Books</h2>
            <p className="text-gray-600 mt-2">Discover our most popular reads</p>
          </div>
          <Button variant="outline" onClick={() => setCurrentView("browse")}>
            View All
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        {books.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No books yet</h3>
            <p className="text-gray-500 mb-6">Be the first to upload a book!</p>
            {session && (
              <Button
                className="bg-gradient-to-r from-emerald-500 to-teal-500"
                onClick={() => setIsUploadModalOpen(true)}
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Your First Book
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {books.slice(0, 5).map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        )}
      </div>
    </section>
  );

  // Categories Section
  const CategoriesSection = () => (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Browse by Category</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {["Fiction", "Non-Fiction", "Science", "Technology", "Business", "Self-Help", "Education", "General"].map((category) => {
            const count = books.filter((b) => b.category === category).length;
            return (
              <Card
                key={category}
                className="cursor-pointer hover:border-emerald-500 hover:shadow-lg transition-all duration-300"
                onClick={() => {
                  setSelectedCategory(category);
                  setCurrentView("browse");
                }}
              >
                <CardContent className="p-6 text-center">
                  <BookOpen className="w-8 h-8 mx-auto mb-3 text-emerald-500" />
                  <h3 className="font-semibold text-gray-900">{category}</h3>
                  <p className="text-sm text-gray-500">{count} books</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );

  // Browse View
  const BrowseView = () => (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Search books, authors, or keywords..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="Fiction">Fiction</SelectItem>
            <SelectItem value="Non-Fiction">Non-Fiction</SelectItem>
            <SelectItem value="Science">Science</SelectItem>
            <SelectItem value="Technology">Technology</SelectItem>
            <SelectItem value="Business">Business</SelectItem>
            <SelectItem value="Self-Help">Self-Help</SelectItem>
            <SelectItem value="Education">Education</SelectItem>
            <SelectItem value="General">General</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {books.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No books found</h3>
          <p className="text-gray-500">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {books.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      )}
    </div>
  );

  // Dashboard View
  const DashboardView = () => {
    if (!session) {
      return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Sign in to access your dashboard</h3>
          <p className="text-gray-500 mb-6">Manage your books and track your reading progress</p>
          <Button className="bg-gradient-to-r from-emerald-500 to-teal-500" onClick={handleGoogleLogin}>
            Sign in with Google
          </Button>
        </div>
      );
    }

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid sm:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">My Books</p>
                  <p className="text-2xl font-bold text-gray-900">{userStats?.totalBooks || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center">
                  <Eye className="w-6 h-6 text-teal-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Currently Reading</p>
                  <p className="text-2xl font-bold text-gray-900">{userStats?.currentlyReading || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-cyan-100 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-cyan-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Books Read</p>
                  <p className="text-2xl font-bold text-gray-900">{userStats?.booksRead || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">My Books</h2>
          <Button
            className="bg-gradient-to-r from-emerald-500 to-teal-500"
            onClick={() => setIsUploadModalOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Upload New Book
          </Button>
        </div>

        {myBooks.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-gray-300 rounded-lg">
            <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No books uploaded yet</h3>
            <p className="text-gray-500 mb-6">Share your first book with the community!</p>
            <Button className="bg-gradient-to-r from-emerald-500 to-teal-500" onClick={() => setIsUploadModalOpen(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Upload Your First Book
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {myBooks.map((book) => (
              <BookCard key={book.id} book={book} showActions />
            ))}
          </div>
        )}
      </div>
    );
  };

  // Profile View
  const ProfileView = () => {
    if (!session) {
      return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Please sign in</h3>
          <Button className="bg-gradient-to-r from-emerald-500 to-teal-500" onClick={handleGoogleLogin}>
            Sign in with Google
          </Button>
        </div>
      );
    }

    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Profile Settings</CardTitle>
            <CardDescription>Manage your account settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white text-2xl font-bold">
                {session.user?.name?.charAt(0).toUpperCase() || "U"}
              </div>
              <div>
                <h3 className="text-xl font-semibold">{session.user?.name}</h3>
                <p className="text-gray-500">{session.user?.email}</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4 pt-6">
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-emerald-600">{userStats?.totalBooks || 0}</p>
                <p className="text-sm text-gray-600">Books Uploaded</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-teal-600">{userStats?.currentlyReading || 0}</p>
                <p className="text-sm text-gray-600">Reading</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-cyan-600">{userStats?.booksRead || 0}</p>
                <p className="text-sm text-gray-600">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Footer
  const Footer = () => (
    <footer className="bg-gray-900 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold">BookShelf</span>
            </div>
            <p className="text-gray-400">
              Discover, read, and share amazing books with readers from around the world.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-gray-400">
              <li><button onClick={() => setCurrentView("home")} className="hover:text-white transition">Home</button></li>
              <li><button onClick={() => setCurrentView("browse")} className="hover:text-white transition">Browse</button></li>
              <li><button onClick={() => setCurrentView("dashboard")} className="hover:text-white transition">Dashboard</button></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Categories</h4>
            <ul className="space-y-2 text-gray-400">
              <li><button onClick={() => { setSelectedCategory("Fiction"); setCurrentView("browse"); }} className="hover:text-white transition">Fiction</button></li>
              <li><button onClick={() => { setSelectedCategory("Non-Fiction"); setCurrentView("browse"); }} className="hover:text-white transition">Non-Fiction</button></li>
              <li><button onClick={() => { setSelectedCategory("Technology"); setCurrentView("browse"); }} className="hover:text-white transition">Technology</button></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Stay Connected</h4>
            <p className="text-gray-400">Join our community of book lovers.</p>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>© {new Date().getFullYear()} BookShelf. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navigation />
      
      <main className="flex-1 pt-16">
        {isReading ? (
          <PDFViewer />
        ) : (
          <>
            {currentView === "home" && (
              <>
                <HeroSection />
                <FeaturedBooks />
                <CategoriesSection />
              </>
            )}
            {currentView === "browse" && <BrowseView />}
            {currentView === "dashboard" && <DashboardView />}
            {currentView === "profile" && <ProfileView />}
          </>
        )}
      </main>

      {!isReading && <Footer />}
      <UploadModal />
    </div>
  );
}
