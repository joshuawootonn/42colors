"use client";

import { cn } from "@/lib/utils";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { dialogProse } from "@/components/dialog-prose";
import { Signup } from "@/app/(auth)/signup/_components/signup";
import { H1 } from "@/components/dialog-headings";

export default function Page() {
  const router = useRouter();
  return (
    <Dialog
      open={true}
      onOpenChange={(next) => {
        if (next === false) {
          router.back();
        }
      }}
    >
      <DialogContent className={cn(...dialogProse, "w-100")}>
        <H1>Sign up</H1>
        <Signup />
      </DialogContent>
    </Dialog>
  );
}
