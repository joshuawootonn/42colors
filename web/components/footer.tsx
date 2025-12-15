"use client";

import { useRef, useState } from "react";

import NextLink from "next/link";
import { useSearchParams } from "next/navigation";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSubContent,
  DropdownMenuSubRoot,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import authService from "@/lib/auth";
import { isAdminUser } from "@/lib/admin";
import { useLogs } from "@/lib/logs/logs.rest";
import { store } from "@/lib/store";
import { useSelector } from "@xstate/store/react";

import { AdminPopover, AdminPopoverMarkup } from "./admin-popover";
import { BalanceDiff } from "./balance-diff";
import { Link } from "./ui/link";
import { LogsPopover, LogsPopoverMarkup } from "./logs-popover";
import { PlotsPopover, PlotsPopoverMarkup } from "./plots-popover/plots-popover";
import { PopoverTrigger } from "./ui/popover";
import { Button } from "./ui/button";

type OpenPopover = "logs" | "plots" | "admin" | null;

function MobileMenu() {
  const searchParams = useSearchParams();
  const ref = useRef<HTMLButtonElement>(null);
  const [openPopover, setOpenPopover] = useState<OpenPopover>(null);

  const selectedPlotId = useSelector(
    store,
    (state) => state.context.toolSettings?.claimer.selectedPlotId,
  );

  const selectPlot = (plotId: number) => {
    store.trigger.selectPlot({ plotId });
    store.trigger.moveToPlot({ plotId });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          ref={ref}
          render={(props) => (
            <Button {...props} variant="outline">
              menu
            </Button>
          )}
        />
        <DropdownMenuContent>
          <DropdownMenuItem
            render={(props) => (
              <Link
                {...props}
                href={{
                  pathname: "/login",
                  query: searchParams.toString(),
                }}
              >
                login
              </Link>
            )}
          />
          <DropdownMenuItem
            render={(props) => (
              <Link
                {...props}
                href={{
                  pathname: "/signup",
                  query: searchParams.toString(),
                }}
              >
                signup
              </Link>
            )}
          />
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setOpenPopover("plots")}>plots</DropdownMenuItem>
          <DropdownMenuSeparator />
          <GeneralMenuItems />
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Plots Popover - controlled by state */}
      <PlotsPopoverMarkup
        isOpen={openPopover === "plots"}
        setIsOpen={(open) => setOpenPopover(open ? "plots" : null)}
        selectedPlotId={selectedPlotId ?? undefined}
        selectPlot={selectPlot}
        anchor={ref}
      />
    </>
  );
}

function MobileUserMenu() {
  const user = useSelector(store, (state) => state.context.user);
  const ref = useRef<HTMLButtonElement>(null);
  const [openPopover, setOpenPopover] = useState<OpenPopover>(null);

  const selectedPlotId = useSelector(
    store,
    (state) => state.context.toolSettings?.claimer.selectedPlotId,
  );
  const userId = user?.id;

  const selectPlot = (plotId: number) => {
    store.trigger.selectPlot({ plotId });
    store.trigger.moveToPlot({ plotId });
  };

  const {
    data: logs,
    isLoading: logsIsLoading,
    error: logsError,
  } = useLogs(20, { enabled: openPopover === "logs" });

  if (user == null) return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={(props) => (
            <Button {...props} variant="outline">
              {user.email} - <BalanceDiff />
            </Button>
          )}
          ref={ref}
        />
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => setOpenPopover("logs")}>logs</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setOpenPopover("plots")}>plots</DropdownMenuItem>
          {isAdminUser(user) && (
            <DropdownMenuItem onClick={() => setOpenPopover("admin")}>admin</DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <GeneralMenuItems />
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={authService.logout}>logout</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Logs Popover - controlled by state */}
      <LogsPopoverMarkup
        isOpen={openPopover === "logs"}
        setIsOpen={(open) => setOpenPopover(open ? "logs" : null)}
        isLoading={logsIsLoading}
        error={logsError}
        logs={logs}
        anchor={ref}
        selectedPlotId={selectedPlotId ?? undefined}
        selectPlot={selectPlot}
      />

      {/* Plots Popover - controlled by state */}
      <PlotsPopoverMarkup
        isOpen={openPopover === "plots"}
        setIsOpen={(open) => setOpenPopover(open ? "plots" : null)}
        selectedPlotId={selectedPlotId ?? undefined}
        selectPlot={selectPlot}
        userId={userId}
        anchor={ref}
      />

      {/* Admin Popover - controlled by state */}
      {isAdminUser(user) && (
        <AdminPopoverMarkup
          isOpen={openPopover === "admin"}
          setIsOpen={(open) => setOpenPopover(open ? "admin" : null)}
          anchor={ref}
        />
      )}
    </>
  );
}

