'use client';

import { useRouter } from 'next/navigation';

import { ForgotPassword } from '@/app/(auth)/forgot-password/_components/forgot-password';
import { H1 } from '@/components/dialog-headings';
import { dialogProse } from '@/components/dialog-prose';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export default function Page() {
    const router = useRouter();

    return (
        <Dialog
            open={true}
            onOpenChange={(open) => {
                if (!open) {
                    router.back();
                }
            }}
        >
            <DialogContent className={cn(...dialogProse, 'w-110')}>
                <H1>Forgot Password</H1>
                <ForgotPassword />
            </DialogContent>
        </Dialog>
    );
}
