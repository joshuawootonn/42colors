import { cn } from "@/lib/utils";
import { Signup } from "./_components/signup";
import { pageProse } from "@/components/page-prose";
import { H1 } from "@/components/dialog-headings";

export default function Page() {
  return (
    <main
      className={cn(
        ...pageProse,
        "mt-20 mx-auto flex flex-col justify-center items-left w-100",
      )}
    >
      <H1>Sign up</H1>
      <Signup />
    </main>
  );
}
