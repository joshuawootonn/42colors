"use client";

import { cn } from "@/lib/utils";
import { Dialog, DialogContent } from "./ui/dialog";
import { dialogProse } from "./dialog-prose";

import { setCookie } from "cookies-next";
import { INTRO_SEEN } from "@/lib/storage-keys";
import { About } from "@/app/(marketing)/about/component";

export function Intro({ defaultOpen }: { defaultOpen: boolean }) {
  return (
    <Dialog
      defaultOpen={defaultOpen}
      onOpenChange={(value) => {
        if (!value) {
          setCookie(INTRO_SEEN, "true");
        }
      }}
    >
      <DialogContent className={cn(...dialogProse, "w-157 pt-2")}>
        <About />
      </DialogContent>
    </Dialog>
  );
}
