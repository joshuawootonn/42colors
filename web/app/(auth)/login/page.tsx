import { H1 } from '@/components/dialog-headings';
import { pageProse } from '@/components/page-prose';
import { cn } from '@/lib/utils';

import { Login } from './_components/login';

export default function Page() {
    return (
        <main
            className={cn(
                ...pageProse,
                'mt-20 mx-auto flex flex-col justify-center items-left w-100',
            )}
        >
            <H1>Log in</H1>
            <Login />
        </main>
    );
}
