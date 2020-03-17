import React, { useEffect, useRef } from 'react';

import { useWindowSize } from 'react-use';
import styled from 'styled-components';
import { drawGrid} from '../../helpers/canvas.helpers';
import { useMapPosition } from '../../context/mapPosition.context';

const GridCanvas = styled.canvas`
    display: block;
    position: absolute;
    z-index: 10;
`;

interface GridProps {}

const Grid: React.FC<GridProps> = () => {
    const gridCanvas = useRef<HTMLCanvasElement>(null);
    const { width, height } = useWindowSize();
    const [_, mapPosition] = useMapPosition();

    useEffect(() => {
        if (gridCanvas.current) {
            gridCanvas.current.width = width;
            gridCanvas.current.height = height;
            gridCanvas.current.style.width = width;
            gridCanvas.current.style.height = height;
        }
        drawGrid(gridCanvas, mapPosition);
    }, [width, height, mapPosition]);

    return <GridCanvas ref={gridCanvas} />;
};

export default Grid;
