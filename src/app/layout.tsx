import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Noto_Sans_Arabic } from 'next/font/google';
import { ThemeProvider } from "@/components/ui/theme-provider";
import "./globals.css";
import SupabaseProvider from './providers';
import AuthButton from '../components/AuthButton';
import { ModeToggle } from "@/components/ui/mode-toggle";
import Image from "next/image";
// Removed unused Avatar import

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const notoSansArabic = Noto_Sans_Arabic({ subsets: ['arabic'], weight: ['400', '700'], variable: '--font-noto-sans-arabic' });

export const metadata: Metadata = {
  title: "Misbah - Hadith Finder",
  description: "AI Hadith Assistant",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} ${notoSansArabic.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SupabaseProvider>
            <header className="p-4 flex justify-between items-center max-w-7xl mx-auto">
              <div>
              <Image
                src="/misbah-logo-light.svg"
                alt="Misbah Logo"
                width={150}
                height={150}
                className=" block dark:hidden" // Show by default, hide in dark mode
              />
              {/* Dark Mode Logo */}
              <Image
                src="/misbah-logo-dark.svg"
                alt="Misbah Logo"
                width={150}
                height={150}
                className=" hidden dark:block" // Hide by default, show in dark mode
              />
              </div>
              <div className="flex items-center space-x-2"> 
                <AuthButton /> 
                <ModeToggle /> 
              </div>
            </header>
            {children}
          </SupabaseProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
