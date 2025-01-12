import type { Metadata } from "next";
import localFont from "next/font/local";
import { Lexend_Deca } from "next/font/google";
import "./globals.css";
import { Fathom } from "@/components/fathom";
import { Footer } from "@/components/footer";
import Link from "next/link";

const lexendDeca = Lexend_Deca({
  variable: "--font-lexend-deca",
  subsets: ["latin"],
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "42colors",
  description: "....",
};

export default function RootLayout({
  left,
  children,
}: Readonly<{
  left: React.ReactNode;
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${lexendDeca.variable} ${geistMono.variable} antialiased font-sans`}
      >
        <div className="flex fixed top-3 left-3">
          <Link href="/">
            <h1 className="text-2xl font-bold">42colors</h1>
          </Link>
        </div>
        {left}
        {children}

        <Fathom />
        <Footer />
      </body>
    </html>
  );
}
