import React, { useCallback, useEffect, useState } from 'react';
import { css } from 'styled-components/macro';
import { useInterval } from 'react-use';
import { wiggle } from '../../assets/keyframes/wiggle';
import Button from './button';

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
    input: css`
        width: 65px;
        border: none;
        border-radius: 12px;
        padding: 8px;
    `,
};

export const Navigation = ({ currentMapPosition, setMapPosition }) => {
    const change = (key, delta) => {
        setMapPosition({ ...currentMapPosition, [key]: currentMapPosition[key] + delta });
    };
    const set = (key, value) => {
        setMapPosition({ ...currentMapPosition, [key]: value });
    };
    return (
        <div css={styles.root}>
            <div>
                <Button target={'subX'} onClick={() => change('x', -100)}>
                    -
                </Button>
                <input
                    css={styles.input}
                    name="x"
                    type="number"
                    min="-1000000"
                    max="1000000"
                    step={100}
                    value={currentMapPosition.x}
                    onChange={event => set('x', parseInt(event.target.value))}
                />
                <Button target={'addX'} onClick={() => change('x', 100)}>
                    +
                </Button>
            </div>
            <div>
                <Button target={'subY'} onClick={() => change('y', -100)}>
                    -
                </Button>
                <input
                    css={styles.input}
                    name="y"
                    type="number"
                    min="-1000000"
                    max="1000000"
                    step={100}
                    value={currentMapPosition.y}
                    onChange={event =>
                        setMapPosition({ ...currentMapPosition, y: parseInt(event.target.value) })
                    }
                />
                <Button target={'addY'} onClick={() => change('y', 100)}>
                    +
                </Button>
            </div>
        </div>
    );
};

export default Navigation;
