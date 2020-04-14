import React, { useEffect, useRef, useState } from 'react';
import { css } from 'styled-components/macro';
import { colors } from '../containers/controls/color/colorInput';
import anime from 'animejs';
import { wiggle } from '../assets/keyframes/wiggle';

const styles = {
    root: css`
        bottom: 16px;
        left: 16px;
        position: absolute;
        display: flex;
        z-index: 15;
        flex-direction: column;
        max-width: 300px;

        padding: 16px;
        border-radius: 24px;
        background-color: rgba(240, 240, 240, 0.7);

        h1 {
            font-weight: bold;
            font-size: 25px;
        }
        p {
            font-size: 16px;
        }
    `,
    expanded: css`
        h1,
        p {
            margin-bottom: 16px;
        }
    `,
    linkBox: css`
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;

        & > * {
            margin-right: 16px;
            margin-bottom: 16px;
            &:last-child {
                margin-right: 0;
                margin-bottom: 0;
            }
        }
    `,
    link: css`
        text-decoration: none;
        color: ${colors[0]};
        background-color: ${colors[6]};
        padding: 12px 16px;
        border-radius: 16px;
        &:hover,
        &:active {
            transform-origin: center;
            animation: 400ms ${wiggle} ease infinite;
        }
    `,
};

const contentAnimation = {
    targets: '[data-animate=brand-content]',
    translateX: [-50, 0],
    opacity: [0, 1],
    duration: 400,
};

export const Brand = () => {
    const brandRef = useRef(null);
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        isHovered
            ? anime({ ...contentAnimation, delay: anime.stagger(200, { start: 100 }) })
            : anime({ ...contentAnimation });
    }, [isHovered]);

    return (
        <div
            data-animate="brand-root"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            ref={brandRef}
            css={[styles.root, isHovered && styles.expanded]}
        >
            <h1 data-animate="brand-content">42Colors</h1>
            {isHovered && (
                <>
                    <p data-animate="brand-content">
                        Hello! 42Colors is a side project I made to explore canvas, anime.js, and
                        postgis
                    </p>
                    <p data-animate="brand-content">
                        The idea came from a combination of a bunch of curiosity, but Figma was a
                        big inspiration! I would love any feedback you have :)
                    </p>
                    <p data-animate="brand-content">-Josh</p>
                    <div css={styles.linkBox}>
                        <a
                            data-animate="brand-content"
                            css={styles.link}
                            href="http://www.joshuawootonn.com"
                        >
                            my _corner of the web_
                        </a>
                        <a
                            data-animate="brand-content"
                            css={styles.link}
                            href="https://github.com/joshuawootonn/42colors"
                        >
                            source code
                        </a>
                        <a
                            data-animate="brand-content"
                            css={styles.link}
                            href="https://github.com/joshuawootonn/42colors/issues"
                        >
                            where to contribute your hot feature idea
                        </a>
                    </div>
                </>
            )}
        </div>
    );
};

export default Brand;
