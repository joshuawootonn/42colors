import { H1 } from "@/components/dialog-headings";
import { pageProse } from "@/components/page-prose";
import { cn } from "@/lib/utils";

import { Signup } from "./_components/signup";

export default function Page() {
  return (
    <main
      className={cn(...pageProse, "items-left mx-auto mt-20 flex w-100 flex-col justify-center")}
    >
      <H1>Sign up</H1>
      <Signup />
    </main>
  );
}
