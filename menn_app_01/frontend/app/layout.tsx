import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { AuthProvider } from "../context/auth-provider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "BlogApp",
  description: "A production-ready blog platform.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body>
        {/*
          ThemeProvider from next-themes:
          - attribute="class"  → adds/removes the .dark class on <html>
          - defaultTheme="system" → reads the device/browser preference on first load
          - enableSystem → keeps listening if the user changes device theme at runtime
        */}
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
