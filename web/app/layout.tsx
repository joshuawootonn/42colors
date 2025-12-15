import type { Metadata } from "next";
import { Space_Mono } from "next/font/google";
import { cookies } from "next/headers";

import { Fathom } from "@/components/fathom";
import { Intro } from "@/components/intro";
import { Link } from "@/components/link";
import { Logo } from "@/components/logo";
import { Toaster } from "@/components/ui/toast";
import { INTRO_SEEN } from "@/lib/storage-keys";

import "./globals.css";
import { Providers } from "./providers";

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
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
        />
        <link rel="icon" href="/favicon.png" type="image/png" sizes="96x96" />
      </head>
      <body className={`${space.variable} font-sans`}>
        <div className="isolate">
          <div className="fixed left-[10px] top-[10px] flex border-1.5 -translate-x-[1.5px] -translate-y-[1.5px] border-black bg-background p-[5px]">
            <h1 className="flex gap-2 text-2xl font-bold">
              <Link href="/">
                <Logo />
              </Link>
            </h1>
          </div>
          {left}
          <Providers>{children}</Providers>
          <Fathom />
          <Intro defaultOpen={defaultOpen} />
          <Toaster />
        </div>
      </body>
    </html>
  );
}
