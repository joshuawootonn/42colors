export const ADMIN_EMAILS = [
  "jose56wonton@gmail.com",
  "anders.almberg@gmail.com",
  "joshuawootonn@gmail.com",
];

type MaybeUser =
  | {
      email?: string | null;
    }
  | null
  | undefined;

export function isAdminUser(user: MaybeUser): boolean {
  if (!user?.email) {
    return false;
  }

  return ADMIN_EMAILS.includes(user.email);
}
