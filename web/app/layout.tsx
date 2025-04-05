import type { Metadata } from "next";
import { Space_Mono } from "next/font/google";
import "./globals.css";
import { Fathom } from "@/components/fathom";
import { Intro } from "@/components/intro";
import { Link } from "@/components/link";
import { Providers } from "./providers";
import { INTRO_SEEN } from "@/lib/cookies";
import { cookies } from "next/headers";
import { Toaster } from "sonner";
import { Logo } from "@/components/logo";

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
      </head>
      <body className={`${space.variable} font-sans`}>
        <div className="flex fixed top-[10px] left-[10px]">
          <h1 className="text-2xl font-bold flex gap-2">
            <Link href="/">
              <Logo />
            </Link>
          </h1>
        </div>
        {left}
        <Providers>{children}</Providers>
        <Fathom />
        <Intro defaultOpen={defaultOpen} />
        <Toaster
          className="w-96"
          // @ts-expect-error just trying to set an "unknown property"
          style={{ "--width": "380px" }}
          offset={12}
          gap={12}
          position="bottom-center"
          expand
        />
      </body>
    </html>
  );
}
