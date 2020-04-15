import React, { createContext, useCallback, useContext, useEffect, useState, FC } from 'react';
import { usePrevious } from 'react-use';
import { Point } from '../../models';
import { useHistory } from 'react-router-dom';
import { useMapPositionQueryString } from './useMapPositionQueryString';
import { useMousePosition } from './useMousePosition';
import { useKeyPress } from './useKeyPress';

const MapPositionContext = createContext<[boolean, Point, (point: Point) => void]>([
    false,
    { x: 0, y: 0 },
    () => console.log('Map Position Context hasnt mounted yet'),
]);

export const useMapPosition = () => useContext(MapPositionContext);

export const MapPositionProvider: FC = ({ children }) => {
    const [currentMap, setCurrentMap] = useState({ x: 0, y: 0 });
    const mouse = useMousePosition();
    const prevMouse = usePrevious(mouse);
    const isPanning = useKeyPress('Space');
    const history = useHistory();

    const mapPositionQueryString = useMapPositionQueryString();

    useEffect(() => {
        if (mapPositionQueryString.isValid) {
            setCurrentMap(mapPositionQueryString.mapPosition);
        }
    }, []);

    useEffect(() => {
        if (!isPanning) {
            history.push(`/?x=${currentMap.x}&y=${currentMap.y}`);
        }
    }, [isPanning, JSON.stringify(currentMap)]);

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
            {children}
        </MapPositionContext.Provider>
    );
};
