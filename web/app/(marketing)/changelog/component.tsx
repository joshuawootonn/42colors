import { format } from "date-fns";
import { changelogUpdatedAt } from "./updated-at";
import { H1 } from "@/components/dialog-headings";

function DateComponent({ date }: { date: Date }) {
  return (
    <time
      className={"font-bold text-primary "}
      dateTime={format(date, "yyyy-MM-dd")}
    >
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
      <p>A list of all that new and improved in 42colors.</p>
      <hr className="w-full border-t-2 border-black dark:border-white" />
      <ul>
        <li>
          <DateComponent date={new Date("3/4/2025")} /> — Shipped a new
          navigation component that accelerates when you hold the controls and
          has some of the new design patterns I'm thinking of using in the
          toolbar.
        </li>
        <li>
          <DateComponent date={new Date("2/1/2025")} /> — Experimented a bunch
          with how to efficiently transfer canvas data. I settled on something
          that is sending binary data that only includes the colors, they are
          then rendered based on the offset of where they were fetched from.
          Since I&apos;m limiting the color palette to 42 colors I am using 1
          byte for each &quot;pixel&quot; on the screen. This means I can fetch
          a 400 x 400 tile and it&apos;s at most 16,000 bytes before
          compression.
          <br />
          During this time I also setup file based cache for the entire 10,000 x
          10,000 canvas so that each request doesn&apos;t hit the database.
          100,000,000 bytes is only 95 MBs, so I could keep this in memory, but
          I plan on expanding the canvas to by a factor of 10 so this file cache
          will eventually be 9.5GBs.
        </li>{" "}
        <li>
          <DateComponent date={new Date("1/10/2025")} /> — Started working on
          the project again and created this route interception pattern where
          all routes are modals by default.
        </li>{" "}
        <li>
          <DateComponent date={new Date("11/17/2024")} /> — Created this
          changelog
        </li>{" "}
      </ul>
    </>
  );
}
