import React, { useEffect } from 'react';
import { css } from 'styled-components/macro';
import anime from 'animejs';
import { useBoolean } from 'react-use';
import { wiggle } from '../../../assets/keyframes/wiggle';

const styles = {
    root: css`
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        padding: 16px;
        button {
            margin-right: 6px;
        }
        button:last-child {
            margin-right: 0px;
        }
    `,
    button: css`
        opacity: 0;
        display: inline-block;
        border-radius: 12px;
        outline: none;
        border: none;

        height: 48px;
        width: 48px;

        transition: all 100ms;

        &:hover,
        &:active {
            transform-origin: center;
            animation: 400ms ${wiggle} ease infinite;
        }
    `,
};

const animation = {
    targets: '[data-animate=color-block]',
    translateX: [270, 0],
    opacity: [0, 1],
    duration: 400,
};

export const colors = [
    '#223343',
    '#cecece',
    '#9e7b51',
    '#ef3f3f',
    '#feb949',
    '#fffb97',
    '#8cf28c',
    '#6dffff',
    '#ff87c4',
    '#b75fe6',
];

const ColorInput = ({ value, onChange }) => {
    const [isActive, toggleActive] = useBoolean(false);

    useEffect(() => {
        isActive ? anime({ ...animation, delay: anime.stagger(4) }) : anime(animation);
    }, [isActive]);

    const onClick = e => {
        e.preventDefault();
        isActive && onChange(e);
        toggleActive();
    };

    return (
        <div css={styles.root}>
            {isActive ? (
                colors.map((color, i) => (
                    <button
                        css={styles.button}
                        style={{
                            backgroundColor: color,
                        }}
                        data-animate="color-block"
                        key={i}
                        onClick={onClick}
                        value={color}
                        color={color}
                    />
                ))
            ) : (
                <button
                    css={styles.button}
                    style={{
                        backgroundColor: value,
                    }}
                    data-animate="color-block"
                    onClick={onClick}
                    value={value}
                    color={value}
                />
            )}
        </div>
    );
};
export default ColorInput;
