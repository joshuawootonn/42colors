"use client";

import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogTitle } from "./ui/dialog";
import { dialogProse } from "./dialog-prose";
import { Logo } from "./logo";
import { Link } from "./link";

import { setCookie } from "cookies-next";
import { INTRO_SEEN } from "@/lib/cookies";

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
      <DialogContent
        className={cn(
          ...dialogProse,
          "w-157 left-[unset] top-[unset] translate-x-0 translate-y-0 bottom-5 right-5 pt-2",
        )}
      >
        <DialogTitle asChild>
          <h1 className="">
            <i>Welcome</i> to{" "}
            <Logo height={40} className="inline -translate-y-1" />
          </h1>
        </DialogTitle>
        <p>a pixel art editor and game</p>
        <p>
          <b>Vision: </b> You start with a grant for ten thousand pixels. After
          surveying the canvas, your first goal will be to claim some land.
          Next, It&apos;s time to draw (something dope of course). When you are
          done, people can upvote or downvote your art, which decides whether
          you get more pixels or not. Pixels are currency.{" "}
        </p>

        <p>
          <b>Status: </b> This project is a WIP. My energy has been going to
          learning elixir, postgis, and how to make a performant canvas.
          Don&apos;t judge me for the pencil tool just yet hahaha.
        </p>

        <p>
          I can&apos;t wait to see the art people create under the same
          constraints. Follow along on{" "}
          <Link href="https://x.com/JoshWootonn">twitter</Link> or{" "}
          <Link href="https://github.com/joshuawootonn/42colors">github</Link>.
        </p>
      </DialogContent>
    </Dialog>
  );
}
