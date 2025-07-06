import { redirect } from 'next/navigation';

import authService from '@/lib/auth';

export default async function Page({
    params,
}: {
    params: Promise<{ token: string }>;
}) {
    const token = (await params).token;

    await authService.confirmEmail(token);

    redirect('/');
}
