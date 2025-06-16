"use client";

import { cn } from "@/lib/utils";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { dialogProse } from "@/components/dialog-prose";
import { Login } from "@/app/(auth)/login/_components/login";
import { H1 } from "@/components/dialog-headings";

export default function Page() {
  const router = useRouter();

  return (
    <Dialog open={true}>
      <DialogContent
        onInteractOutside={() => router.back()}
        className={cn(...dialogProse, "w-157")}
      >
        <H1>Log in</H1>
        <Login />
      </DialogContent>
    </Dialog>
  );
}
