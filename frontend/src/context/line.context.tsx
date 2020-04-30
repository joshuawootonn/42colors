import React, { createContext, FC, useCallback, useContext, useEffect, useState } from 'react';
import { useInterval } from 'react-use';
import { getAllLines, postLine } from '../repositories/canvas.repositories';
import { Line } from '../models';
import { useMapPosition } from './mapPosition/mapPosition.context';

import * as signalR from '@aspnet/signalr';
import * as _ from 'lodash';
import { configObj } from './config.context';

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

    const [lineHub] = useState(
        new signalR.HubConnectionBuilder()
            .withUrl(`${configObj.API_HOST}/lineHub`)
            .configureLogging(signalR.LogLevel.Error)
            .build()
    );

    useEffect(() => {
        (async () => {
            lineHub.on('receiveLine', newLine => {
                setLines(lines => [...lines, newLine]);
                setTempLines(tempLines =>
                    tempLines.filter(line => !_.isEqual(line.points, newLine.points))
                );
            });
            lineHub.on('receiveLines', lines => {
                console.log(lines);
                setLines(_ => lines.lines);
                setIsInitializing(false);
            });
            await lineHub.start();
            await lineHub.invoke('getLines');
        })();
    }, []);

    const fetchLines = async () => {
        await lineHub.invoke('getLines');
    };

    const createLine = async (line: Line) => {
        setTempLines([...tempLines, line]);
        await lineHub.invoke('sendLine', line);
    };

    return (
        <LineContext.Provider value={{ isInitializing, lines, tempLines, fetchLines, createLine }}>
            {props.children}
        </LineContext.Provider>
    );
};
export default useLines;
