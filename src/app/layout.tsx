import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/firebase/provider";
import { LangProvider } from "@/lib/lang-context";
import { Header } from "@/components/header";
import { Toaster } from "@/components/ui/sonner";
import { Footer } from "@/components/footer";
import { CookieBanner } from "@/components/cookie-banner";
import { Analytics } from "@vercel/analytics/react";

export const metadata: Metadata = {
  title: "IdeaSpark | AI Startup & App Generator",
  description: "Generate innovative startup ideas, business strategies, and technology stacks with AI. Turn your vision into reality with IdeaSpark.",
  keywords: ["AI startup generator", "app ideas", "business strategy", "tech stack", "IdeaSpark", "startup engine"],
  authors: [{ name: "IdeaSpark Team" }],
  openGraph: {
    title: "IdeaSpark | AI Startup Generator",
    description: "The most powerful AI tool to generate and detail your next big app idea.",
    type: "website",
    url: "https://iskraidey.com",
    siteName: "IdeaSpark",
    locale: "en_US",
    images: [
      {
        url: "https://iskraidey.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "IdeaSpark - AI Startup Idea Generator",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "IdeaSpark | AI Startup Generator",
    description: "Turn your ideas into detailed startup roadmaps with one click.",
    images: ["https://iskraidey.com/og-image.png"],
  },
  robots: "index, follow",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        style={
          {
            "--font-inter": 'system-ui, -apple-system, "Segoe UI", sans-serif',
            "--font-space-grotesk": '"Trebuchet MS", "Segoe UI", sans-serif',
          } as React.CSSProperties
        }
        className="font-sans antialiased min-h-screen flex flex-col bg-background text-foreground"
      >
        <AuthProvider>
          <LangProvider>
            <Header />
            <main className="flex-1 flex flex-col w-full">
              {children}
            </main>
            <Footer />
            <CookieBanner />
            <Toaster position="bottom-right" />
            <Analytics />
          </LangProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
