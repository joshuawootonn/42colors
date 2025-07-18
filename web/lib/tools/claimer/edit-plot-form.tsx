import { z } from 'zod';

import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';
import { Input } from '@/components/ui/input';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import * as Tooltip from '@/components/ui/tooltip';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';

import { store } from '../../store';
import { type Plot, PlotError, updatePlot } from './claimer.rest';

const plotUpdateSchema = z.object({
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

type PlotUpdateForm = z.infer<typeof plotUpdateSchema>;

interface EditPlotFormProps {
    plot: Plot;
}

export function EditPlotForm({ plot }: EditPlotFormProps) {
    const [isOpen, setIsOpen] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        setError,
        reset,
    } = useForm<PlotUpdateForm>({
        resolver: zodResolver(plotUpdateSchema),
        defaultValues: {
            name: plot.name,
            description: plot.description,
        },
    });

    const { mutate: updatePlotMutation } = useMutation({
        mutationFn: ({
            plotId,
            plot,
        }: {
            plotId: number;
            plot: Partial<Pick<Plot, 'name' | 'description'>>;
        }) => updatePlot(plotId, plot),
        onSuccess: () => {
            store.getSnapshot().context.queryClient?.invalidateQueries({
                queryKey: ['user', 'plots'],
            });
            store.trigger.redrawRealtimeCanvas();
            setIsOpen(false);
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

    const onSubmit = (data: PlotUpdateForm) => {
        updatePlotMutation({
            plotId: plot.id,
            plot: data,
        });
    };

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);
        if (open) {
            reset({
                name: plot.name,
                description: plot.description,
            });
        }
    };

    return (
        <Popover open={isOpen} onOpenChange={handleOpenChange}>
            <Tooltip.Root>
                <Tooltip.Trigger
                    render={
                        <PopoverTrigger>
                            <IconButton className="text-black -translate-x-[1px]">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="32"
                                    height="32"
                                    viewBox="-4 -4 32 32"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z" />
                                    <circle
                                        cx="7.5"
                                        cy="7.5"
                                        r=".5"
                                        fill="currentColor"
                                    />
                                </svg>
                            </IconButton>
                        </PopoverTrigger>
                    }
                />
                <Tooltip.Portal>
                    <Tooltip.Positioner>
                        <Tooltip.Popup>
                            <Tooltip.Arrow />
                            Edit
                        </Tooltip.Popup>
                    </Tooltip.Positioner>
                </Tooltip.Portal>
            </Tooltip.Root>

            <PopoverContent className="w-80">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
                    <div>
                        <h3 className="font-semibold mb-2">Edit Plot</h3>
                    </div>

                    {errors.polygon && (
                        <div className="text-red-600 text-sm mb-2">
                            {String(errors.polygon?.message ?? errors.polygon)}
                        </div>
                    )}
                    {errors.root && (
                        <div className="text-red-600 text-sm mb-2">
                            {errors.root.message}
                        </div>
                    )}

                    <div className="space-y-1">
                        <label
                            htmlFor="edit-name"
                            className="text-sm font-medium"
                        >
                            Name
                        </label>
                        <Input
                            id="edit-name"
                            {...register('name')}
                            placeholder="Name"
                            disabled={isSubmitting}
                            className={errors.name ? 'border-red-500' : ''}
                        />
                        {errors.name && (
                            <div className="text-red-600 text-sm">
                                {errors.name.message}
                            </div>
                        )}
                    </div>

                    <div className="space-y-1">
                        <label
                            htmlFor="edit-description"
                            className="text-sm font-medium"
                        >
                            Description
                        </label>
                        <Input
                            id="edit-description"
                            {...register('description')}
                            placeholder="Description"
                            disabled={isSubmitting}
                            className={
                                errors.description ? 'border-red-500' : ''
                            }
                        />
                        {errors.description && (
                            <div className="text-red-600 text-sm">
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
                            {isSubmitting ? 'Saving...' : 'Save'}
                        </Button>
                    </div>
                </form>
            </PopoverContent>
        </Popover>
    );
}
