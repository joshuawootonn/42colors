import { format } from "date-fns";

import { H1 } from "@/components/dialog-headings";
import { Link } from "@/components/link";

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
