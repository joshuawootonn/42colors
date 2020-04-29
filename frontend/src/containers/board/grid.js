import React, { useEffect, useRef } from 'react';
import { useWindowSize } from 'react-use';
import { css } from 'styled-components/macro';
import { clear, drawGrid, resizeCanvas } from '../../helpers/canvas.helpers';
import { useMapPosition } from '../../context/mapPosition/mapPosition.context';

const styles = {
    root: css`
        display: block;
        position: absolute;
        z-index: 10;
    `,
};

const Grid = () => {
    const gridCanvas = useRef();
    const gridContext = useRef();
    const { width, height } = useWindowSize();
    const [_, mapPosition] = useMapPosition();

    useEffect(() => {
        gridContext.current = gridCanvas.current.getContext('2d');
    }, []);

    useEffect(() => {
        resizeCanvas(gridCanvas.current, width, height);
        gridContext.current = gridCanvas.current.getContext('2d');
        clear(gridContext.current);
        drawGrid(gridContext.current, mapPosition);
    }, [width, height]);

    useEffect(() => {
        clear(gridContext.current);
        drawGrid(gridContext.current, mapPosition);
    }, [mapPosition]);

    return <canvas css={styles.root} ref={gridCanvas} />;
};

export default Grid;
