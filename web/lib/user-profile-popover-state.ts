import { createAtom } from "@xstate/store";

export type UserProfilePopoverState = {
  userId: number;
  username: string | null | undefined;
  position: DOMRect;
} | null;

export const userProfilePopoverAtom = createAtom<UserProfilePopoverState>(null);

export function openUserProfile(
  userId: number,
  username: string | null | undefined,
  position: DOMRect,
) {
  userProfilePopoverAtom.set({ userId, username, position });
}

export function closeUserProfile() {
  userProfilePopoverAtom.set(null);
}
