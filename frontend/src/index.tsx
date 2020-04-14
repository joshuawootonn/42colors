import React from 'react';
import ReactDOM from 'react-dom';
import App from './app';
import './assets/styles/reset.css';
import './assets/styles/base.css';

import { MapPositionProvider } from './context/mapPosition.context';
import { LineProvider } from './context/line.context';
import { ToolsProvider } from './context/tool.context';

ReactDOM.render(
    <MapPositionProvider>
        <LineProvider interval={5000}>
            <ToolsProvider>
                <App />
            </ToolsProvider>
        </LineProvider>
    </MapPositionProvider>,
    document.getElementById('root')
);
