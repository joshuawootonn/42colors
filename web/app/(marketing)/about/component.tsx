'use client';

import { useSearchParams } from 'next/navigation';

import { H1 } from '@/components/dialog-headings';
import { EmailLink } from '@/components/email-link';
import { Link } from '@/components/link';
import { Logo } from '@/components/logo';

export function About() {
    const searchParams = useSearchParams();

    return (
        <>
            <H1 className="">
                <i>Welcome</i> to{' '}
                <Logo height={40} className="inline -translate-y-1" />
            </H1>
            <p>— a pixel art editor and social game</p>

            <p>
                Start with a grant for four thousand pixels, survey the canvas,
                find a fitting spot, and when you do claim a part of the canvas.
            </p>

            <p>
                Next, it&apos;s time to draw, something dope of course. When you
                have, people will visit and vote on your art, which will
                determine whether you get more pixels — the currency of this
                world.
            </p>

            <p>
                Your first claim will be small, as four thousand is only so
                much. But as you come back and visit you&apos;ll be granted more
                pixels for more art and such.
            </p>

            <p>I can&apos;t wait to see what you create. ✨</p>

            <div className="flex items-center gap-2">
                <EmailLink className="svg-outline-sm relative text-primary underline decoration-[1.5px] underline-offset-2 outline-none">
                    email
                </EmailLink>
                —
                <Link
                    href="https://x.com/JoshWootonn"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    twitter
                </Link>
                —
                <Link
                    href="https://github.com/joshuawootonn/42colors"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    github
                </Link>
                —
                <Link
                    href={{
                        pathname: '/changelog',
                        query: searchParams.toString(),
                    }}
                >
                    changelog
                </Link>
            </div>
        </>
    );
}
