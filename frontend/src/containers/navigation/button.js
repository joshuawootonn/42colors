import React, { useCallback, useEffect, useState } from 'react';
import { css } from 'styled-components/macro';
import anime from 'animejs';

const styles = {
    button: css`
        border: none;
        background-color: white;
        border-radius: 12px;
        padding: 8px;
    `,
};

const Button = ({ onClick, children, ...props }) => {
    const [startLongPress, setStartLongPress] = useState(false);

    const animateTarget = `navigation-button-${props.target}`;

    useEffect(() => {
        let timerId;
        if (startLongPress) {
            timerId = setTimeout(() => {
                onClick();
                anime({
                    targets: `[data-animate=${animateTarget}]`,
                    duration: 100,
                    keyframes: [{ scale: 1.05 }, { scale: 1 }, { scale: 1.05 }],
                });
            }, 200);
        } else {
            clearTimeout(timerId);
        }

        return () => {
            clearTimeout(timerId);
        };
    }, [onClick, startLongPress, children]);

    const start = useCallback(() => {
        setStartLongPress(true);
    }, []);
    const stop = useCallback(() => {
        setStartLongPress(false);
    }, []);

    const listeners = {
        onMouseDown: start,
        onMouseUp: stop,
        onMouseLeave: stop,
        onTouchStart: start,
        onTouchEnd: stop,
    };

    return (
        <button
            data-animate={animateTarget}
            css={styles.button}
            onClick={onClick}
            {...props}
            {...listeners}
        >
            {children}
        </button>
    );
};

export default Button;
