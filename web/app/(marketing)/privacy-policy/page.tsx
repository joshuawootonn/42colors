import { Metadata } from "next";

import { pageProse } from "@/components/page-prose";
import { cn } from "@/lib/utils";

import { PrivacyPolicy } from "./component";

export const metadata: Metadata = {
  title: "42colors - privacy policy",
  description: "The privacy policy for 42colors",
};

export default function Page() {
  return (
    <div className={cn(...pageProse)}>
      <PrivacyPolicy />
    </div>
  );
}
