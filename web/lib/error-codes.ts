export const ErrorCode = {
  UNAUTHED_USER: "unauthed_user",
  PROHIBITED_PIXELS: "prohibited_pixels",
  // Vote errors
  VOTE_UNAUTHORIZED: "VOTE_UNAUTHORIZED",
  VOTE_OWN_PLOT: "VOTE_OWN_PLOT",
  ALREADY_VOTED: "ALREADY_VOTED",
  PLOT_NOT_FOUND: "PLOT_NOT_FOUND",
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];
