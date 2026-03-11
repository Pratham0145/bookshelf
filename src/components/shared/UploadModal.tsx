"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Globe, User, Plus, Upload } from "lucide-react";

interface UploadModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (data: {
    title: string;
    description: string;
    author: string;
    category: string;
    tags: string;
    isPublic: boolean;
    pdfFile: File | null;
    coverImage: File | null;
  }) => Promise<void>;
}

export function UploadModal({ isOpen, onOpenChange, onUpload }: UploadModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [author, setAuthor] = useState("");
  const [category, setCategory] = useState("General");
  const [tags, setTags] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleSubmit = async () => {
    if (!title || !pdfFile) {
      toast.error("Please fill in the title and upload a PDF file");
      return;
    }

    setIsUploading(true);
    try {
      await onUpload({
        title,
        description,
        author,
        category,
        tags,
        isPublic,
        pdfFile,
        coverImage,
      });
      
      // Reset form
      setTitle("");
      setDescription("");
      setAuthor("");
      setCategory("General");
      setTags("");
      setIsPublic(true);
      setCoverImage(null);
      setPdfFile(null);
      
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to upload book");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
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
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="author">Author</Label>
            <Input
              id="author"
              placeholder="Enter author name"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Enter book description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
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
                value={isPublic ? "public" : "private"}
                onValueChange={(value) => setIsPublic(value === "public")}
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
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cover">Cover Image</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              <input
                id="cover"
                type="file"
                accept="image/*"
                onChange={(e) => setCoverImage(e.target.files?.[0] || null)}
                className="w-full"
              />
              {coverImage && (
                <p className="text-sm text-emerald-600 mt-2">Selected: {coverImage.name}</p>
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
                onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                className="w-full"
              />
              {pdfFile && (
                <p className="text-sm text-emerald-600 mt-2">Selected: {pdfFile.name}</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
            onClick={handleSubmit}
            disabled={isUploading}
          >
            {isUploading ? "Uploading..." : "Upload Book"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
