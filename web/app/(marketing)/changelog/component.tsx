import { format } from 'date-fns';

import { H1 } from '@/components/dialog-headings';
import { Link } from '@/components/link';

import { changelogUpdatedAt } from './updated-at';

function DateComponent({ date }: { date: Date }) {
    return (
        <time
            className={'font-bold text-primary'}
            dateTime={format(date, 'yyyy-MM-dd')}
        >
            {format(date, 'LLLL do')}
        </time>
    );
}

export default function Changelog() {
    return (
        <>
            <div className="mb-10 flex items-center justify-between">
                <H1>changelog</H1>
                <span className="text-primary">
                    (Updated <DateComponent date={changelogUpdatedAt} />)
                </span>
            </div>
            <p>A list of all that new and improved in 42colors.</p>
            <hr className="w-full border-t-2 border-border" />
            <ul>
                <li>
                    <DateComponent date={new Date('6/29/2025')} />
                    <ul>
                        <li>
                            Nobody cares until I actually have the MVP done.
                            Lots of changes have happened, but you&apos;ll just
                            have to wait until I ship the v1.
                        </li>
                    </ul>
                </li>
                <li>
                    <DateComponent date={new Date('3/10/2025')} />
                    <ul>
                        <li>
                            Created{' '}
                            <Link href="/design">
                                <code>/design</code>
                            </Link>{' '}
                            for iterating the design system. Basically a simpler
                            storybook.{' '}
                        </li>
                    </ul>
                </li>
                <li>
                    <DateComponent date={new Date('3/9/2025')} />
                    <ul>
                        <li>
                            Shipped an update preventing non authed users from
                            drawing.{' '}
                        </li>
                        <li>
                            Created a toast UI for explaining this to users.
                        </li>
                    </ul>
                </li>
                <li>
                    <DateComponent date={new Date('2/1/2025')} /> — Experimented
                    a bunch with how to efficiently transfer canvas data. I
                    settled on something that is sending binary data that only
                    includes the colors, they are then rendered based on the
                    offset of where they were fetched from. Since I&apos;m
                    limiting the color palette to 42 colors I am using 1 byte
                    for each &quot;pixel&quot; on the screen. This means I can
                    fetch a 400 x 400 tile and it&apos;s at most 16,000 bytes
                    before compression.
                    <br />
                    During this time I also setup file based cache for the
                    entire 10,000 x 10,000 canvas so that each request
                    doesn&apos;t hit the database. 100,000,000 bytes is only 95
                    MBs, so I could keep this in memory, but I plan on expanding
                    the canvas to by a factor of 10 so this file cache will
                    eventually be 9.5GBs.
                </li>{' '}
                <li>
                    <DateComponent date={new Date('1/10/2025')} /> — Started
                    working on the project again and created this route
                    interception pattern where all routes are modals by default.
                </li>{' '}
                <li>
                    <DateComponent date={new Date('11/17/2024')} /> — Created
                    this changelog
                </li>{' '}
            </ul>
        </>
    );
}
