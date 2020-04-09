import React, { useEffect, useRef } from 'react';

import { useWindowSize } from 'react-use';
import styled from 'styled-components';
import { clear2, drawGrid, resizeCanvas } from '../../helpers/canvas.helpers';
import { useMapPosition } from '../../context/mapPosition.context';

const GridCanvas = styled.canvas`
    display: block;
    position: absolute;
    z-index: 10;
`;

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
        clear2(gridContext.current);
        drawGrid(gridContext.current, mapPosition);
    }, [width, height]);

    useEffect(() => {
        clear2(gridContext.current);
        drawGrid(gridContext.current, mapPosition);
    }, [mapPosition]);

    return <GridCanvas ref={gridCanvas} />;
};

export default Grid;
