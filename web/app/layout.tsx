import type { Metadata } from "next";
import { Space_Mono } from "next/font/google";
import "./globals.css";
import { Fathom } from "@/components/fathom";
import { Mark } from "@/components/mark";
import { Intro } from "@/components/intro";
import { Link } from "@/components/link";
import { Providers } from "./providers";
import { INTRO_SEEN } from "@/lib/cookies";
import { cookies } from "next/headers";

const space = Space_Mono({
  variable: "--font-space",
  weight: ["400", "700"],
  subsets: ["latin"],
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
      <body className={`${space.variable} font-sans`}>
        <div className="flex fixed top-[10px] left-[10px]">
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
