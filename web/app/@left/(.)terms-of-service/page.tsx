"use client";

import { useRouter } from "next/navigation";

import { TermsOfService } from "@/app/(marketing)/terms-of-service/component";
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
      <DialogContent initialFocus={() => null} className={cn(...dialogProse, "w-157")}>
        <TermsOfService />
      </DialogContent>
    </Dialog>
  );
}
