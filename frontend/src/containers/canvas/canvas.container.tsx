import React, { useCallback, useState } from 'react';
import { useInterval } from 'react-use';
import { getAllLines, postLine } from '../../repositories/canvas.repositories';
import { Line } from '../../.old/canvas.todo';
import Brush from '../brush/brush';
import { CanvasSettings } from '../../models/canvas';
import CanvasWrapper from './canvasWrapper';
import Drawing from './drawing';

interface CanvasContainerProps {
    canvasSettings: CanvasSettings;
}

export const CanvasContainer: React.FC<CanvasContainerProps> = ({ canvasSettings }) => {
    const [lines, setLines] = useState<Line[]>([]);

    useInterval(async () => {
        const fetchedLines = await getAllLines();
        if (fetchedLines && fetchedLines.length !== lines.length) setLines(fetchedLines);
    }, 500);

    const onNewLine = useCallback(
        (line: Line) => {
            postLine(line);
        },
        [postLine]
    );

    return (
        <CanvasWrapper>
            <Brush onNewLine={onNewLine} canvasWidth="100vw" canvasHeight="100vh" canvasSettings={canvasSettings} />
            <Drawing lines={lines} canvasWidth="100vw" canvasHeight="100vh" canvasSettings={canvasSettings} />
        </CanvasWrapper>
    );
};

export default CanvasContainer;
