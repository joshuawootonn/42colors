import { H1, H2 } from "@/components/dialog-headings";
import { EmailLink } from "@/components/email-link";

export function PrivacyPolicy() {
  return (
    <>
      <H1 className="mb-4">privacy policy</H1>
      <p className="mb-10">details about what data 42colors collects</p>
      <hr className="mx-0 w-full border-t-2 border-black dark:border-white" />

      <H2>what data does 42colors collect?</H2>
      <div>
        42colors collects the following data:
        <ul>
          <li>Email</li>
          <li>First and last name</li>
          <li>Passages you have typed</li>
        </ul>
      </div>
      <H2>how will 42colors use your data?</H2>
      <div>
        42colors collects your data so that it can:
        <ul>
          <li>Track what art you have created</li>
          <li>Send occasional update emails - no more than 6 a year</li>
        </ul>
      </div>
      <H2>how does 42colors store your data?</H2>
      <p>42colors securely stores your data in a digital ocean database.</p>
      <H2>Does 42colors share data</H2>
      <p>
        I (Josh Wootonn) have no intention of ever sharing or selling the data
        collected. If the usage of 42colors starts to outpace the free tiers of
        the products I am using, then my monetization strategy will be donation
        based.
      </p>

      <H2>contact</H2>
      <p>
        <EmailLink className="svg-outline-sm underline">Contact me</EmailLink>{" "}
        if you have any questions about 42colors&apos; privacy policy, the data
        it holds on you, or you would like to exercise one of your data
        protection rights.
      </p>
      <p>Terms based on MonkeyType&apos;s privacy policy.</p>
    </>
  );
}
