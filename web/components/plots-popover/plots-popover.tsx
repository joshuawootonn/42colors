"use client";

import { ReactNode, RefObject, useMemo, useState } from "react";

import { Popover, PopoverContent, PopoverHeading } from "@/components/ui/popover";
import { Tabs, TabsList, TabsPanel, TabsTab } from "@/components/ui/tabs";
import { store } from "@/lib/store";
import { useSelector } from "@xstate/store/react";

import { RecentPlots } from "./recent-plots";
import { TopPlots } from "./top-plots";
import { UserPlots } from "./user-plots";

export function PlotsPopoverMarkup({
  children,
  trigger,
  anchor,
  isOpen,
  setIsOpen,
  selectedPlotId,
  selectPlot,
  userId,
}: {
  children?: ReactNode;
  trigger?: ReactNode;
  anchor?: RefObject<HTMLElement | null>;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  selectedPlotId: number | undefined;
  selectPlot: (plotId: number) => void;
  userId?: number;
}) {
  const positionerProps = useMemo(() => {
    return {
      anchor,
      side: "top" as const,
      align: "center" as const,
    };
  }, [anchor]);

  return (
    <Popover type="persistent" modal={false} open={isOpen} onOpenChange={setIsOpen}>
      {trigger}
      <PopoverContent className="w-80" positionerProps={positionerProps}>
        <PopoverHeading spacerClassName="mb-8">plots</PopoverHeading>
        <Tabs defaultValue="recent" className="flex h-80 flex-col">
          <TabsList className="border-b-1.5">
            <TabsTab value="recent">recent</TabsTab>
            <TabsTab value="top">top</TabsTab>
            <TabsTab value="user">user</TabsTab>
          </TabsList>

          <TabsPanel value="recent">
            <div className="h-72 overflow-auto">
              {children ? (
                children
              ) : (
                <RecentPlots
                  selectedPlotId={selectedPlotId}
                  selectPlot={selectPlot}
                  enabled={isOpen}
                />
              )}
            </div>
          </TabsPanel>

          <TabsPanel value="top">
            <div className="h-72 overflow-auto">
              {children ? (
                children
              ) : (
                <TopPlots
                  selectedPlotId={selectedPlotId}
                  selectPlot={selectPlot}
                  enabled={isOpen}
                />
              )}
            </div>
          </TabsPanel>

          <TabsPanel value="user">
            <div className="h-72 overflow-auto">
              {children ? (
                children
              ) : (
                <UserPlots
                  selectedPlotId={selectedPlotId}
                  selectPlot={selectPlot}
                  enabled={isOpen}
                  userId={userId}
                />
              )}
            </div>
          </TabsPanel>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}

export function PlotsPopover({ children, trigger }: { children?: ReactNode; trigger: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedPlotId = useSelector(
    store,
    (state) => state.context.toolSettings?.claimer.selectedPlotId,
  );

  const user = useSelector(store, (state) => state.context?.user);
  const userId = user?.id;

  const selectPlot = (plotId: number) => {
    store.trigger.selectPlot({ plotId });
    store.trigger.moveToPlot({ plotId });
  };

  return (
    <PlotsPopoverMarkup
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      selectedPlotId={selectedPlotId ?? undefined}
      selectPlot={selectPlot}
      trigger={trigger}
      userId={userId}
    >
      {children}
    </PlotsPopoverMarkup>
  );
}
