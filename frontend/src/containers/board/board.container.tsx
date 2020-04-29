import React from 'react';
import Brush from './brush';
import { CanvasSettings } from '../../models';
import styled, { css } from 'styled-components/macro';
import Grid from './grid';
import { useLines } from '../../context/line.context';
import useCamera from './components/useCamera';
import Drawing from './drawing';
import Temp from './temp';
const styles = {
    root: css`
        height: 100vh;
        width: 100vw;
        display: flex;
        justify-content: center;
        align-items: center;
    `,
};

const Root = styled.div``;

interface CanvasContainerProps {
    canvasSettings: CanvasSettings;
}

// TODO: find out what is causing this to rerender so much
export const BoardContainer: React.FC<CanvasContainerProps> = ({ canvasSettings }) => {
    const { lines, tempLines, isInitializing, createLine } = useLines();
    const camera = useCamera();

    return isInitializing ? (
        <div css={styles.root}>Loading...</div>
    ) : (
        <div css={styles.root}>
            <Drawing camera={camera} lines={lines} />
            <Temp camera={camera} lines={tempLines} />
            <Brush camera={camera} onNewLine={createLine} canvasSettings={canvasSettings} />
            <Grid />
        </div>
    );
};

export default BoardContainer;
