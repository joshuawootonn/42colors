'use client';

import { AdminPopover } from '@/components/admin-popover';
import { LogsPopoverMarkup } from '@/components/logs-popover';
import { PlotsList } from '@/components/plots-popover/plots-list';
import { PlotsPopoverMarkup } from '@/components/plots-popover/plots-popover';
import { Button } from '@/components/ui/button';
import { PopoverTrigger } from '@/components/ui/popover';
import { TOASTS, Toast } from '@/components/ui/toast';
import { polygonSchema } from '@/lib/geometry/polygon';
import { cn } from '@/lib/utils';

function ColorBlock({ variable }: { variable: string }) {
    return (
        <div
            className={cn(
                `relative aspect-square w-30 border-1.5 border-primary`,
            )}
            style={{
                backgroundColor: `hsl(var(${variable}))`,
            }}
        >
            <code className="absolute left-0 top-0 bg-primary text-xs text-secondary">
                {variable}
            </code>
        </div>
    );
}

export function DesignPage() {
    return (
        <div className="prose mx-10 my-20 max-w-full">
            <h1>Design</h1>
            The <i>storybook</i> of 42colors.
            <h2>Colors</h2>
            <div className="flex w-full flex-wrap gap-2">
                <ColorBlock variable="--background" />
                <ColorBlock variable="--foreground" />
                <ColorBlock variable="--card" />
                <ColorBlock variable="--card-foreground" />
                <ColorBlock variable="--popover" />
                <ColorBlock variable="--popover-foreground" />
                <ColorBlock variable="--secondary" />
                <ColorBlock variable="--secondary-foreground" />
                <ColorBlock variable="--muted" />
                <ColorBlock variable="--muted-foreground" />
                <ColorBlock variable="--accent" />
                <ColorBlock variable="--accent-foreground" />
                <ColorBlock variable="--destructive" />
                <ColorBlock variable="--destructive-foreground" />
                <ColorBlock variable="--border" />
                <ColorBlock variable="--input" />
                <ColorBlock variable="--ring" />
                <ColorBlock variable="--chart-1" />
                <ColorBlock variable="--chart-2" />
                <ColorBlock variable="--chart-3" />
                <ColorBlock variable="--chart-4" />
                <ColorBlock variable="--chart-5" />
                <ColorBlock variable="--radius" />
            </div>
            <h2>Button</h2>
            <div className="not-prose space-y-4">
                <div className="flex w-full flex-wrap items-center gap-4">
                    <div className="text-sm">Small</div>
                    <Button size="sm">default</Button>
                    <Button size="sm" variant="destructive">
                        destructive
                    </Button>
                    <Button size="sm" variant="outline">
                        outline
                    </Button>
                    <Button size="sm" variant="link">
                        link
                    </Button>
                </div>
                <div className="flex w-full flex-wrap items-center gap-4">
                    <div className="text-md">Default</div>
                    <Button>default</Button>
                    <Button variant="destructive">destructive</Button>
                    <Button variant="outline">outline</Button>
                    <Button variant="link">link</Button>
                </div>
            </div>
            <h2>Toast</h2>
            <p className="text-sm text-muted-foreground">
                All toast messages in the application. These are the only
                allowed toast configurations.
            </p>
            <div className="not-prose flex w-full flex-col gap-4">
                <div className="space-y-2">
                    <h3 className="text-sm font-medium">Login to Claim Land</h3>
                    <Toast
                        id="toast-login-to-claim-land"
                        {...TOASTS.loginToClaimLand({
                            label: 'Log in',
                            onClick: () => {},
                        })}
                    />
                </div>
                <div className="space-y-2">
                    <h3 className="text-sm font-medium">
                        Login to Save Pixels
                    </h3>
                    <Toast
                        id="toast-login-to-save-pixels"
                        {...TOASTS.loginToSavePixels({
                            label: 'Log in',
                            onClick: () => {},
                        })}
                    />
                </div>
                <div className="space-y-2">
                    <h3 className="text-sm font-medium">Daily Grant Claimed</h3>
                    <Toast
                        id="toast-daily-grant"
                        title={TOASTS.dailyGrantClaimed.title}
                        description={TOASTS.dailyGrantClaimed.description}
                    />
                </div>
                <div className="space-y-2">
                    <h3 className="text-sm font-medium">Cannot Draw on Plot</h3>
                    <Toast
                        id="toast-cannot-draw"
                        title={TOASTS.cannotDrawOnPlot.title}
                        description={TOASTS.cannotDrawOnPlot.description}
                    />
                </div>
                <div className="space-y-2">
                    <h3 className="text-sm font-medium">
                        Cannot Bucket Fill Other Plot
                    </h3>
                    <Toast
                        id="toast-cannot-bucket-other-plot"
                        title={TOASTS.cannotBucketOtherPlot.title}
                        description={TOASTS.cannotBucketOtherPlot.description}
                    />
                </div>
                <div className="space-y-2">
                    <h3 className="text-sm font-medium">
                        Cannot Bucket Fill Outside Plot
                    </h3>
                    <Toast
                        id="toast-cannot-bucket-outside-plot"
                        title={TOASTS.cannotBucketOutsidePlot.title}
                        description={TOASTS.cannotBucketOutsidePlot.description}
                    />
                </div>
                <div className="space-y-2">
                    <h3 className="text-sm font-medium">Login to Use Bucket</h3>
                    <Toast
                        id="toast-login-to-use-bucket"
                        {...TOASTS.loginToUseBucket({
                            label: 'Sign up',
                            onClick: () => {},
                        })}
                    />
                </div>
                <div className="space-y-2">
                    <h3 className="text-sm font-medium">Login to Use Line</h3>
                    <Toast
                        id="toast-login-to-use-line"
                        {...TOASTS.loginToUseLine({
                            label: 'Log in',
                            onClick: () => {},
                        })}
                    />
                </div>
                <div className="space-y-2">
                    <h3 className="text-sm font-medium">
                        Login to Use Eyedropper
                    </h3>
                    <Toast
                        id="toast-login-to-use-eyedropper"
                        {...TOASTS.loginToUseEyedropper({
                            label: 'Log in',
                            onClick: () => {},
                        })}
                    />
                </div>
            </div>
            <h2>Plots Popover</h2>
            <div className="not-prose wrap mt-120 flex w-full items-center justify-between gap-4">
                <PlotsPopoverMarkup
                    isOpen={true}
                    setIsOpen={() => {}}
                    selectedPlotId={2}
                    selectPlot={() => {}}
                    trigger={<PopoverTrigger>Plots</PopoverTrigger>}
                >
                    <PlotsList
                        plots={[
                            {
                                id: 1,
                                name: 'Plot 1',
                                description: 'Plot 1 description',
                                polygon: polygonSchema.parse({
                                    vertices: [
                                        [0, 0],
                                        [1, 0],
                                        [1, 1],
                                        [0, 1],
                                    ],
                                }),
                                insertedAt: '2024-01-01T10:00:00Z',
                                updatedAt: '2024-01-01T10:00:00Z',
                                deletedAt: null,
                                userId: 1,
                                score: 0,
                            },
                            {
                                id: 2,
                                name: 'Plot 2',
                                description: 'Plot 2 description',
                                polygon: polygonSchema.parse({
                                    vertices: [
                                        [0, 0],
                                        [1, 0],
                                        [1, 1],
                                        [0, 1],
                                    ],
                                }),
                                insertedAt: '2024-01-01T10:00:00Z',
                                updatedAt: '2024-01-01T10:00:00Z',
                                deletedAt: null,
                                userId: 1,
                                score: 5,
                            },
                            {
                                id: 3,
                                name: 'Other User Plot 3',
                                description:
                                    'Plot 2 description with really long description. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
                                polygon: polygonSchema.parse({
                                    vertices: [
                                        [0, 0],
                                        [1, 0],
                                        [1, 1],
                                        [0, 1],
                                    ],
                                }),
                                insertedAt: '2024-01-01T10:00:00Z',
                                updatedAt: '2024-01-01T10:00:00Z',
                                deletedAt: null,
                                userId: 3,
                                score: -3,
                            },
                            {
                                id: 4,
                                name: 'Other User Plot 4',
                                description: 'Plot 4 description',
                                polygon: polygonSchema.parse({
                                    vertices: [
                                        [0, 0],
                                        [1, 0],
                                        [1, 1],
                                        [0, 1],
                                    ],
                                }),
                                insertedAt: '2024-01-01T10:00:00Z',
                                updatedAt: '2024-01-01T10:00:00Z',
                                deletedAt: null,
                                userId: 2,
                                score: 42,
                            },
                            {
                                id: 5,
                                name: 'Plot 5',
                                description: 'Plot 5 description',
                                polygon: polygonSchema.parse({
                                    vertices: [
                                        [0, 0],
                                        [1, 0],
                                        [1, 1],
                                        [0, 1],
                                    ],
                                }),
                                insertedAt: '2024-01-01T10:00:00Z',
                                updatedAt: '2024-01-01T10:00:00Z',
                                deletedAt: null,
                                userId: 1,
                                score: 100,
                            },
                        ]}
                        isLoading={false}
                        error={null}
                        selectedPlotId={1}
                        selectPlot={() => {}}
                    />
                </PlotsPopoverMarkup>
                <PlotsPopoverMarkup
                    isOpen={true}
                    setIsOpen={() => {}}
                    selectedPlotId={undefined}
                    selectPlot={() => {}}
                    trigger={<PopoverTrigger>Plots Loading</PopoverTrigger>}
                >
                    <PlotsList
                        plots={undefined}
                        isLoading={true}
                        error={null}
                        selectedPlotId={undefined}
                        selectPlot={() => {}}
                    />
                </PlotsPopoverMarkup>
                <PlotsPopoverMarkup
                    isOpen={true}
                    setIsOpen={() => {}}
                    selectedPlotId={undefined}
                    selectPlot={() => {}}
                    trigger={<PopoverTrigger>Plots Error</PopoverTrigger>}
                >
                    <PlotsList
                        plots={undefined}
                        isLoading={false}
                        error={new Error('Plots Error')}
                        selectedPlotId={undefined}
                        selectPlot={() => {}}
                    />
                </PlotsPopoverMarkup>
                <PlotsPopoverMarkup
                    isOpen={true}
                    setIsOpen={() => {}}
                    selectedPlotId={undefined}
                    selectPlot={() => {}}
                    trigger={<PopoverTrigger>Plots Empty</PopoverTrigger>}
                >
                    <PlotsList
                        plots={[]}
                        isLoading={false}
                        error={null}
                        selectedPlotId={undefined}
                        selectPlot={() => {}}
                    />
                </PlotsPopoverMarkup>
            </div>
            <h2>Logs Popover</h2>
            <div className="not-prose wrap mt-120 flex w-full items-center justify-between gap-4">
                <LogsPopoverMarkup
                    isOpen={true}
                    setIsOpen={() => {}}
                    isLoading={false}
                    error={null}
                    selectedPlotId={1}
                    selectPlot={() => {}}
                    logs={[
                        {
                            id: 1,
                            logType: 'initial_grant',
                            oldBalance: 0,
                            newBalance: 100,
                            insertedAt: '2024-01-01T10:00:00Z',
                            plot: null,
                            diffs: null,
                            updatedAt: '2024-01-01T10:00:00Z',
                            plotId: null,
                            userId: 1,
                        },
                        {
                            id: 2,
                            logType: 'plot_created',
                            oldBalance: 100,
                            newBalance: 95,
                            insertedAt: '2024-01-01T11:00:00Z',
                            plot: {
                                id: 1,
                                name: 'My First Plot',
                                description: 'A beautiful plot',
                            },
                            diffs: null,
                            updatedAt: '2024-01-01T11:00:00Z',
                            plotId: 1,
                            userId: 1,
                        },
                        {
                            id: 3,
                            logType: 'bailout_grant',
                            oldBalance: 5,
                            newBalance: 50,
                            insertedAt: '2024-01-01T12:00:00Z',
                            plot: null,
                            diffs: null,
                            updatedAt: '2024-01-01T12:00:00Z',
                            plotId: null,
                            userId: 1,
                        },
                        {
                            id: 4,
                            logType: 'plot_deleted',
                            oldBalance: 50,
                            newBalance: 55,
                            insertedAt: '2024-01-01T13:00:00Z',
                            plot: null,
                            diffs: {
                                plotName: 'Deleted Plot',
                            },
                            updatedAt: '2024-01-01T13:00:00Z',
                            plotId: null,
                            userId: 1,
                        },
                        {
                            id: 5,
                            logType: 'vote_aggregate',
                            oldBalance: 55,
                            newBalance: 255,
                            insertedAt: '2024-01-01T14:00:00Z',
                            plot: null,
                            diffs: {
                                votesCast: [
                                    {
                                        plotId: 2,
                                        name: 'Cool Art',
                                        oldScore: 10,
                                        newScore: 11,
                                    },
                                    {
                                        plotId: 3,
                                        name: 'Sunset LandscapSunset LandscapSunset LandscapSunset LandscapSunset LandscapeeeeeSunset Landscape',
                                        oldScore: 5,
                                        newScore: 6,
                                    },
                                ],
                                votesReceived: [
                                    {
                                        plotId: 1,
                                        name: 'My First Plot',
                                        oldScore: 0,
                                        newScore: 2,
                                        voteCount: 2,
                                    },
                                ],
                            },
                            updatedAt: '2024-01-01T14:00:00Z',
                            plotId: null,
                            userId: 1,
                        },
                    ]}
                    anchor={{ current: null }}
                >
                    <PopoverTrigger>Logs</PopoverTrigger>
                </LogsPopoverMarkup>
                <LogsPopoverMarkup
                    isOpen={true}
                    setIsOpen={() => {}}
                    isLoading={true}
                    error={null}
                    logs={undefined}
                    anchor={{ current: null }}
                    selectedPlotId={1}
                    selectPlot={() => {}}
                >
                    <PopoverTrigger>Logs Loading</PopoverTrigger>
                </LogsPopoverMarkup>
                <LogsPopoverMarkup
                    isOpen={true}
                    setIsOpen={() => {}}
                    isLoading={false}
                    error={new Error('Logs Error')}
                    logs={undefined}
                    anchor={{ current: null }}
                    selectedPlotId={1}
                    selectPlot={() => {}}
                >
                    <PopoverTrigger>Logs Error</PopoverTrigger>
                </LogsPopoverMarkup>
                <LogsPopoverMarkup
                    isOpen={true}
                    setIsOpen={() => {}}
                    isLoading={false}
                    error={null}
                    logs={[]}
                    anchor={{ current: null }}
                    selectedPlotId={1}
                    selectPlot={() => {}}
                >
                    <PopoverTrigger>Logs Empty</PopoverTrigger>
                </LogsPopoverMarkup>
            </div>
            <h2>Admin</h2>
            <div className="not-prose wrap mt-120 flex w-full items-center justify-between gap-4">
                <AdminPopover>
                    <PopoverTrigger>
                        <Button>Admin</Button>
                    </PopoverTrigger>
                </AdminPopover>
            </div>
        </div>
    );
}
