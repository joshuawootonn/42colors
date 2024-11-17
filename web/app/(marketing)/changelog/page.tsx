import { format } from "date-fns";
import { Metadata } from "next";
import { changelogUpdatedAt } from "./updated-at";

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

export const metadata: Metadata = {
  title: "42colors - changelog",
  description: "All the product changes happening to 42colors",
};

export default function Changelog() {
  return (
    <div
      className={
        "marker:text-primary prose-h2:text-3xl prose-p:text-xl prose-a:text-primary prose-kbd:text-primary prose-code:text-primary prose-code:before:content-none prose-code:after:content-none prose-ul:text-primary prose-li:text-primary"
      }
    >
      <div className="mb-10 flex items-center justify-between">
        <h1 className="m-0">changelog</h1>
        <span className="text-primary">
          (Updated <DateComponent date={changelogUpdatedAt} />)
        </span>
      </div>
      <p>New updates and improvements to 42colors</p>
      <hr className="mx-0 w-full border-t-2 border-black dark:border-white" />
      <ul>
        <li>
          <DateComponent date={new Date("11/17/2024")} /> — Created this
          changelog
        </li>{" "}
      </ul>
    </div>
  );
}
