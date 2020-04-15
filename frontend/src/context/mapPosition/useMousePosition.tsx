import { useEffect, useState } from 'react';
import { Point } from '../../models';

/**
 * stole from here:
 * https://github.com/rehooks/window-mouse-position/blob/master/index.js
 */
export const useMousePosition = () => {
    const [mousePosition, setMousePosition] = useState<Point>({
        x: 0,
        y: 0,
    });

    function handleMouseMove(e: MouseEvent) {
        setMousePosition({
            x: e.pageX,
            y: e.pageY,
        });
    }
    useEffect(() => {
        window.addEventListener('mousemove', handleMouseMove);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);
    return mousePosition;
};