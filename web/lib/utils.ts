import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function deleteCookie(name: string) {
  document.cookie = `${name}=;domain=${process.env.NEXT_PUBLIC_ENV === "production" ? ".42colors.com" : "localhost"}; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
}
