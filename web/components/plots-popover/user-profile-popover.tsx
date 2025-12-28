"use client";

import { Popover, PopoverContent, PopoverHeading, PopoverTrigger } from "@/components/ui/popover";
import { store } from "@/lib/store";
import userService, { UserProfile, UserProfilePlot } from "@/lib/user";
import { closeUserProfile, userProfilePopoverAtom } from "@/lib/user-profile-popover-state";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { useAtom } from "@xstate/store/react";

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatPlotDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type UserProfilePlotListProps = {
  plots: UserProfilePlot[];
  onPlotClick: (plotId: number) => void;
};

function UserProfilePlotList({ plots, onPlotClick }: UserProfilePlotListProps) {
  if (plots.length === 0) {
    return <div className="py-8 text-center text-sm text-muted-foreground">No plots yet</div>;
  }

  return (
    <div className="flex w-full flex-col">
      {plots.map((plot) => (
        <button
          key={plot.id}
          className={cn(
            "svg-outline-inset group peer relative z-0 flex w-full items-start justify-between gap-2 border-transparent bg-transparent p-2 text-left text-foreground outline-none hover:bg-secondary",
          )}
          onClick={() => onPlotClick(plot.id)}
        >
          <div className="min-w-0 flex-1">
            <div>{plot.name}</div>
            <div className="text-left text-xs">
              {plot.description && (
                <div className="mt-0.5 line-clamp-2 text-muted-foreground">{plot.description}</div>
              )}
              <div className="mt-1 text-muted-foreground">{formatPlotDate(plot.insertedAt)}</div>
            </div>
          </div>
          <div className="shrink-0 text-sm tabular-nums text-muted-foreground">
            <span className="pr-0.5">↑</span>
            {plot.score}
          </div>
        </button>
      ))}
    </div>
  );
}

type UserProfileContentProps = {
  profile: UserProfile;
};

function UserProfileContent({ profile }: UserProfileContentProps) {
  const handlePlotClick = (plotId: number) => {
    store.trigger.selectPlot({ plotId });
    store.trigger.moveToPlot({ plotId });
    // Don't close the user profile popover when clicking a plot
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b-1.5 border-border p-3">
        <div className="text-sm">Member since {formatDate(profile.insertedAt)}</div>
        <div className="mt-1 text-sm">
          {profile.plots.length} {profile.plots.length === 1 ? "plot" : "plots"}
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        <UserProfilePlotList plots={profile.plots} onPlotClick={handlePlotClick} />
      </div>
    </div>
  );
}

export function UserProfilePopover() {
  const profileState = useAtom(userProfilePopoverAtom);

  const {
    data: profile,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["user", "profile", profileState?.userId],
    queryFn: () => userService.getUserProfile(profileState!.userId),
    enabled: profileState !== null,
  });

  const displayName = profileState?.username || `User #${profileState?.userId}`;

  return (
    <Popover
      type="persistent"
      modal={false}
      open={profileState !== null}
      onOpenChange={(open) => {
        if (!open) {
          closeUserProfile();
        }
      }}
    >
      <PopoverTrigger
        className="hi there"
        style={{
          position: "absolute",
          left: profileState?.position.left,
          top: profileState?.position.top,
          width: profileState?.position.width + "px",
          height: profileState?.position.height + "px",
        }}
      />
      <PopoverContent
        className="w-80"
        positionerProps={{
          side: "bottom",
          align: "center",
          sideOffset: 16,
        }}
      >
        <PopoverHeading>{displayName}</PopoverHeading>
        <div className="h-72">
          {isLoading ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Loading...
            </div>
          ) : error ? (
            <div className="flex h-full items-center justify-center text-sm text-red-600">
              Failed to load profile
            </div>
          ) : profile ? (
            <UserProfileContent profile={profile} />
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}
