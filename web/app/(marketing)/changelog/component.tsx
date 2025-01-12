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
