"use client";

import { cn } from "@/lib/utils";

import { H1 } from "./dialog-headings";
import { dialogProse } from "./dialog-prose";
import { Link } from "./link";
import { Dialog, DialogContent } from "./ui/dialog";

export function WebGPUWarning() {
  return (
    <Dialog defaultOpen={true} onOpenChange={() => window.location.reload()}>
      <DialogContent className={cn(...dialogProse, "w-157 pt-2")}>
        <H1>WebGPU initialization failed</H1>
        <p className="mb-2">
          Currently an API I&apos;m using called{" "}
          <Link href="https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API">WebGPU</Link> is
          only supported out of the box in Chrome.{" "}
          <Link href="https://caniuse.com/webgpu">caniuse.com/webgpu</Link> mentions you can toggle
          feature flags for this API in Firefox and Safari, but for now I jumping over to a chromium
          based browser 🙏
        </p>
      </DialogContent>
    </Dialog>
  );
}
