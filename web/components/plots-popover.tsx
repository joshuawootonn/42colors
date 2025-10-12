'use client';

import { ReactNode, useState } from 'react';

import {
    Popover,
    PopoverContent,
    PopoverHeading,
} from '@/components/ui/popover';
import { Tabs, TabsList, TabsPanel, TabsTab } from '@/components/ui/tabs';
import { store } from '@/lib/store';
import { useSelector } from '@xstate/store/react';

import { RecentPlots } from './recent-plots';
import { UserPlots } from './user-plots';

export function PlotsPopoverMarkup({
    children,
    isOpen,
    setIsOpen,
    selectedPlotId,
    selectPlot,
}: {
    children: ReactNode;
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    selectedPlotId: number | undefined;
    selectPlot: (plotId: number) => void;
}) {
    return (
        <Popover
            type="persistent"
            modal={false}
            open={isOpen}
            onOpenChange={setIsOpen}
        >
            {children}
            <PopoverContent
                className="w-80"
                positionerProps={{
                    side: 'top',
                    align: 'center',
                }}
            >
                <PopoverHeading spacerClassName="mb-6">plots</PopoverHeading>
                <Tabs defaultValue="global" className="flex h-80 flex-col">
                    <TabsList className="-mx-2 mb-2 border-b border-b-1.5">
                        <TabsTab value="global">recent</TabsTab>
                        <TabsTab value="user">user</TabsTab>
                    </TabsList>

                    <TabsPanel value="global" className="flex-1 overflow-auto">
                        <RecentPlots
                            selectedPlotId={selectedPlotId}
                            selectPlot={selectPlot}
                            enabled={isOpen}
                        />
                    </TabsPanel>

                    <TabsPanel value="user" className="flex-1 overflow-auto">
                        <UserPlots
                            selectedPlotId={selectedPlotId}
                            selectPlot={selectPlot}
                            enabled={isOpen}
                        />
                    </TabsPanel>
                </Tabs>
            </PopoverContent>
        </Popover>
    );
}

export function PlotsPopover({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);

    const selectedPlotId = useSelector(
        store,
        (state) => state.context.toolSettings?.claimer.selectedPlotId,
    );

    const selectPlot = (plotId: number) => {
        store.trigger.selectPlot({ plotId });
        store.trigger.moveToPlot({ plotId });
        store.trigger.fetchPixels();
    };

    return (
        <PlotsPopoverMarkup
            isOpen={isOpen}
            setIsOpen={setIsOpen}
            selectedPlotId={selectedPlotId ?? undefined}
            selectPlot={selectPlot}
        >
            {children}
        </PlotsPopoverMarkup>
    );
}
