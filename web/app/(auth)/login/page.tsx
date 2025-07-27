import { H1 } from '@/components/dialog-headings';
import { pageProse } from '@/components/page-prose';
import { cn } from '@/lib/utils';

import { Login } from './_components/login';

export default function Page() {
    return (
        <main
            className={cn(
                ...pageProse,
                'items-left mx-auto mt-20 flex w-100 flex-col justify-center',
            )}
        >
            <H1>Log in</H1>
            <Login />
        </main>
    );
}
