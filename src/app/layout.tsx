import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { SessionProvider } from "@/components/shared/SessionProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BookShelf - Discover, Read & Share Amazing Books",
  description: "Join our community of book lovers. Upload your books, discover new reads, and connect with fellow readers from around the world.",
  keywords: ["Books", "Reading", "Library", "PDF", "E-books", "Book Platform"],
  authors: [{ name: "BookShelf Team" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "BookShelf - Book Reading Platform",
    description: "Discover, read, and share amazing books with readers worldwide",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BookShelf - Book Reading Platform",
    description: "Discover, read, and share amazing books with readers worldwide",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <SessionProvider>
          {children}
        </SessionProvider>
        <Toaster />
      </body>
    </html>
  );
}