function GeneralMenuItems() {
  const searchParams = useSearchParams();

  return (
    <>
      <DropdownMenuItem
        render={(props) => (
          <Link
            {...props}
            href={{
              pathname: "/about",
              query: searchParams.toString(),
            }}
          >
            about
          </Link>
        )}
      />
      <DropdownMenuItem
        render={(props) => (
          <Link
            {...props}
            href={{
              pathname: "/changelog",
              query: searchParams.toString(),
            }}
          >
            changelog
          </Link>
        )}
      />
      <DropdownMenuSubRoot>
        <DropdownMenuSubTrigger>social</DropdownMenuSubTrigger>
        <DropdownMenuSubContent
          positionerProps={{
            align: "end",
            alignOffset: -1.5,
          }}
        >
          <DropdownMenuItem
            render={(props) => (
              <a
                {...props}
                href="https://discord.gg/CbnfaUnbm6"
                target="_blank"
                rel="noopener noreferrer"
              >
                discord
              </a>
            )}
          />
          <DropdownMenuItem
            render={(props) => (
              <a
                {...props}
                href="https://x.com/42_colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                twitter
              </a>
            )}
          />
          <DropdownMenuItem
            render={(props) => (
              <a
                {...props}
                href="https://bsky.app/profile/42colors.bsky.social"
                target="_blank"
                rel="noopener noreferrer"
              >
                bluesky
              </a>
            )}
          />
        </DropdownMenuSubContent>
      </DropdownMenuSubRoot>
      <DropdownMenuSubRoot>
        <DropdownMenuSubTrigger>legal</DropdownMenuSubTrigger>
        <DropdownMenuSubContent
          positionerProps={{
            align: "end",
            alignOffset: -1.5,
          }}
        >
          <DropdownMenuItem
            render={(props) => (
              <NextLink
                {...props}
                href={{
                  pathname: "/privacy-policy",
                  query: searchParams.toString(),
                }}
              >
                privacy
              </NextLink>
            )}
          />
          <DropdownMenuItem
            render={(props) => (
              <NextLink
                {...props}
                href={{
                  pathname: "/terms-of-service",
                  query: searchParams.toString(),
                }}
              >
                terms
              </NextLink>
            )}
          />
        </DropdownMenuSubContent>
      </DropdownMenuSubRoot>
    </>
  );
}

export function Footer() {
  const searchParams = useSearchParams();

  const user = useSelector(store, (state) => state.context.user);
  const ref = useRef<HTMLButtonElement>(null);
  return (
    <footer className="text-md flex w-min flex-col items-center justify-between  bg-background font-medium text-primary sm:flex-row gap-[-1.5px]">
      <div className="flex items-center justify-between space-x-[-1.5px]">
        {user != null ? (
          <>
            {/* Mobile: use controlled state for popovers */}
            <div className="sm:hidden">
              <MobileUserMenu />
            </div>
            {/* Desktop: use nested popover triggers */}
            <div className="hidden sm:block">
              <LogsPopover anchor={ref}>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    ref={ref}
                    render={(props) => (
                      <Button {...props} variant="outline">
                        {user.email} - <BalanceDiff />
                      </Button>
                    )}
                  />
                  <DropdownMenuContent>
                    <PopoverTrigger
                      nativeButton={false}
                      render={(props) => <DropdownMenuItem {...props}>logs</DropdownMenuItem>}
                    />
                    <DropdownMenuItem onClick={authService.logout}>logout</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </LogsPopover>
            </div>
          </>
        ) : (
          <>
            {/* Mobile: dropdown with all items */}
            <div className="sm:hidden">
              <MobileMenu />
            </div>
            {/* Desktop: show login/signup links */}
            <div className="hidden sm:flex sm:items-center sm:space-x-[-1.5px]">
              <Link
                variant="outline"
                size="default"
                href={{
                  pathname: "/login",
                  query: searchParams.toString(),
                }}
              >
                login
              </Link>
              <Link
                variant="outline"
                size="default"
                href={{
                  pathname: "/signup",
                  query: searchParams.toString(),
                }}
              >
                signup
              </Link>
            </div>
          </>
        )}

        {/* Desktop: show plots, admin, and general menu */}
        <div className="hidden sm:flex sm:items-center">
          {isAdminUser(user) && (
            <>
              <AdminPopover>
                <PopoverTrigger
                  render={(props) => (
                    <Button {...props} className="ml-[-1.5px]" variant="outline">
                      admin
                    </Button>
                  )}
                />
              </AdminPopover>
            </>
          )}

          <PlotsPopover
            trigger={
              <PopoverTrigger
                render={(props) => (
                  <Button {...props} className="ml-[-1.5px]" variant="outline">
                    plots
                  </Button>
                )}
              />
            }
          />

          <DropdownMenu>
            <DropdownMenuTrigger
              render={(props) => (
                <Button {...props} className="ml-[-1.5px]" variant="outline">
                  menu
                </Button>
              )}
            />
            <DropdownMenuContent>
              <GeneralMenuItems />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </footer>
  );
}
