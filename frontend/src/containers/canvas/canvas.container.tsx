import React from 'react';
import Brush from './brush';
import { CanvasSettings } from '../../models';
import Drawing from './drawing';
import styled from 'styled-components';
import Grid from './grid';
import { useLines } from '../../context/line.context';
import Drawing2 from './drawing2';

const Root = styled.div`
    height: 100vh;
    width: 100vw;
    display: flex;
    justify-content: center;
    align-items: center;
`;

interface CanvasContainerProps {
    canvasSettings: CanvasSettings;
}

export const CanvasContainer: React.FC<CanvasContainerProps> = ({ canvasSettings }) => {
    const { lines, isInitializing, createLine } = useLines();

    return isInitializing ? (
        <Root>Loading...</Root>
    ) : (
        <Root>
            {/*<Drawing lines={lines} canvasSettings={canvasSettings} />*/}
            {lines.length > 0 && <Drawing2 lines={lines} />}
            <Brush onNewLine={createLine} canvasSettings={canvasSettings} />
            {/*<Grid />*/}
        </Root>
    );
};

export default CanvasContainer;
