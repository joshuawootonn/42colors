export const ErrorCode = {
    UNAUTHED_USER: 'unauthed_user',
    PROHIBITED_PIXELS: 'prohibited_pixels',
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];
