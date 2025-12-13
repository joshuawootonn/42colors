"use client";

import { useRouter } from "next/navigation";

import { Signup } from "@/app/(auth)/signup/_components/signup";
import { H1 } from "@/components/dialog-headings";
import { dialogProse } from "@/components/dialog-prose";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

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
