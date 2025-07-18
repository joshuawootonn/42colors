import { Metadata } from 'next';

import { pageProse } from '@/components/page-prose';
import { cn } from '@/lib/utils';

import { TermsOfService } from './component';

export const metadata: Metadata = {
    title: '42colors - terms of service',
    description: 'The Terms of Service for 42colors',
};

export default function Page() {
    return (
        <div className={cn(...pageProse)}>
            <TermsOfService />
        </div>
    );
}
