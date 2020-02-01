import React, { useState } from 'react';
import { useInterval } from 'react-use';
import { getAllLines } from '../repositories/canvas.repositories';
import { Line } from './canvas.todo';
import Brush from './brush';
import { CanvasSettings } from '../models/canvas';
import CanvasWrapper from './canvasWrapper';

interface CanvasContainerProps {
    canvasSettings: CanvasSettings;
}

export const CanvasContainer: React.FC<CanvasContainerProps> = ({ canvasSettings }) => {
    const [lines, setLines] = useState<Line[]>([]);

    // useInterval(async () => {
    //     // const fetchedLines = await getAllLines();
    //     // console.log(fetchedLines);
    //
    //     // if (fetchedLines.length !== lines.length) setLines(fetchedLines);
    // }, 333);
    console.log(canvasSettings);

    return (
        <CanvasWrapper>
            <Brush canvasWidth="100vw" canvasHeight="100vh" canvasSettings={canvasSettings} />
        </CanvasWrapper>
    );
};

export default CanvasContainer;
