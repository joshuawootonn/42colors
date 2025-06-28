import assert from "assert";
import posthog from "posthog-js";

assert(process.env.NEXT_PUBLIC_POSTHOG_KEY);
assert(process.env.NEXT_PUBLIC_POSTHOG_HOST);

posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
  api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  ui_host: "https://us.posthog.com",
});
