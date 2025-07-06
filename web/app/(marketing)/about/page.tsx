import { Metadata } from 'next';

import { pageProse } from '@/components/page-prose';
import { cn } from '@/lib/utils';

import { About } from './component';

export const metadata: Metadata = {
    title: '42colors - about',
    description: 'What is 42colors?',
};

export default function Page() {
    return (
        <main className={cn(...pageProse, 'mt-10')}>
            <About />
        </main>
    );
}
