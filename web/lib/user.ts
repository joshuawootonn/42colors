import { z } from "zod";

import { toasts } from "@/components/ui/toast";

import analytics from "./analytics";
import { polygonSchema } from "./geometry/polygon";
import { store } from "./store";
import { isInitialStore } from "./utils/is-initial-store";

const claimDailyGrantSuccessSchema = z.object({
  status: z.literal("success"),
  message: z.string(),
  user: z.object({
    id: z.number(),
    email: z.string().email(),
    balance: z.number(),
  }),
});

const claimDailyGrantErrorSchema = z.object({
  status: z.literal("error"),
  message: z.string(),
});

const claimDailyGrantResponseSchema = z.union([
  claimDailyGrantSuccessSchema,
  claimDailyGrantErrorSchema,
]);

export type ClaimDailyGrantResponse = z.infer<typeof claimDailyGrantResponseSchema>;

const userSearchResponseSchema = z.object({
  status: z.literal("success"),
  users: z.array(
    z.object({
      id: z.number(),
      email: z.string(),
      balance: z.number(),
    }),
  ),
});

const userSearchErrorSchema = z.object({
  status: z.literal("error"),
  message: z.string(),
});

const userSearchResponseUnionSchema = z.union([userSearchResponseSchema, userSearchErrorSchema]);

export type UserSearchResult = z.infer<typeof userSearchResponseSchema>;
export type SearchedUser = z.infer<typeof userSearchResponseSchema.shape.users.element>;

const userProfilePlotSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  polygon: polygonSchema,
  insertedAt: z.string(),
  updatedAt: z.string(),
  score: z.number().optional().default(0),
});

const userProfileBaseSchema = z.object({
  id: z.number(),
  username: z.string(),
  insertedAt: z.string(),
});

const userProfileResponseSchema = z.object({
  data: userProfileBaseSchema,
});

const userProfilePlotsResponseSchema = z.object({
  data: z.array(userProfilePlotSchema),
});

export type UserProfileBase = z.infer<typeof userProfileBaseSchema>;
export type UserProfile = UserProfileBase & {
  plots: UserProfilePlot[];
};
export type UserProfilePlot = z.infer<typeof userProfilePlotSchema>;

const userService = {
  async getUserProfile(userId: number): Promise<UserProfile> {
    const context = store.getSnapshot().context;
    if (isInitialStore(context)) {
      throw new Error("Server context is not initialized");
    }

    // Fetch profile and plots in parallel
    const [profileResponse, plotsResponse] = await Promise.all([
      fetch(new URL(`/api/profile/${userId}`, context.server.apiOrigin), {
        method: "GET",
      }),
      fetch(new URL(`/api/profile/${userId}/plots`, context.server.apiOrigin), {
        method: "GET",
      }),
    ]);

    if (!profileResponse.ok) {
      throw new Error("Failed to fetch user profile");
    }

    if (!plotsResponse.ok) {
      throw new Error("Failed to fetch user plots");
    }

    const [rawProfile, rawPlots] = await Promise.all([
      profileResponse.json(),
      plotsResponse.json(),
    ]);

    const profileResult = userProfileResponseSchema.safeParse(rawProfile);
    const plotsResult = userProfilePlotsResponseSchema.safeParse(rawPlots);

    if (!profileResult.success) {
      console.error("Invalid user profile response format:", profileResult.error);
      throw new Error("Invalid response format from server");
    }

    if (!plotsResult.success) {
      console.error("Invalid user plots response format:", plotsResult.error);
      throw new Error("Invalid response format from server");
    }

    return {
      ...profileResult.data.data,
      plots: plotsResult.data.data,
    };
  },

  async claimDailyGrant(origin: string): Promise<ClaimDailyGrantResponse> {
    const response = await fetch(`${origin}/api/users/me/claim_daily_bonus`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to claim daily grant");
    }

    const rawResult = await response.json();

    const parseResult = claimDailyGrantResponseSchema.safeParse(rawResult);

    if (!parseResult.success) {
      console.error("Invalid daily grant response format:", parseResult.error);
      throw new Error("Invalid response format from server");
    }

    const result = parseResult.data;

    if (result.status === "success") {
      analytics.trackEvent("daily_grant_claimed", {
        amount: 1000,
      });

      // Show success notification
      toasts.dailyGrantClaimed();

      // Refetch user to update balance and can_claim_daily_bonus flag
      store.trigger.fetchUser();
    }

    return result;
  },

  async searchUsers(query: string): Promise<SearchedUser[]> {
    const context = store.getSnapshot().context;
    if (isInitialStore(context)) {
      throw new Error("Server context is not initialized");
    }

    const search = new URLSearchParams();
    search.set("query", query);

    const response = await fetch(new URL(`/api/users/search?${search}`, context.server.apiOrigin), {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to search users");
    }

    const rawResult = await response.json();
    const parseResult = userSearchResponseUnionSchema.safeParse(rawResult);

    if (!parseResult.success) {
      console.error("Invalid user search response format:", parseResult.error);
      throw new Error("Invalid response format from server");
    }

    const result = parseResult.data;

    if (result.status === "error") {
      throw new Error(result.message);
    }

    return result.users;
  },
};

export default userService;
