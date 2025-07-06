'use client';

import { useRouter } from 'next/navigation';

import { PrivacyPolicy } from '@/app/(marketing)/privacy-policy/component';
import { dialogProse } from '@/components/dialog-prose';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export default function Page() {
    const router = useRouter();
    return (
        <Dialog
            open={true}
            onOpenChange={(next) => {
                if (next === false) {
                    router.back();
                }
            }}
        >
            <DialogContent className={cn(...dialogProse, 'w-157')}>
                <PrivacyPolicy />
            </DialogContent>
        </Dialog>
    );
}
