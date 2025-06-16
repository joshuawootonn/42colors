import { cn } from "@/lib/utils";
import { UpdatePassword } from "./_components/signup";
import { pageProse } from "@/components/page-prose";
import { H1 } from "@/components/dialog-headings";

export default async function Page({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return (
    <main className={cn(...pageProse, "mt-10")}>
      <H1>Update password</H1>
      <UpdatePassword token={token} />
    </main>
  );
}
