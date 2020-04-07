import React, { useCallback } from 'react';
import Brush from './brush';
import { CanvasSettings, Line } from '../../models';
import Drawing from './drawing';
import styled from 'styled-components';
import Grid from './grid';
import { useLines } from '../../context/line.context';

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
            <Brush onNewLine={createLine} canvasSettings={canvasSettings} />
            <Drawing lines={lines} canvasSettings={canvasSettings} />
            <Grid />
        </Root>
    );
};

export default CanvasContainer;
