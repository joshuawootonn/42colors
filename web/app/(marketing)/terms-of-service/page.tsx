import { Metadata } from "next";
import { TermsOfService } from "./component";
import { pageProse } from "@/components/page-prose";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "42colors - terms of service",
  description: "The Terms of Service for 42colors",
};

export default function Page() {
  return (
    <main className={cn(...pageProse, "mt-10")}>
      <TermsOfService />
    </main>
  );
}
