'use client';

import { useRouter } from 'next/navigation';

import { Login } from '@/app/(auth)/login/_components/login';
import { H1 } from '@/components/dialog-headings';
import { dialogProse } from '@/components/dialog-prose';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export default function Page() {
    const router = useRouter();

    return (
        <Dialog open={true}>
            <DialogContent
                onInteractOutside={() => router.back()}
                className={cn(...dialogProse, 'w-100')}
            >
                <H1>Log in</H1>
                <Login />
            </DialogContent>
        </Dialog>
    );
}
