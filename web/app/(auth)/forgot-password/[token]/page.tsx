import { H1 } from '@/components/dialog-headings';
import { pageProse } from '@/components/page-prose';
import { cn } from '@/lib/utils';

import { UpdatePassword } from './_components/signup';

export default async function Page({
    params,
}: {
    params: Promise<{ token: string }>;
}) {
    const { token } = await params;
    return (
        <main
            className={cn(
                ...pageProse,
                'items-left mx-auto mt-20 flex w-110 flex-col justify-center',
            )}
        >
            <H1>Update password</H1>
            <UpdatePassword token={token} />
        </main>
    );
}
