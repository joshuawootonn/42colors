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
                    <DateComponent date={new Date('11/05/2025')} />
                    <ul>
                        <li>
                            Show the title of a plot when it&apos;s selected.
                            <video
                                src="/changelog/25-11-05-selected-plot-popover-title.mp4"
                                muted
                                controls
                                className="mt-4 border border-border"
                            />
                        </li>
                    </ul>
                </li>
                <li>
                    <DateComponent date={new Date('11/04/2025')} /> - BIG day
                    <ul>
                        <li>
                            Make is so you could drag from outside the polygon
                            to add new vertices when editing an existing plot.
                            <video
                                src="/changelog/25-11-04-dragging-rectangle-plot-edit.mp4"
                                muted
                                controls
                                className="mt-4 border border-border"
                            />
                        </li>
                        <li>
                            Made it so you could drag the points of your polygon
                            when creating a new plot.
                            <video
                                src="/changelog/25-11-04-dragging-handles-plot-create.mp4"
                                muted
                                controls
                                className="mt-4 border border-border"
                            />
                        </li>
                        <li>
                            Created the line tool.
                            <video
                                src="/changelog/25-11-04-create-line-tool.mp4"
                                muted
                                controls
                                className="mt-4 border border-border"
                            />
                        </li>
                    </ul>
                </li>
                <li>
                    <DateComponent date={new Date('11/03/2025')} /> —
                    42colors.com now auto-selects the plot in the middle of your
                    screen and displays a menu for common ops.
                    <video
                        src="/changelog/25-11-03-overlay-popover.mp4"
                        muted
                        controls
                        className="mt-4 border border-border"
                    />
                    This popover favors the bottom side, but will switch to the
                    top position to prevent overflow, and while your scrolling,
                    pointer events are ignored, so that your cursor doesn&apos;t
                    get stuck.
                    <video
                        src="/changelog/25-11-03-overlay-popover-edge.mp4"
                        muted
                        controls
                        className="mt-4 border border-border"
                    />
                </li>
                <li>
                    <DateComponent date={new Date('11/02/2025')} /> — MVP is in
                    sight. Going to start posting on here now.
                </li>
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
