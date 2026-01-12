"use client";

import { setCookie } from "cookies-next";

import { About } from "@/app/(marketing)/about/component";
import { INTRO_SEEN } from "@/lib/storage-keys";
import { cn } from "@/lib/utils";

import { dialogProse } from "./dialog-prose";
import { Dialog, DialogContent } from "./ui/dialog";

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
      <DialogContent initialFocus={false} className={cn(...dialogProse, "w-157 pt-2")}>
        <About />
      </DialogContent>
    </Dialog>
  );
}
