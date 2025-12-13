import NextLink, { LinkProps } from "next/link";

import { cn } from "@/lib/utils";

type Props = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> &
  LinkProps & {
    children?: React.ReactNode | undefined;
  } & React.RefAttributes<HTMLAnchorElement>;

export function Link({ className, ...props }: Props) {
  return (
    <NextLink
      className={cn(
        "svg-outline-sm relative decoration-[1.5px] underline-offset-2 outline-none",
        className,
      )}
      {...props}
    />
  );
}
