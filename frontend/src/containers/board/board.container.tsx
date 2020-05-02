import React from 'react';
import Brush from './brush';
import { CanvasSettings } from '../../models';
import { css } from 'styled-components/macro';
import Grid from './grid';
import { useLines } from '../../context/line.context';
import useCamera from './components/useCamera';
import Drawing from './drawing';
import Temp from './temp';
import { connected } from '../../models/connection';

const styles = {
    root: css`
        height: 100vh;
        width: 100vw;
        display: flex;
        justify-content: center;
        align-items: center;
    `,
};

interface CanvasContainerProps {
    canvasSettings: CanvasSettings;
}

// TODO: find out what is causing this to rerender so much
export const BoardContainer: React.FC<CanvasContainerProps> = ({ canvasSettings }) => {
    const { lines, tempLines, createLine, connectionState } = useLines();
    const camera = useCamera();

    switch (connectionState.type) {
        case 'neverConnected':
            return <div css={styles.root}>Loading...</div>;
        case 'disConnected':
            return <div css={styles.root}>your connection had an oopsie 😔</div>;
        default:
            return (
                <div css={styles.root}>
                    <Drawing camera={camera} lines={lines} />
                    <Temp camera={camera} lines={tempLines} />
                    <Brush camera={camera} onNewLine={createLine} canvasSettings={canvasSettings} />
                    <Grid />
                </div>
            );
    }
};

export default BoardContainer;
