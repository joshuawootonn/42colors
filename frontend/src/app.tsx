import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import Brand from './components/brand';
import { CanvasSettings } from './models/canvas';
import Control from './components/control';

import CanvasContainer from './components/canvas.container';

const Container = styled.div`
    height: 100vh;
    width: 100vw;
    display: flex;
    margin: 0;
    overflow: hidden;
    justify-content: center;
    align-items: center;
`;

const App: React.FC = () => {
    const [canvasSettings, setCanvasSettings] = useState<CanvasSettings>({
        lazyRadius: 0,
        brushColor: '#ffff00',
        brushRadius: 10,
        catenaryColor: '#000000',
    });

    return (
        <Container>
            <CanvasContainer canvasSettings={canvasSettings} />
            <Brand />
            <Control canvasSettings={canvasSettings} setCanvasSettings={setCanvasSettings} />
        </Container>
    );
};

export default App;
