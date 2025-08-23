import { Metadata } from 'next';

import { pageProse } from '@/components/page-prose';
import { cn } from '@/lib/utils';

import { KeyboardReference } from './component';

export const metadata: Metadata = {
	title: '42colors - keyboard reference',
	description: 'All keyboard and mouse shortcuts in 42colors',
};

export default function Page() {
	return (
		<div className={cn(...pageProse)}>
			<KeyboardReference />
		</div>
	);
}