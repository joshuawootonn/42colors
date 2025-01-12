import { Metadata } from "next";
import { PrivacyPolicy } from "./component";
import { pageProse } from "@/components/page-prose";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "42colors - privacy policy",
  description: "The privacy policy for 42colors",
};

export default function Page() {
  return (
    <main className={cn(...pageProse, "mt-10")}>
      <PrivacyPolicy />
    </main>
  );
}
