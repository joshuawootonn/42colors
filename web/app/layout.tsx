import type { Metadata } from "next";
import localFont from "next/font/local";
import { Lexend_Deca } from "next/font/google";
import "./globals.css";
import { Fathom } from "@/components/fathom";
import { Mark } from "@/components/mark";
import { Intro } from "@/components/intro";
import { Link } from "@/components/link";
import { Providers } from "./providers";
import { INTRO_SEEN } from "@/lib/cookies";
import { cookies } from "next/headers";

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

export default async function RootLayout({
  left,
  children,
}: Readonly<{
  left: React.ReactNode;
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get(INTRO_SEEN)?.value !== "true";
  return (
    <html lang="en">
      <body
        className={`${lexendDeca.variable} ${geistMono.variable} antialiased font-sans`}
      >
        <div className="flex fixed top-3 left-3">
          <h1 className="text-2xl font-bold flex gap-2">
            <Link href="/">
              <Mark />
            </Link>
          </h1>
        </div>
        {left}
        <Providers>{children}</Providers>

        <Fathom />
        <Intro defaultOpen={defaultOpen} />
      </body>
    </html>
  );
}
