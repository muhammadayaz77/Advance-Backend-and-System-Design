import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../context/auth-provider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "AuthFlow — Secure Authentication",
  description:
    "A production-ready authentication system with email/password and Google OAuth.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
