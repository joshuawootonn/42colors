export const ErrorCode = {
    UNAUTHED_USER: 'unauthed_user',
    PROHIBITED_PIXELS: 'prohibited_pixels',
    // Vote errors
    VOTE_UNAUTHORIZED: 'VOTE_UNAUTHORIZED',
    VOTE_OWN_PLOT: 'VOTE_OWN_PLOT',
    VOTE_DIRECTION_LOCKED: 'VOTE_DIRECTION_LOCKED',
    VOTE_AMOUNT_EXCEEDED: 'VOTE_AMOUNT_EXCEEDED',
    VOTE_INSUFFICIENT_BALANCE: 'VOTE_INSUFFICIENT_BALANCE',
    PLOT_NOT_FOUND: 'PLOT_NOT_FOUND',
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];
