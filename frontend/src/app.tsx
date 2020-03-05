import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import Brand from './components/brand';
import { CanvasSettings } from './models/canvas';
import Control from './containers/controls/control';
import useKeyboardJs from 'react-use/lib/useKeyboardJs';
import CanvasContainer from './containers/canvas/canvas.container';
import Warning from './components/warning';
import { useKeyPress } from './aaa';

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
    const isPressed = useKeyPress('Space');
    const [canvasSettings, setCanvasSettings] = useState<CanvasSettings>({
        brushColor: '#ffff00',
        brushWidth: 10,
    });
    console.log(isPressed);


    return (
        <Container>
            <CanvasContainer isPanning={isPressed} canvasSettings={canvasSettings} />
            <Brand isPanning={isPressed} />
            <Control isPanning={isPressed} canvasSettings={canvasSettings} setCanvasSettings={setCanvasSettings} />
            <Warning isPanning={isPressed} />
        </Container>
    );
};

export default App;
