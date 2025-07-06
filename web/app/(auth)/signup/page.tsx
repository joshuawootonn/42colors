import { H1 } from '@/components/dialog-headings';
import { pageProse } from '@/components/page-prose';
import { cn } from '@/lib/utils';

import { Signup } from './_components/signup';

export default function Page() {
    return (
        <main
            className={cn(
                ...pageProse,
                'mt-20 mx-auto flex flex-col justify-center items-left w-100',
            )}
        >
            <H1>Sign up</H1>
            <Signup />
        </main>
    );
}
