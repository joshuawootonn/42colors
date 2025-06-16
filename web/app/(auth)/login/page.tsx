import { cn } from "@/lib/utils";
import { Login } from "./_components/login";
import { pageProse } from "@/components/page-prose";
import { H1 } from "@/components/dialog-headings";

export default function Page() {
  return (
    <main className={cn(...pageProse, "mt-10")}>
      <H1>Log in</H1>
      <Login />
    </main>
  );
}
