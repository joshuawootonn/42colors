import { cn } from "@/lib/utils";
import NextLink, { LinkProps } from "next/link";

type Props = Omit<
  React.AnchorHTMLAttributes<HTMLAnchorElement>,
  keyof LinkProps
> &
  LinkProps & {
    children?: React.ReactNode | undefined;
  } & React.RefAttributes<HTMLAnchorElement>;

export function Link({ className, ...props }: Props) {
  return (
    <NextLink
      className={cn(
        "outline-none svg-outline-sm relative underline-offset-2 decoration-[1.5px]",
        className,
      )}
      {...props}
    />
  );
}
