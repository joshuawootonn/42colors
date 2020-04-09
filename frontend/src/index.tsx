import React from 'react';
import ReactDOM from 'react-dom';
import App from './app';
import './index.css';
import { MapPositionProvider } from './context/mapPosition.context';
import { LineProvider } from './context/line.context';

ReactDOM.render(
    <MapPositionProvider>
        <LineProvider interval={5000}>
            <App />
        </LineProvider>
    </MapPositionProvider>,
    document.getElementById('root')
);
