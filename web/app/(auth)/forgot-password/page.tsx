import { H1 } from "@/components/dialog-headings";
import { pageProse } from "@/components/page-prose";
import { cn } from "@/lib/utils";

import { ForgotPassword } from "./_components/forgot-password";

export default function Page() {
  return (
    <main
      className={cn(...pageProse, "items-left mx-auto mt-20 flex w-110 flex-col justify-center")}
    >
      <H1>Forgot Password</H1>
      <ForgotPassword />
    </main>
  );
}
