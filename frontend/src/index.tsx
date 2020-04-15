import React from 'react';
import ReactDOM from 'react-dom';
import App from './app';
import './assets/styles/reset.css';
import './assets/styles/base.css';
import { BrowserRouter as Router, Switch, Route, Link, Redirect } from 'react-router-dom';
import { MapPositionProvider } from './context/mapPosition/mapPosition.context';
import { LineProvider } from './context/line.context';
import { ToolsProvider } from './context/tool.context';
import { RedirectIfNoValidMapPositionQuery } from './context/mapPosition/redirectIfNoValidMapPositionQuery';

ReactDOM.render(
    <Router>
        <Switch>
            <Route path="/">
                <RedirectIfNoValidMapPositionQuery />
                <MapPositionProvider>
                    <LineProvider interval={5000}>
                        <ToolsProvider>
                            <App />
                        </ToolsProvider>
                    </LineProvider>
                </MapPositionProvider>
            </Route>
        </Switch>
    </Router>,
    document.getElementById('root')
);
