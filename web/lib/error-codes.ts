export const ErrorCode = {
    UNAUTHED_USER: 'unauthed_user',
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];
