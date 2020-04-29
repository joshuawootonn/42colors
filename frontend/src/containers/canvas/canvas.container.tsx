import React from 'react';
import Brush from './brush';
import { CanvasSettings } from '../../models';
import styled, { css } from 'styled-components/macro';
import Grid from './grid';
import { useLines } from '../../context/line.context';
import useCamera from './useCamera';

import LineRenderer from './lineRenderer';

const styles = {
    root: css`
        height: 100vh;
        width: 100vw;
        display: flex;
        justify-content: center;
        align-items: center;
    `,
    temp: css`
        z-index: 12;
    `,
    main: css`
        z-index: 11;
    `,
};

const Root = styled.div``;

interface CanvasContainerProps {
    canvasSettings: CanvasSettings;
}

// TODO: find out what is causing this to rerender so much
export const CanvasContainer: React.FC<CanvasContainerProps> = ({ canvasSettings }) => {
    const { lines, tempLines, isInitializing, createLine } = useLines();

    const camera = useCamera();

    return isInitializing ? (
        <div css={styles.root}>Loading...</div>
    ) : (
        <div css={styles.root}>
            <LineRenderer css={styles.main} camera={camera} lines={lines} />
            <LineRenderer css={styles.temp} camera={camera} lines={tempLines} />
            <Brush camera={camera} onNewLine={createLine} canvasSettings={canvasSettings} />
            <Grid />
        </div>
    );
};

export default CanvasContainer;
