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
        min-height: 48px;
        min-width: 48px;
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
        border-radius: 50%;
        outline: none;
        border: none;

        transition: all 100ms;

        &:hover,
        &:active {
            transform-origin: center;
            animation: 400ms ${wiggle} ease infinite;
        }
    `,
};

const animation = {
    targets: '[data-animate=size-block]',
    translateX: [270, 0],
    opacity: [0, 1],
    duration: 400,
};

export const sizes = [20, 25, 30, 40, 50];

const SizeInput = ({ value, onChange, color }) => {
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
                sizes.map((size, i) => (
                    <button
                        css={styles.button}
                        style={{
                            height: `${size}px`,
                            width: `${size}px`,
                            backgroundColor: color,
                        }}
                        data-animate="size-block"
                        key={i}
                        onClick={onClick}
                        value={size / 2}
                    />
                ))
            ) : (
                <button
                    css={styles.button}
                    style={{
                        height: `${value * 2}px`,
                        width: `${value * 2}px`,
                        backgroundColor: color,
                    }}
                    data-animate="size-block"
                    onClick={onClick}
                    value={value / 2}
                />
            )}
        </div>
    );
};
export default SizeInput;
