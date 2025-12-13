import { H1, H2 } from "@/components/dialog-headings";
import { EmailLink } from "@/components/email-link";

export function TermsOfService() {
  return (
    <>
      <H1 className="mb-4">terms of service</H1>
      <p>These terms of service were last updated on November 17, 2024.</p>
      <hr className="mx-0 w-full border-t-2 border-border" />
      <H2>Agreement</H2>
      <p>
        By accessing this Website, accessible from 42colors.com, you are agreeing to be bound by
        these Website Terms of Service and agree that you are responsible for the agreement in
        accordance with any applicable local laws. IF YOU DO NOT AGREE TO ALL THE TERMS AND
        CONDITIONS OF THIS AGREEMENT, YOU ARE NOT PERMITTED TO ACCESS OR USE OUR SERVICES.
      </p>
      <H2>Limitations</H2>
      <p>
        You are responsible for your account&apos;s security and all activities on your account. You
        must not, in the use of this site, violate any applicable laws, including, without
        limitation, copyright laws, or any other laws regarding the security of your personal data,
        or otherwise misuse this site. I reserve the right to remove or disable any account or any
        other content on this site at any time for any reason, without prior notice to you, if we
        believe that you have violated this agreement.
      </p>
      <H2>Limitations on Automated Use</H2>
      <p>
        You shouldn&apos;t use bots or access 42colors. If you do, I&apos;ll block you, and delete
        your account.
      </p>
      <H2>Contact</H2>
      <p>
        <EmailLink className="svg-outline-sm underline">Contact me</EmailLink> if you have any
        questions about 42colors&apos; terms of service.
      </p>
      <p>
        Terms based on MonkeyType&apos;s terms which were evidently based on Glitch&apos;s terms.
      </p>
    </>
  );
}
