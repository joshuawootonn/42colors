import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { usePrevious } from 'react-use';
import { Point } from '../models';

function useKeyPress(targetKey: string) {
    const [isKeyPressed, setIsKeyPressed] = useState(false);
    function handleKeyDown({ code }: KeyboardEvent) {
        if (code === targetKey) {
            setIsKeyPressed(true);
        }
    }
    const handleKeyUp = ({ code }: KeyboardEvent) => {
        if (code === targetKey) {
            setIsKeyPressed(false);
        }
    };
    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        // Remove event listeners on cleanup
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);
    return isKeyPressed;
}

/**
 * stole from here:
 * https://github.com/rehooks/window-mouse-position/blob/master/index.js
 */
const useMousePosition = () => {
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

const MapPositionContext = createContext<[boolean, Point, (point: Point) => void]>([
    false,
    { x: 0, y: 0 },
    () => {},
]);

export const useMapPosition = () => useContext(MapPositionContext);

export const MapPositionProvider: React.FC = props => {
    const [currentMap, setCurrentMap] = useState({ x: 0, y: 0 });
    const mouse = useMousePosition();
    const prevMouse = usePrevious(mouse);
    const isPanning = useKeyPress('Space');

    const setCurrentMapValue = useCallback((point: Point) => {
        setCurrentMap(point);
    }, []);

    useEffect(() => {
        if (isPanning && prevMouse !== undefined && mouse !== undefined) {
            if (Math.abs(prevMouse.x - mouse.x) > 10 || Math.abs(prevMouse.y - mouse.y) > 10) {
                const changeInMousePosition = {
                    x: prevMouse.x - mouse.x,
                    y: prevMouse.y - mouse.y,
                };
                setCurrentMap({
                    x: currentMap.x + changeInMousePosition.x,
                    y: currentMap.y + changeInMousePosition.y,
                });
            }
        }
    }, [isPanning, mouse]);

    return (
        <MapPositionContext.Provider value={[isPanning, currentMap, setCurrentMapValue]}>
            {props.children}
        </MapPositionContext.Provider>
    );
};
