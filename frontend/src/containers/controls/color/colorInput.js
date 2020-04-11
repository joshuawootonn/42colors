import React, { useEffect } from 'react';
import { keyframes, css } from 'styled-components/macro';
import anime from 'animejs';
import { useBoolean } from 'react-use';

const wiggle = keyframes`
    0% {
        transform: scale(1.05) 
    }
    50% {
        transform: scale(1) 
    }
    100% {
        transform: scale(1.05) 
    }
`;

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
        background-color: ${props => props.color};
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
    targets: '[data-animate=colorBlock]',
    translateX: [270, 0],
    opacity: [0, 1],
    duration: 400,
};

const ColorInput = ({ value, name, onChange, options }) => {
    const [isActive, toggleActive] = useBoolean(false);

    useEffect(() => {
        isActive ? anime({ ...animation, delay: anime.stagger(4) }) : anime(animation);
    }, [isActive]);

    const onClick = e => {
        e.preventDefault();
        isActive && onChange(e.target.value);
        toggleActive();
    };

    return (
        <div css={styles.root}>
            {isActive ? (
                options.map((color, i) => (
                    <button
                        css={styles.button}
                        data-animate="colorBlock"
                        key={i}
                        onClick={onClick}
                        value={color}
                        color={color}
                    />
                ))
            ) : (
                <button
                    css={styles.button}
                    data-animate="colorBlock"
                    onClick={onClick}
                    value={value}
                    color={value}
                />
            )}
        </div>
    );
};
export default ColorInput;
