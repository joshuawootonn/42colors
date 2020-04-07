import React, { createContext, FC, useCallback, useContext, useEffect, useState } from 'react';
import { useInterval, usePrevious } from 'react-use';
import { getAllLines, postLine } from '../repositories/canvas.repositories';
import { Line, Point } from '../models';
import { useMapPosition } from './mapPosition.context';

interface LineContextState {
    isInitializing: boolean;
    lines: Line[];
    fetchLines: () => Promise<void>;
    createLine: (line: Line) => Promise<void>;
}

// @ts-ignore
const LineContext = createContext<LineContextState>(null);

export const useLines = (): LineContextState => useContext(LineContext);

interface LineProviderProps {
    interval: number;
}

export const LineProvider: FC<LineProviderProps> = props => {
    const [isPanning, mapPosition] = useMapPosition();
    const [isInitializing, setIsInitializing] = useState(true);
    const [lines, setLines] = useState<Line[]>([]);

    const fetchLines = useCallback(async () => {
        const fetchedLines = await getAllLines();
        setIsInitializing(false);
        if (fetchedLines && fetchedLines.length !== lines.length) setLines(fetchedLines);
    }, []);

    const createLine = useCallback((line: Line) => {
        postLine(line);
    }, []);

    useEffect(() => {
        if (!isPanning) {
            fetchLines();
        }
    }, [isPanning, mapPosition]);

    useEffect(() => {
        fetchLines();
    }, []);

    useInterval(() => {
        fetchLines();
    }, props.interval);

    return <LineContext.Provider value={{ isInitializing, lines, fetchLines, createLine }}>{props.children}</LineContext.Provider>;
};
export default useLines;
