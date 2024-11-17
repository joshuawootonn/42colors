import { EmailLink } from "@/components/email-link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "42colors - privacy policy",
  description: "The privacy policy for 42colors",
};

export default function Home() {
  return (
    <>
      <div className={"prose-h2:text-3xl prose-p:text-xl"}>
        <h1>Privacy Policy</h1>
        <hr className="mx-0 w-full border-t-2 border-black dark:border-white" />

        <h2>What data does 42colors collect?</h2>
        <div>
          42colors collects the following data:
          <ul>
            <li>Email</li>
            <li>First and last name</li>
            <li>Passages you have typed</li>
          </ul>
        </div>
        <h2>How will 42colors use your data?</h2>
        <div>
          42colors collects your data so that it can:
          <ul>
            <li>Track what art you have created</li>
            <li>Send occasional update emails - no more than 6 a year</li>
          </ul>
        </div>
        <h2>How does 42colors store your data?</h2>
        <p>42colors securely stores your data in a digital ocean database.</p>
        <h2>Does 42colors share data</h2>
        <p>
          I (Josh Wootonn) have no intention of ever sharing or selling the data
          collected. If the usage of 42colors starts to outpace the free tiers
          of the products I am using, then my monetization strategy will be
          donation based.
        </p>

        <h2>Contact</h2>
        <p>
          <EmailLink className="svg-outline-sm underline">Contact me</EmailLink>{" "}
          if you have any questions about 42colors&apos; privacy policy, the
          data it holds on you, or you would like to exercise one of your data
          protection rights.
        </p>
        <p>Terms based on MonkeyType&apos;s privacy policy.</p>
      </div>
    </>
  );
}
