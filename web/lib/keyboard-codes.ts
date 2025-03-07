export const KeyboardCode = {
  Space: "Space",
} as const;

export type KeyboardCode = (typeof KeyboardCode)[keyof typeof KeyboardCode];
