import { type VariantProps, cva } from "class-variance-authority";

import NextLink, { LinkProps } from "next/link";

import { cn } from "@/lib/utils";

const linkVariants = cva(
  cn(
    "relative inline-flex items-center justify-center whitespace-nowrap text-sm outline-none",
    // specifying aria-disabled since we want to be able to "disable without disabling" to enable tooltips
    "disabled:pointer-events-none aria-[disabled]:pointer-events-none",
  ),
  {
    variants: {
      variant: {
        default: "svg-outline-sm decoration-[1.5px] underline-offset-2",
        button: "svg-outline border-1.5 border-primary bg-primary text-primary-foreground shadow",
        destructive: "svg-outline bg-destructive text-destructive-foreground shadow-sm",
        outline: "svg-outline border-1.5 border-primary bg-background shadow-sm",
        ghost: "svg-outline-sm",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        default: "h-8 px-4",
        inline: "text-auto h-auto px-0 justify-start",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "inline",
    },
  },
);

type Props = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> &
  LinkProps &
  VariantProps<typeof linkVariants> & {
    children?: React.ReactNode | undefined;
  } & React.RefAttributes<HTMLAnchorElement>;

export function Link({ className, variant, size, ...props }: Props) {
  return <NextLink className={cn(linkVariants({ variant, size, className }))} {...props} />;
}

export { linkVariants };
