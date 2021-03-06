import React, { useState } from 'react';
import styled from 'styled-components';
import Brand from './components/brand';
import { CanvasSettings } from './models';
import Control from './containers/controls/control';
import BoardContainer from './containers/board';

import Navigation from './containers/navigation';
import { colors } from './containers/controls/color/colorInput';
import { sizes } from './containers/controls/size/sizeInput';
import Connection from './containers/connection';

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
        brushColor: colors[0],
        brushWidth: sizes[0],
    });
    return (
        <Container>
            <BoardContainer canvasSettings={canvasSettings} />
            <Navigation />
            <Brand />
            <Control canvasSettings={canvasSettings} setCanvasSettings={setCanvasSettings} />
            <Connection />
        </Container>
    );
};

export default App;
