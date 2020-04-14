import React, { useEffect, useState } from 'react';
import { css } from 'styled-components/macro';
import { wiggle } from '../../assets/keyframes/wiggle';
import { buttonAnimationTag, buttonTarget } from './animations';

const styles = {
    root: css`
        border: none;
        background-color: white;
        border-radius: 12px;
        padding: 8px;
        position: absolute;
        &:hover,
        &:active {
            transform-origin: center;
            animation: 400ms ${wiggle} ease infinite;
        }
    `,
    left: css`
        left: 0;
    `,
    right: css`
        right: 0;
    `,
};

const Button = ({ type, onClick, children, ...props }) => {
    const [startLongPress, setStartLongPress] = useState(false);

    useEffect(() => {
        let timerId;
        if (startLongPress) {
            timerId = setTimeout(onClick, 200);
        } else {
            clearTimeout(timerId);
        }
        return () => clearTimeout(timerId);
    }, [onClick, startLongPress, children]);

    const start = () => setStartLongPress(true);

    const stop = () => setStartLongPress(false);

    const listeners = {
        onMouseDown: start,
        onMouseUp: stop,
        onMouseLeave: stop,
        onTouchStart: start,
        onTouchEnd: stop,
    };

    return (
        <button
            data-animate={buttonAnimationTag}
            css={[styles.root, type === 'left' ? styles.left : styles.right]}
            onClick={onClick}
            {...props}
            {...listeners}
        >
            {children}
        </button>
    );
};

export default Button;
