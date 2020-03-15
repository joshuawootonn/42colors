import React from 'react';
import ReactDOM from 'react-dom';
import App from './app';
import './index.css';
import { MapPositionProvider } from './context/mapPosition.context';

ReactDOM.render(
    <MapPositionProvider>
        <App />
    </MapPositionProvider>,
    document.getElementById('root')
);
