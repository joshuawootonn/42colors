'use client';

import { setCookie } from 'cookies-next';

import { useRouter } from 'next/navigation';

import { About } from '@/app/(marketing)/about/component';
import { dialogProse } from '@/components/dialog-prose';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { INTRO_SEEN } from '@/lib/storage-keys';
import { cn } from '@/lib/utils';

export default function Page() {
    const router = useRouter();
    return (
        <Dialog
            open={true}
            onOpenChange={(next) => {
                if (!next) {
                    setCookie(INTRO_SEEN, 'true');
                }
                if (next === false) {
                    router.back();
                }
            }}
        >
            <DialogContent className={cn(...dialogProse, 'w-157 pt-2')}>
                <About />
            </DialogContent>
        </Dialog>
    );
}
