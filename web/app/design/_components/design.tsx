'use client';

import { Button } from '@/components/ui/button';
import { Toast, toast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

function ColorBlock({ variable }: { variable: string }) {
    return (
        <div
            className={cn(
                `relative w-30 aspect-square border-primary border-1.5`,
            )}
            style={{
                backgroundColor: `hsl(var(${variable}))`,
            }}
        >
            <code className="bg-primary text-xs text-secondary absolute top-0 left-0">
                {variable}
            </code>
        </div>
    );
}

export function DesignPage() {
    return (
        <div className="my-20 mx-10 prose max-w-full">
            <h1>Design</h1>
            The <i>storybook</i> of 42colors.
            <h2>Colors</h2>
            <div className="flex flex-wrap w-full gap-2">
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
                <div className="flex flex-wrap w-full gap-4 items-center">
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
                <div className="flex flex-wrap w-full gap-4 items-center">
                    <div className="text-md">Default</div>
                    <Button>default</Button>
                    <Button variant="destructive">destructive</Button>
                    <Button variant="outline">outline</Button>
                    <Button variant="link">link</Button>
                </div>
            </div>
            <h2>Toast</h2>
            <div className="not-prose flex wrap w-full gap-4 items-center">
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
        </div>
    );
}
