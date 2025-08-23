import { z } from 'zod';

import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';

import { store } from '../../store';
import { PlotError, createPlot } from './claimer.rest';
import { getIntersectionPolygons, rectToPolygonSchema, getCompositePolygons } from '../../geometry/polygon';
import { rectSchema } from '../../geometry/rect';

const plotCreateSchema = z.object({
    name: z
        .string()
        .min(1, 'Name is required')
        .max(255, 'Name must be less than 255 characters'),
    description: z
        .string()
        .max(1000, 'Description must be less than 1000 characters')
        .nullable(),
    polygon: z.any(),
});

type PlotCreateForm = z.infer<typeof plotCreateSchema>;

export function CreatePlotForm() {
    const [isOpen, setIsOpen] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        setError,
        reset,
    } = useForm<PlotCreateForm>({
        resolver: zodResolver(plotCreateSchema),
        defaultValues: {
            name: '',
            description: '',
        },
    });

    const { mutate: createPlotMutation } = useMutation({
        mutationFn: createPlot,
        onSuccess: (plot) => {
            const context = store.getSnapshot().context;
            context.queryClient?.invalidateQueries({
                queryKey: ['user', 'plots'],
            });
            store.trigger.completeClaim();
            store.trigger.selectPlot({ plotId: plot.id });
            setIsOpen(false);
            reset();
        },
        onError: (error) => {
            if (error instanceof PlotError) {
                Object.entries(error.errors).forEach(([field, messages]) => {
                    if (
                        field === 'name' ||
                        field === 'description' ||
                        field === 'polygon'
                    ) {
                        setError(field, {
                            type: 'server',
                            message: messages[0],
                        });
                    }
                });

                if (error.errors.general) {
                    setError('root', {
                        type: 'server',
                        message: error.errors.general[0],
                    });
                }
            } else {
                setError('root', { type: 'server', message: error.message });
            }
        },
    });

    const onSubmit = (data: PlotCreateForm) => {
        const context = store.getSnapshot().context;
        // Ensure we are in a claimer-active state and can compute the active polygon(s)
        if (
            context.state === 'initialized' &&
            context.activeAction?.type === 'claimer-active'
        ) {
            const rects = [...context.activeAction.rects];
            if (context.activeAction.nextRect != null) {
                rects.push(context.activeAction.nextRect);
            }
            // Merge rectangles into polygons as used by the backend
            const activePolygons = getCompositePolygons(
                rects.map((rect) => rectToPolygonSchema.parse(rect)),
            );

            // Compare against existing plots loaded in chunks
            const existingPolygons = Object.values(
                context.canvas.chunkCanvases,
            )
                .flatMap((chunk) => chunk.plots)
                .map((p) => p.polygon);

            const hasIntersection = activePolygons.some((ap) =>
                existingPolygons.some(
                    (ep) => getIntersectionPolygons(ap, ep).length > 0,
                ),
            );

            if (hasIntersection) {
                setError('polygon', {
                    type: 'client',
                    message:
                        'Your selection overlaps an existing plot. Adjust selection to avoid intersections.',
                });
                return;
            }
        }

        createPlotMutation({
            name: data.name.trim(),
            description: data.description?.trim(),
        });
    };

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);
        if (!open) {
            reset();
        }
    };

    return (
        <Popover open={isOpen} onOpenChange={handleOpenChange}>
            <PopoverTrigger
                render={(props) => <Button {...props}>Claim</Button>}
            />

            <PopoverContent className="w-80">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
                    <div>
                        <h3 className="mb-2 font-semibold">Create Plot</h3>
                    </div>

                    {errors.polygon && (
                        <div className="mb-2 text-sm text-red-600">
                            {String(errors.polygon?.message ?? errors.polygon)}
                        </div>
                    )}
                    {errors.root && (
                        <div className="mb-2 text-sm text-red-600">
                            {errors.root.message}
                        </div>
                    )}

                    <div className="space-y-1">
                        <label
                            htmlFor="create-name"
                            className="text-sm font-medium"
                        >
                            Name
                        </label>
                        <Input
                            id="create-name"
                            {...register('name')}
                            placeholder="Name"
                            disabled={isSubmitting}
                            className={errors.name ? 'border-red-500' : ''}
                        />
                        {errors.name && (
                            <div className="text-sm text-red-600">
                                {errors.name.message}
                            </div>
                        )}
                    </div>

                    <div className="space-y-1">
                        <label
                            htmlFor="create-description"
                            className="text-sm font-medium"
                        >
                            Description
                        </label>
                        <Input
                            id="create-description"
                            {...register('description')}
                            placeholder="Description"
                            disabled={isSubmitting}
                            className={
                                errors.description ? 'border-red-500' : ''
                            }
                        />
                        {errors.description && (
                            <div className="text-sm text-red-600">
                                {errors.description.message}
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end space-x-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsOpen(false)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Creating...' : 'Create'}
                        </Button>
                    </div>
                </form>
            </PopoverContent>
        </Popover>
    );
}
