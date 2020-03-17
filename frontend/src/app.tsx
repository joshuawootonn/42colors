import React, { useState } from 'react';
import styled from 'styled-components';
import Brand from './components/brand';
import { CanvasSettings } from './models';
import Control from './containers/controls/control';
import CanvasContainer from './containers/canvas/canvas.container';
import Warning from './components/warning';
import { useMapPosition } from './context/mapPosition.context';
import ManualMapNavigation from './containers/controls/mapNavigation';

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
    const [isPressed] = useMapPosition();
    const [canvasSettings, setCanvasSettings] = useState<CanvasSettings>({
        brushColor: '#ffff00',
        brushWidth: 10,
    });
    return (
        <Container>
            <CanvasContainer canvasSettings={canvasSettings} />
            <ManualMapNavigation canvasSettings={canvasSettings} />
            <Brand />
            <Control canvasSettings={canvasSettings} setCanvasSettings={setCanvasSettings} />
            <Warning />
        </Container>
    );
};

export default App;
