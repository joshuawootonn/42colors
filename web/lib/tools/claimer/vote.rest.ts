import { z } from "zod";

import { store } from "../../store";
import { isInitialStore } from "../../utils/is-initial-store";

const castVoteResponseSchema = z.object({
  vote: z.object({
    id: z.number(),
  }),
  plot_score: z.number(),
});

const voteErrorSchema = z.object({
  error_code: z.string(),
  message: z.string(),
});

const userVoteResponseSchema = z.object({
  has_voted: z.boolean(),
});

export type CastVoteResponse = z.infer<typeof castVoteResponseSchema>;
export type UserVoteResponse = z.infer<typeof userVoteResponseSchema>;

export class VoteError extends Error {
  constructor(
    message: string,
    public errorCode: string,
  ) {
    super(message);
    this.name = "VoteError";
  }
}

export async function castVote(plotId: number): Promise<CastVoteResponse> {
  const context = store.getSnapshot().context;
  if (isInitialStore(context)) {
    throw new Error("Store not initialized");
  }

  const response = await fetch(new URL("/api/votes", context.server.apiOrigin), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      plot_id: plotId,
    }),
  });

  const json = await response.json();

  if (!response.ok) {
    const error = voteErrorSchema.safeParse(json);
    if (error.success) {
      throw new VoteError(error.data.message, error.data.error_code);
    }
    throw new Error("Failed to cast vote");
  }

  return castVoteResponseSchema.parse(json);
}

export async function getUserVoteOnPlot(plotId: number): Promise<UserVoteResponse> {
  const context = store.getSnapshot().context;
  if (isInitialStore(context)) {
    throw new Error("Store not initialized");
  }

  const response = await fetch(new URL(`/api/votes/${plotId}`, context.server.apiOrigin), {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to get user vote");
  }

  const json = await response.json();
  return userVoteResponseSchema.parse(json);
}
