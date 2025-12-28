import { format } from "date-fns";

import { H1 } from "@/components/dialog-headings";
import { Link } from "@/components/ui/link";

import { changelogUpdatedAt } from "./updated-at";

function DateComponent({ date }: { date: Date }) {
  return (
    <time className={"font-bold text-primary"} dateTime={format(date, "yyyy-MM-dd")}>
      {format(date, "LLLL do")}
    </time>
  );
}

export default function Changelog() {
  return (
    <>
      <div className="mb-10 flex items-center justify-between">
        <H1>changelog</H1>
        <span className="text-primary">
          (Updated <DateComponent date={changelogUpdatedAt} />)
        </span>
      </div>
      <p>A list of all that&apos;s new and improved in 42colors.</p>
      <hr className="w-full border-t-2 border-border" />
      <ul>
        <li>
          <DateComponent date={new Date("12/28/2025")} /> - Created a user profile popover so you
          can easily see the plots of other users.
          <br />
          <ul>
            <li>
              Note: with this change I introduced the concept of a username. Your username is public
              information and allows people to recognize you without identifying who you are IRL.
              When you first create an account, you're given a username like{" "}
              <code>transparent123</code>, but very soon you'll be able to customize this.
            </li>
            <li>
              Within the plot popover, you can click on usernames to open the profile popover.
              <video
                src="/changelog/25-12-28-profile-popover.mp4"
                muted
                controls
                className="mt-4 border border-border"
              />
            </li>
            <li>
              {" "}
              This new popover allows you to see all of the plots created by a user, and will soon
              include information about their popularity and stats over time.
              <video
                src="/changelog/25-12-28-iterating-profile-plots.mp4"
                muted
                controls
                className="mt-4 border border-border"
              />
            </li>
            <li>
              I also created an expandable section on the selection popover so you can see both the
              description and creator of the plot.
              <video
                src="/changelog/25-12-28-selection-description.mp4"
                muted
                controls
                className="mt-4 border border-border"
              />
            </li>
          </ul>
        </li>
        <li>
          <DateComponent date={new Date("12/21/2025")} /> - Designed a new color palette with names
          and hex codes for better usability. The darks were too dark, and there were a lot of gaps
          in the palette. This palette will hopefully fix that 🤞
          <div className="mt-2 mb-6 space-y-6">
            <div className="flex gap-4 justify-start">
              <div>
                <h4 className="mb-2 font-bold">Old Palette</h4>
                <div className="grid grid-cols-4 gap-0.5">
                  {[
                    { id: 3, hex: "#b7c4cc" },
                    { id: 4, hex: "#7a7c8a" },
                    { id: 5, hex: "#3d3a4a" },
                    { id: 6, hex: "#171622" },
                    { id: 7, hex: "#ccbfab" },
                    { id: 8, hex: "#8a716f" },
                    { id: 9, hex: "#4a333d" },
                    { id: 10, hex: "#221524" },
                    { id: 11, hex: "#dda980" },
                    { id: 12, hex: "#a4644a" },
                    { id: 13, hex: "#60302c" },
                    { id: 14, hex: "#301117" },
                    { id: 15, hex: "#ff947d" },
                    { id: 16, hex: "#f23722" },
                    { id: 17, hex: "#8c1d32" },
                    { id: 18, hex: "#3c0b22" },
                    { id: 19, hex: "#ffb45f" },
                    { id: 20, hex: "#f36f1c" },
                    { id: 21, hex: "#87381d" },
                    { id: 22, hex: "#3d1212" },
                    { id: 23, hex: "#f6f04a" },
                    { id: 24, hex: "#cead19" },
                    { id: 25, hex: "#6f5922" },
                    { id: 26, hex: "#39230f" },
                    { id: 27, hex: "#a0ff78" },
                    { id: 28, hex: "#3ecb2b" },
                    { id: 29, hex: "#1a6636" },
                    { id: 30, hex: "#062622" },
                    { id: 31, hex: "#84eeff" },
                    { id: 32, hex: "#299be2" },
                    { id: 33, hex: "#274fa2" },
                    { id: 34, hex: "#0f1b4d" },
                    { id: 35, hex: "#ff98fc" },
                    { id: 36, hex: "#bc2fe3" },
                    { id: 37, hex: "#5e198e" },
                    { id: 38, hex: "#231047" },
                    { id: 39, hex: "#ff9494" },
                    { id: 40, hex: "#f11985" },
                    { id: 41, hex: "#88126f" },
                    { id: 42, hex: "#3f0d43" },
                    { id: 1, hex: "#000000" },
                    { id: 2, hex: "#ffffff" },
                  ].map((color) => (
                    <div key={`v1-${color.id}`} className="group relative">
                      <div
                        className="size-8 border-1.5 border-border bg-white"
                        style={{
                          backgroundColor: color.hex,
                          backgroundImage:
                            color.hex === "transparent"
                              ? "linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc)"
                              : undefined,
                          backgroundSize: color.hex === "transparent" ? "10px 10px" : undefined,
                          backgroundPosition:
                            color.hex === "transparent" ? "0 0, 5px 5px" : undefined,
                        }}
                        title={`${color.id}: ${color.hex}`}
                      />
                      <span className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[8px] font-mono opacity-0 mix-blend-difference text-white transition-opacity group-hover:opacity-100">
                        {color.id}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-center py-4 text-primary">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="text-muted-foreground"
                >
                  <path d="M5 12h14m-7-7l7 7-7 7" stroke="currentColor" strokeWidth="2" />
                </svg>
              </div>

              <div>
                <h4 className="mb-2 font-bold">New Palette </h4>
                <div className="grid grid-cols-4 gap-0.5">
                  {[
                    { id: 2, hex: "#DFDFDF" },
                    { id: 3, hex: "#ADADAD" },
                    { id: 4, hex: "#626262" },
                    { id: 5, hex: "#000000" },
                    { id: 6, hex: "#E7CFBE" },
                    { id: 7, hex: "#B97C55" },
                    { id: 8, hex: "#8A3E08" },
                    { id: 9, hex: "#623510" },
                    { id: 10, hex: "#F5BE8C" },
                    { id: 11, hex: "#F38846" },
                    { id: 12, hex: "#E75B15" },
                    { id: 13, hex: "#C4480D" },
                    { id: 14, hex: "#F6EE96" },
                    { id: 15, hex: "#F5E826" },
                    { id: 16, hex: "#F4C72C" },
                    { id: 17, hex: "#C18817" },
                    { id: 18, hex: "#E0EC6B" },
                    { id: 19, hex: "#96B115" },
                    { id: 20, hex: "#958814" },
                    { id: 21, hex: "#575308" },
                    { id: 22, hex: "#B6EBAD" },
                    { id: 23, hex: "#62D842" },
                    { id: 24, hex: "#1C9850" },
                    { id: 25, hex: "#10633D" },
                    { id: 26, hex: "#ACF6EF" },
                    { id: 27, hex: "#2BCEC3" },
                    { id: 28, hex: "#1C9393" },
                    { id: 29, hex: "#106068" },
                    { id: 30, hex: "#AEE4FF" },
                    { id: 31, hex: "#1F8FF2" },
                    { id: 32, hex: "#1248BD" },
                    { id: 33, hex: "#09148D" },
                    { id: 34, hex: "#C7B4F5" },
                    { id: 35, hex: "#8155D8" },
                    { id: 36, hex: "#7634A7" },
                    { id: 37, hex: "#360881" },
                    { id: 38, hex: "#EE6071" },
                    { id: 39, hex: "#D51010" },
                    { id: 40, hex: "#A70D2E" },
                    { id: 41, hex: "#830819" },
                    { id: 42, hex: "#F5B3E0" },
                    { id: 43, hex: "#F375A4" },
                    { id: 1, hex: "#ffffff" },
                  ].map((color) => (
                    <div key={`v2-${color.id}`} className="group relative">
                      <div
                        className="size-8 border-1.5 border-border bg-white"
                        style={{
                          backgroundColor: color.hex,
                          backgroundImage:
                            color.hex === "transparent"
                              ? "linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc)"
                              : undefined,
                          backgroundSize: color.hex === "transparent" ? "10px 10px" : undefined,
                          backgroundPosition:
                            color.hex === "transparent" ? "0 0, 5px 5px" : undefined,
                        }}
                        title={`${color.id}: ${color.hex}`}
                      />
                      <span className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[8px] font-mono opacity-0 mix-blend-difference text-white transition-opacity group-hover:opacity-100">
                        {color.id}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </li>
        <li>
          <video
            src="/changelog/25-12-15-mobile-responsive.mp4"
            muted
            controls
            className="mt-4 border border-border max-w-[250px]  mx-auto float-right"
          />
          <DateComponent date={new Date("12/15/2025")} /> - Made 42colors.com responsive. It&apos;s
          important to be able to share your art with friends when you're in person. Now you can!{" "}
          <ul>
            <li>
              Fixed the canvas flickering that was happening on iOS devices due to how I was using
              `drawImage` from a webgpu canvas to a 2d canvas.
            </li>
            <li>Made the footer and navigation mobile responsive.</li>
            <li>
              Added undo and redo buttons so that those operations are available on touch devices.
            </li>
          </ul>
        </li>
        <li className="clear-both">
          <DateComponent date={new Date("12/15/2025")} /> - Updated the number field component to
          work with touch inputs. Thanks{" "}
          <Link href="https://base-ui.com/react/components/number-field" target="_blank">
            Base UI
          </Link>
          !
          <video
            src="/changelog/25-12-15-number-input.mp4"
            muted
            controls
            className="mt-4 border border-border"
          />
        </li>
        <li>
          <DateComponent date={new Date("12/14/2025")} /> - Added a move tool to 42colors.com so
          it's more intuitive how you can navigate around the canvas. You can either select this
          tool in the top right toolbar or toggle into it by holding the spacebar.
          <video
            src="/changelog/25-12-14-move-tool.mp4"
            muted
            controls
            className="mt-4 border border-border"
          />
          Once selected it enables moving around the canvas with arrow keys too.
        </li>
        <li>
          <DateComponent date={new Date("12/13/2025")} /> - Disabled all complex tools when you
          aren't logged in.
          <video
            src="/changelog/25-12-13-restrict-non-authed-users.mp4"
            muted
            controls
            className="mt-4 border border-border"
          />
        </li>
        <li>
          <DateComponent date={new Date("12/12/25")} /> - Created the voting system.
          <video
            src="/changelog/25-12-12-voting.mp4"
            muted
            controls
            className="mt-4 border border-border"
          />
          You can now vote on your favorite plots to encourage the artist, propel them up the
          leaderboard, and give them more pixels.
          <br />
          <br />
          Key features:
          <ul>
            <li>
              Your personal log now shows aggregated vote data for who you vote for and for the
              votes you receive. It even has a way to quickly navigate to the plots in question.
              <video
                src="/changelog/25-12-12-voting-in-log.mp4"
                muted
                controls
                className="mt-4 border border-border"
              />
            </li>
            <li>
              There is a new &quot;top&quot; tab in the plots popover that ranks plots by the number
              of votes they have. Soon I&apos;ll build a proper leaderboard with time based filters,
              but for now this is the best way to find the top art on the platform.{" "}
              <video
                src="/changelog/25-12-12-voting-top-plot-filter.mp4"
                muted
                controls
                className="mt-4 border border-border"
              />
            </li>
          </ul>
          Little details:
          <ul>
            <li>
              Voting for a plot gives the author 1000 pixels. I&apos;ll probably tweak this as the
              economy for pixels evolves, but wanted it to be very incentivizing even with the
              current low user count.
            </li>
            <li>You can only vote for a plot once.</li>
            <li>You can&apos;t vote for your own plot.</li>
            <li>You can&apos;t vote until you have published art of your own.</li>
          </ul>
        </li>
        <li>
          <DateComponent date={new Date("12/07/2025")} /> - Added social links in the footer menu —
          find us on <Link href="https://discord.gg/CbnfaUnbm6">Discord</Link>,{" "}
          <Link href="https://x.com/42_colors">Twitter</Link>, and{" "}
          <Link href="https://bsky.app/profile/42colors.bsky.social">Bluesky</Link>!
        </li>
        <li>
          <DateComponent date={new Date("12/02/2025")} />
          <ul>
            <li>
              Added a way for admins to draw override plot protection. This is exclusively used for
              clearing non family friendly art.
              <video
                src="/changelog/25-12-02-admin-override-of-plot-protection.mp4"
                muted
                controls
                className="mt-4 border border-border"
              />
            </li>
          </ul>
        </li>
        <li>
          <DateComponent date={new Date("11/23/2025")} />
          <ul>
            <li>
              Optimized the rendering of the realtime pixels you draw and the canvas UI (like the
              plot polygons) in two ways.
              <ul>
                <li>
                  First, I render the realtime pixels and polygons on a per chunk basis. This means
                  that only the pixels that are in the chunk you are drawing in are rendered.
                </li>
                <li>
                  Second, I&apos;m rendering these canvases on demand now instead of every frame.
                  This isolates heavy computation to only when it&apos;s needed rather than doing it
                  every frame.
                </li>
              </ul>
              This took over a week, and I&apos; relieved this work is behind me, but I&apos;m glad
              I did it and it will become increasingly important as people draw and the canvas
              grows.
            </li>
          </ul>
        </li>
        <li>
          <DateComponent date={new Date("11/15/2025")} />
          <ul>
            <li>
              Created the eyedropper tool.
              <video
                src="/changelog/25-11-13-new-eyedropper-tool.mp4"
                muted
                controls
                className="mt-4 border border-border"
              />
            </li>
            <li>
              Click on the canvas to quickly pick your primary color. Right click to similarly set
              your secondary color. <br />
              <br />
              You can also hold <kbd>Option</kbd>/<kbd>Alt</kbd> to temporarily switch to eyedropper
              mode from any tool. Releasing the <kbd>Option</kbd>/<kbd>Alt</kbd> key will revert to
              your previous tool.
            </li>
            <li>
              Dropped some optimizations for the bucket tool rendering. At this point it is still
              pretty rough haha. Working on it!
            </li>
          </ul>
        </li>
        <li>
          <DateComponent date={new Date("11/11/2025")} />
          <ul>
            <li>
              Created the bucket tool.
              <video
                src="/changelog/25-11-11-bucket-tool.mp4"
                muted
                controls
                className="mt-4 border border-border"
              />
            </li>
          </ul>
        </li>
        <li>
          <DateComponent date={new Date("11/06/2025")} />
          <ul>
            <li>
              Added keyboard shortcuts for camera zoom: <kbd>Cmd</kbd>/<kbd>Ctrl</kbd> +{" "}
              <kbd>+</kbd> to zoom in and <kbd>Cmd</kbd>/<kbd>Ctrl</kbd> + <kbd>-</kbd> to zoom out.
            </li>
          </ul>
        </li>
        <li>
          <DateComponent date={new Date("11/05/2025")} />
          <ul>
            <li>
              Show the title of a plot when it&apos;s selected.
              <video
                src="/changelog/25-11-05-selected-plot-popover-title.mp4"
                muted
                controls
                className="mt-4 border border-border"
              />
            </li>
          </ul>
        </li>
        <li>
          <DateComponent date={new Date("11/04/2025")} /> - BIG day
          <ul>
            <li>
              Make is so you could drag from outside the polygon to add new vertices when editing an
              existing plot.
              <video
                src="/changelog/25-11-04-dragging-rectangle-plot-edit.mp4"
                muted
                controls
                className="mt-4 border border-border"
              />
            </li>
            <li>
              Made it so you could drag the points of your polygon when creating a new plot.
              <video
                src="/changelog/25-11-04-dragging-handles-plot-create.mp4"
                muted
                controls
                className="mt-4 border border-border"
              />
            </li>
            <li>
              Created the line tool.
              <video
                src="/changelog/25-11-04-create-line-tool.mp4"
                muted
                controls
                className="mt-4 border border-border"
              />
            </li>
          </ul>
        </li>
        <li>
          <DateComponent date={new Date("11/03/2025")} /> — 42colors.com now auto-selects the plot
          in the middle of your screen and displays a menu for common ops.
          <video
            src="/changelog/25-11-03-overlay-popover.mp4"
            muted
            controls
            className="mt-4 border border-border"
          />
          This popover favors the bottom side, but will switch to the top position to prevent
          overflow, and while your scrolling, pointer events are ignored, so that your cursor
          doesn&apos;t get stuck.
          <video
            src="/changelog/25-11-03-overlay-popover-edge.mp4"
            muted
            controls
            className="mt-4 border border-border"
          />
        </li>
        <li>
          <DateComponent date={new Date("11/02/2025")} /> — MVP is in sight. Going to start posting
          on here now.
        </li>
        <li>
          <DateComponent date={new Date("6/29/2025")} />
          <ul>
            <li>
              Nobody cares until I actually have the MVP done. Lots of changes have happened, but
              you&apos;ll just have to wait until I ship the v1.
            </li>
          </ul>
        </li>
        <li>
          <DateComponent date={new Date("3/10/2025")} />
          <ul>
            <li>
              Created{" "}
              <Link href="/design">
                <code>/design</code>
              </Link>{" "}
              for iterating the design system. Basically a simpler storybook.{" "}
            </li>
          </ul>
        </li>
        <li>
          <DateComponent date={new Date("3/9/2025")} />
          <ul>
            <li>Shipped an update preventing non authed users from drawing. </li>
            <li>Created a toast UI for explaining this to users.</li>
          </ul>
        </li>
        <li>
          <DateComponent date={new Date("2/1/2025")} /> — Experimented a bunch with how to
          efficiently transfer canvas data. I settled on something that is sending binary data that
          only includes the colors, they are then rendered based on the offset of where they were
          fetched from. Since I&apos;m limiting the color palette to 42 colors I am using 1 byte for
          each &quot;pixel&quot; on the screen. This means I can fetch a 400 x 400 tile and
          it&apos;s at most 16,000 bytes before compression.
          <br />
          During this time I also setup file based cache for the entire 10,000 x 10,000 canvas so
          that each request doesn&apos;t hit the database. 100,000,000 bytes is only 95 MBs, so I
          could keep this in memory, but I plan on expanding the canvas to by a factor of 10 so this
          file cache will eventually be 9.5GBs.
        </li>{" "}
        <li>
          <DateComponent date={new Date("1/10/2025")} /> — Started working on the project again and
          created this route interception pattern where all routes are modals by default.
        </li>{" "}
        <li>
          <DateComponent date={new Date("11/17/2024")} /> — Created this changelog
        </li>{" "}
      </ul>
    </>
  );
}
