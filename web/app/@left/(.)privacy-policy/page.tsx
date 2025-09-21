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
            <DialogContent
                // There's nothing here to focus except for the contact me form, which I don't really want to focus, so I'm preventing autofocus for this dialogue.
                initialFocus={() => {
                    return { current: null };
                }}
                className={cn(...dialogProse, 'w-157')}
            >
                <PrivacyPolicy />
            </DialogContent>
        </Dialog>
    );
}
