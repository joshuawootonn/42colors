import posthog from "posthog-js";

const analytics = {
  identifyUser: (user: { email: string; id: number }) => {
    posthog.identify(user.id.toString(), {
      email: user.email,
      user_id: user.id,
    });
  },

  trackEvent: (eventName: string, properties?: Record<string, unknown>) => {
    posthog.capture(eventName, properties);
  },

  reset: () => {
    posthog.reset();
  },
};

export default analytics;
