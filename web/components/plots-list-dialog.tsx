import { useMemo } from 'react';

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogTitle,
	DialogTrigger,
	DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';

import { store } from '@/lib/store';
import { Plot, getUserPlots } from '@/lib/tools/claimer/claimer.rest';

export function PlotsListDialog() {
	const { data: plots } = useQuery({
		queryKey: ['user', 'plots'],
		queryFn: getUserPlots,
	});

	const sortedPlots: Plot[] | undefined = useMemo(() => {
		if (!plots) return plots;
		return [...plots].sort((a, b) => a.name.localeCompare(b.name));
	}, [plots]);

	return (
		<Dialog>
			<DialogTrigger render={(props) => (
				<Button variant="link" className="px-0" {...props}>
					plots
				</Button>
			)} />
			<DialogContent className="max-w-xl">
				<DialogTitle>All plots</DialogTitle>
				<DialogDescription>
					Select a plot to navigate to its location.
				</DialogDescription>
				<div className="mt-3 divide-y divide-primary/20">
					{sortedPlots?.map((plot) => (
						<DialogClose
							key={plot.id}
							render={(props) => (
								<button
									{...props}
									onClick={() => {
										store.trigger.selectPlot({ plotId: plot.id });
									}}
									className="block w-full px-2 py-2 text-left hover:bg-primary/5 focus:bg-primary/5 focus:outline-none"
								>
									<div className="text-base font-medium leading-tight">{plot.name}</div>
									{plot.description ? (
										<div className="text-sm text-muted-foreground line-clamp-2">
											{plot.description}
										</div>
									) : null}
								</button>
							)}
						/>
					))}
					{sortedPlots?.length === 0 ? (
						<div className="px-2 py-2 text-sm text-muted-foreground">No plots yet.</div>
					) : null}
				</div>
			</DialogContent>
		</Dialog>
	);
}