import React, { createContext, FC, useContext, useEffect, useState } from 'react';
import { useInterval } from 'react-use';
import { Line } from '../models';
import { useMapPosition } from './mapPosition/mapPosition.context';

import * as signalR from '@aspnet/signalr';
import { HubConnectionState } from '@aspnet/signalr';
import * as _ from 'lodash';
import { configObj } from './config.context';
import { connected, Connection, disConnected, neverConnected } from '../models/connection';
import line from '../models/line';

interface LineContextState {
    isInitializing: boolean;
    lines: Line[];
    tempLines: Line[];
    fetchLines: () => Promise<void>;
    createLine: (line: Line) => Promise<void>;
    connectionState: Connection;
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
    const [connectionState, setConnectionState] = useState<Connection>(neverConnected);

    const [lineHub] = useState(
        new signalR.HubConnectionBuilder()
            .withUrl(`${configObj.API_HOST}/lineHub`)
            .configureLogging(signalR.LogLevel.Error)
            .build()
    );

    const attemptConnection = async () => {
        try {
            await lineHub.start();
            setConnectionState(connected);
            await lineHub.invoke('getLines');
        } catch (error) {
            setConnectionState({ ...disConnected, error });
        }
    };

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
            lineHub.onclose(error => setConnectionState({ ...disConnected, error }));
            await attemptConnection();
        })();
    }, []);

    useInterval(async () => {
        if (lineHub.state === HubConnectionState.Disconnected) {
            await attemptConnection();
        }
    }, 5000);

    const fetchLines = async () => {
        await lineHub.invoke('getLines');
    };

    const createLine = async (line: Line) => {
        setTempLines([...tempLines, line]);
        await lineHub.invoke('sendLine', line);
    };

    return (
        <LineContext.Provider
            value={{ isInitializing, connectionState, lines, tempLines, fetchLines, createLine }}
        >
            {props.children}
        </LineContext.Provider>
    );
};
export default useLines;
