import { Metadata } from "next";
import { cn } from "@/lib/utils";
import Changelog from "./component";
import { pageProse } from "@/components/page-prose";

export const metadata: Metadata = {
  title: "42colors - changelog",
  description: "All the product changes happening to 42colors",
};

export default function Page() {
  return (
    <main className={cn(...pageProse, "mt-10")}>
      <Changelog />
    </main>
  );
}
