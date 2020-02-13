import React, { FC } from 'react';
import styled from 'styled-components';
import { CanvasSettings } from '../../models/canvas';
import ColorInput from './colorInput';

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

const Text = styled.p`
    margin-top: 0;
    margin-bottom: 0.5em;
`;

export interface ControlProps {
    canvasSettings: CanvasSettings;
    setCanvasSettings: (canvasSettings: CanvasSettings) => void;
}

const colors = ['#0000FF', '#FF0000', '#ffff00'];

export const Control: React.FC<ControlProps> = ({ canvasSettings, setCanvasSettings }) => {
    return (
        <Wrapper>
            <Text>Brush Length</Text>
            <input
                name="brushRadius"
                type="range"
                min="1"
                max="100"
                value={canvasSettings.brushRadius}
                onChange={event => setCanvasSettings({ ...canvasSettings, brushRadius: parseInt(event.target.value) })}
            />
            <Text>Leash Length</Text>
            <input
                name="lazyRadius"
                type="range"
                min="0"
                max="100"
                value={canvasSettings.lazyRadius}
                onChange={event => setCanvasSettings({ ...canvasSettings, lazyRadius: parseInt(event.target.value) })}
            />
            <Text>Color</Text>
            <ColorInput
                name="brushColor"
                value={canvasSettings.brushColor}
                options={colors}
                onChange={color => setCanvasSettings({ ...canvasSettings, brushColor: color })}
            />
        </Wrapper>
    );
};

export default Control;
