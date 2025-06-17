import { cn } from "@/lib/utils";
import { ForgotPassword } from "./_components/forgot-password";
import { pageProse } from "@/components/page-prose";
import { H1 } from "@/components/dialog-headings";

export default function Page() {
  return (
    <main
      className={cn(
        ...pageProse,
        "mt-20 mx-auto flex flex-col justify-center items-left w-110",
      )}
    >
      <H1>Forgot Password</H1>
      <ForgotPassword />
    </main>
  );
}
