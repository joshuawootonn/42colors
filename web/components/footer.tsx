import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "./link";
import NextLink from "next/link";

export function Footer() {
  return (
    <footer className="fixed bottom-3 left-3 flex w-min flex-col items-center justify-between text-sm text-primary sm:flex-row">
      <div className="mb-3 flex items-center justify-between space-x-3 sm:mb-0">
        <Link href="/changelog">changelog</Link>
        <div>/</div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="svg-outline relative no-underline"
              aria-label="Customise options"
            >
              legal
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="flex flex-col border-2 border-primary bg-secondary "
            sideOffset={4}
            align="center"
            side="top"
          >
            <DropdownMenuItem asChild={true}>
              <NextLink
                className="cursor-pointer px-2 py-1 no-underline outline-none focus:bg-primary focus:text-secondary"
                href={"/privacy-policy"}
              >
                privacy
              </NextLink>
            </DropdownMenuItem>
            <DropdownMenuItem asChild={true}>
              <NextLink
                className="cursor-pointer px-2 py-1 no-underline outline-none focus:bg-primary focus:text-secondary"
                href={"/terms-of-service"}
              >
                terms
              </NextLink>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </footer>
  );
}
