import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/firebase/provider";
import { LangProvider } from "@/lib/lang-context";
import { Header } from "@/components/header";
import { Toaster } from "@/components/ui/sonner";
import { Footer } from "@/components/footer";
import { CookieBanner } from "@/components/cookie-banner";
import { Analytics } from "@vercel/analytics/react";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "IdeaSpark | AI Startup & App Generator",
  description: "Generate innovative startup ideas, business strategies, and technology stacks with AI. Turn your vision into reality with IdeaSpark.",
  keywords: ["AI startup generator", "app ideas", "business strategy", "tech stack", "IdeaSpark", "startup engine"],
  authors: [{ name: "IdeaSpark Team" }],
  openGraph: {
    title: "IdeaSpark | AI Startup Generator",
    description: "The most powerful AI tool to generate and detail your next big app idea.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "IdeaSpark | AI Startup Generator",
    description: "Turn your ideas into detailed startup roadmaps with one click.",
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
        className={`${inter.variable} ${spaceGrotesk.variable} font-sans antialiased min-h-screen flex flex-col bg-background text-foreground`}
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
