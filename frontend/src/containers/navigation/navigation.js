import React, { useEffect, useState } from 'react';
import { css } from 'styled-components/macro';
import Button from './button';
import Input from './input';
import { animateNavigationIn, animateNavigationOut } from './animations';

const styles = {
    root: css`
        top: 16px;
        left: 16px;
        position: absolute;
        display: flex;
        flex-direction: column;
        z-index: 15;

        padding: 16px;
        border-radius: 24px;
        background-color: rgba(240, 240, 240, 0.7);

        span,
        a {
            margin-right: 16px;
        }

        div {
            display: flex;
            flex-direction: row;
            align-items: center;
            margin-bottom: 16px;
            & > * {
                margin-right: 8px;
                &:last-child {
                    margin-right: 0;
                }
            }
            &:last-child {
                margin-bottom: 0;
            }
        }
    `,
    root2: css`
        position: relative;
    `,
};

export const Navigation = ({ currentMapPosition, setMapPosition }) => {
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        isHovered ? animateNavigationIn() : animateNavigationOut();
    }, [isHovered]);

    const change = (key, delta) => {
        if (!delta && delta !== 0) return;
        setMapPosition({ ...currentMapPosition, [key]: currentMapPosition[key] + delta });
    };

    const set = (key, value) => {
        if (!value && value !== 0) return;
        setMapPosition({ ...currentMapPosition, [key]: value });
    };

    return (
        <div
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            css={styles.root}
        >
            <div css={styles.root2}>
                <Button type="left" onClick={() => change('x', -100)}>
                    -
                </Button>
                <Input
                    name="x"
                    value={currentMapPosition.x}
                    onChange={event => set('x', parseInt(event.target.value))}
                />
                <Button type="right" onClick={() => change('x', 100)}>
                    +
                </Button>
            </div>
            <div css={styles.root2}>
                <Button type="left" onClick={() => change('y', -100)}>
                    -
                </Button>
                <Input
                    name="y"
                    value={currentMapPosition.y}
                    onChange={event => set('y', parseInt(event.target.value))}
                />
                <Button type="right" onClick={() => change('y', 100)}>
                    +
                </Button>
            </div>
        </div>
    );
};

export default Navigation;
