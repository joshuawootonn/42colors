import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Fathom } from "@/components/fathom";
import { Footer } from "@/components/footer";
import Link from "next/link";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
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
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="flex fixed top-3 left-3">
          <Link href="/">
            <h1 className="text-2xl font-bold">42colors</h1>
          </Link>
        </div>
        {children}

        <Fathom />
        <Footer />
      </body>
    </html>
  );
}
