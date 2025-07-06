import { H1 } from '@/components/dialog-headings';
import { Link } from '@/components/link';
import { Logo } from '@/components/logo';

export function About() {
    return (
        <>
            <H1 className="">
                <i>Welcome</i> to{' '}
                <Logo height={40} className="inline -translate-y-1" />
            </H1>
            <p>a pixel art editor and game</p>
            <p>
                <b>Vision: </b> You start with a grant for ten thousand pixels.
                After surveying the canvas, your first goal will be to claim
                some land. Next, it&apos;s time to draw (something dope of
                course). When you are done, people can upvote or downvote your
                art, which decides whether you get more pixels or not. Pixels
                are currency.{' '}
            </p>

            <p>
                <b>Status: </b> This project is a WIP. My energy has been going
                to learning elixir, optimizing canvas, and optimizing data
                caching and transfer. As of the end of March 2025 I&apos;ve
                finally created a halfway decent brush and added relative zoom.
                More improvements to the brush tool are on the way!
            </p>

            <p>
                I can&apos;t wait to see the art people create under the same
                constraints. Follow along on{' '}
                <Link href="https://x.com/JoshWootonn">twitter</Link> or{' '}
                <Link href="https://github.com/joshuawootonn/42colors">
                    github
                </Link>
                .
            </p>
        </>
    );
}
