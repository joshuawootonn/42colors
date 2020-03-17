import React, { useCallback, useState } from 'react';
import { useInterval } from 'react-use';
import { getAllLines, postLine } from '../../repositories/canvas.repositories';
import Brush from './brush';
import { CanvasSettings, Line } from '../../models';
import Drawing from './drawing';
import styled from 'styled-components';
import Grid from './grid';

const Root = styled.div`
    height: 100vh;
    width: 100vw;
`;

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
        <Root>
            <Brush onNewLine={onNewLine} canvasSettings={canvasSettings} />
            <Drawing lines={lines} canvasSettings={canvasSettings} />
            <Grid />
        </Root>
    );
};

export default CanvasContainer;
