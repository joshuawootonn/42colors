import React, { createContext, FC, useCallback, useContext, useEffect, useState } from 'react';
import { useInterval } from 'react-use';
import { getAllLines, postLine } from '../repositories/canvas.repositories';
import { Line } from '../models';
import { useMapPosition } from './mapPosition/mapPosition.context';
import * as _ from 'lodash';

interface LineContextState {
    isInitializing: boolean;
    lines: Line[];
    tempLines: Line[];
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
    const [tempLines, setTempLines] = useState<Line[]>([]);

    const fetchLines = useCallback(async () => {
        const fetchedLines = await getAllLines();
        setIsInitializing(false);
        if (fetchedLines && !_.isEqual(fetchedLines, lines)) setLines(fetchedLines);
    }, []);

    const createLine = useCallback(async (line: Line) => {
        setTempLines([...tempLines, line]);
        const response = await postLine(line);
        if (!response || !response.data) return;

        setLines(lines => [...lines, response.data]);
        setTempLines(tempLines =>
            tempLines.filter(line => !_.isEqual(line.points, response.data.points))
        );
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

    return (
        <LineContext.Provider value={{ isInitializing, lines, tempLines, fetchLines, createLine }}>
            {props.children}
        </LineContext.Provider>
    );
};
export default useLines;
