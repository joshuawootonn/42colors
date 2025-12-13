import { Metadata } from "next";

import { pageProse } from "@/components/page-prose";
import { cn } from "@/lib/utils";

import Changelog from "./component";

export const metadata: Metadata = {
  title: "42colors - changelog",
  description: "All the product changes happening to 42colors",
};

export default function Page() {
  return (
    <div className={cn(...pageProse)}>
      <Changelog />
    </div>
  );
}
