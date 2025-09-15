'use client';

import { PlotsPopoverMarkup } from '@/components/plots-popover';
import { Button } from '@/components/ui/button';
import { PopoverTrigger } from '@/components/ui/popover';
import { Toast, toast } from '@/components/ui/toast';
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
            <div className="not-prose wrap flex w-full items-center gap-4">
                <Button
                    onClick={() =>
                        toast({
                            title: 'Login (when you are ready)',
                            description: 'to save and share your pixels',
                            button: {
                                label: 'login',
                                onClick: () => {},
                            },
                        })
                    }
                >
                    spawn
                </Button>
                <Toast
                    id={'1'}
                    title="Login (when you are ready)"
                    description="to save and share your pixels"
                    button={{
                        label: 'login',
                        onClick: () => {},
                    }}
                />
            </div>
            <h2>Plots Popover</h2>
            <div className="not-prose wrap mt-80 flex w-full items-center justify-between gap-4">
                <PlotsPopoverMarkup
                    isOpen={true}
                    setIsOpen={() => {}}
                    isLoading={false}
                    error={null}
                    plots={[
                        {
                            id: 2,
                            name: 'Plot No Polygon',
                            description: 'Plot 2 Description',
                            // @ts-expect-error - polygon is null
                            polygon: null,
                            insertedAt: '2021-01-01',
                            updatedAt: '2021-01-01',
                        },
                        {
                            id: 3,
                            name: 'Plot 3',
                            description: 'Plot 3 Description',
                            polygon: polygonSchema.parse({
                                vertices: [
                                    [0, 0],
                                    [0, 1],
                                    [1, 1],
                                    [1, 0],
                                    [0, 0],
                                ],
                            }),
                            insertedAt: '2021-01-01',
                            updatedAt: '2021-01-01',
                        },

                        {
                            id: 4,
                            name: 'Plot 4 With Long Description',
                            description:
                                'Plot 4 Description Officia officia aliqua incididunt reprehenderit ea quis irure laboris. Officia officia aliqua incididunt reprehenderit ea quis irure laboris.',
                            // @ts-expect-error - polygon is null
                            polygon: null,
                            insertedAt: '2021-01-01',
                            updatedAt: '2021-01-01',
                        },
                    ]}
                    selectedPlotId={2}
                    selectPlot={() => {}}
                >
                    <PopoverTrigger>Plots</PopoverTrigger>
                </PlotsPopoverMarkup>
                <PlotsPopoverMarkup
                    isOpen={true}
                    setIsOpen={() => {}}
                    isLoading={true}
                    error={null}
                    plots={[]}
                    selectedPlotId={undefined}
                    selectPlot={() => {}}
                >
                    <PopoverTrigger>Plots Loading</PopoverTrigger>
                </PlotsPopoverMarkup>
                <PlotsPopoverMarkup
                    isOpen={true}
                    setIsOpen={() => {}}
                    isLoading={false}
                    error={new Error('Plots Error')}
                    plots={[]}
                    selectedPlotId={undefined}
                    selectPlot={() => {}}
                >
                    <PopoverTrigger>Plots Error</PopoverTrigger>
                </PlotsPopoverMarkup>
                <PlotsPopoverMarkup
                    isOpen={true}
                    setIsOpen={() => {}}
                    isLoading={false}
                    error={null}
                    plots={[]}
                    selectedPlotId={undefined}
                    selectPlot={() => {}}
                >
                    <PopoverTrigger>Plots Empty</PopoverTrigger>
                </PlotsPopoverMarkup>
            </div>
        </div>
    );
}
