import React, { FC } from 'react';
import styled from 'styled-components';
import { CanvasSettings } from '../../models/canvas';

const Wrapper = styled.div`
    position: absolute;
    bottom: 16px;
    right: 16px;
    display: flex;
    flex-direction: column;
    z-index: 15;
    span,
    a {
        margin-right: 16px;
    }
`;

export interface ControlProps {
    canvasSettings: CanvasSettings;
    setCanvasSettings: (canvasSettings: CanvasSettings) => void;
}

export const Control: React.FC<ControlProps> = ({ canvasSettings, setCanvasSettings }) => {
    return (
        <Wrapper>
            <input
                name="brushRadius"
                type="range"
                min="1"
                max="100"
                value={canvasSettings.brushRadius}
                onChange={event => setCanvasSettings({ ...canvasSettings, brushRadius: parseInt(event.target.value) })}
            />
            <input
                name="lazyRadius"
                type="range"
                min="0"
                max="100"
                value={canvasSettings.lazyRadius}
                onChange={event => setCanvasSettings({ ...canvasSettings, lazyRadius: parseInt(event.target.value) })}
            />
            <input
                name="brushColor"
                value={canvasSettings.brushColor}
                onChange={event => setCanvasSettings({ ...canvasSettings, brushColor: event.target.value })}
            />
        </Wrapper>
    );
};

export default Control;
