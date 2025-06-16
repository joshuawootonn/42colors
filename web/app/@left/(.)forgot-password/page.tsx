"use client";

import { cn } from "@/lib/utils";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { dialogProse } from "@/components/dialog-prose";
import { H1 } from "@/components/dialog-headings";
import { ForgotPassword } from "@/app/(auth)/forgot-password/_components/forgot-password";

export default function Page() {
  const router = useRouter();

  return (
    <Dialog open={true}>
      <DialogContent
        onInteractOutside={() => router.back()}
        className={cn(...dialogProse, "w-157")}
      >
        <H1>Forgot Password</H1>
        <ForgotPassword />
      </DialogContent>
    </Dialog>
  );
}
