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
                'mt-20 mx-auto flex flex-col justify-center items-left w-110',
            )}
        >
            <H1>Update password</H1>
            <UpdatePassword token={token} />
        </main>
    );
}
