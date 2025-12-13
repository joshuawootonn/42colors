import { z } from "zod";

import { store } from "@/lib/store";
import { isInitialStore } from "@/lib/utils/is-initial-store";

const grantPixelsSuccessSchema = z.object({
  status: z.literal("success"),
  message: z.string(),
  user: z.object({
    id: z.number(),
    email: z.string(),
    balance: z.number(),
  }),
});

const grantPixelsErrorSchema = z.object({
  status: z.literal("error"),
  message: z.string(),
});

const grantPixelsResponseSchema = z.union([grantPixelsSuccessSchema, grantPixelsErrorSchema]);

export type GrantPixelsResponse = z.infer<typeof grantPixelsResponseSchema>;

export async function grantPixels(userId: number, amount: number): Promise<GrantPixelsResponse> {
  const context = store.getSnapshot().context;
  if (isInitialStore(context)) {
    throw new Error("Server context is not initialized");
  }

  const response = await fetch(new URL(`/api/admin/grant_pixels`, context.server.apiOrigin), {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      user_id: userId,
      amount: amount.toString(),
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to grant pixels");
  }

  const rawResult = await response.json();

  const parseResult = grantPixelsResponseSchema.safeParse(rawResult);

  if (!parseResult.success) {
    console.error("Invalid grant pixels response format:", parseResult.error);
    throw new Error("Invalid response format from server");
  }

  return parseResult.data;
}
