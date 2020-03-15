import React from 'react';
import styled from 'styled-components';
import { CanvasSettings } from '../../models';
import ColorInput from './colorInput';
import { EdgeRoot } from '../../components/edgeRoot';

const Root = styled(EdgeRoot)`
    bottom: ${props => (props.isPanning ? '20vh' : '16px')};
    right: ${props => (props.isPanning ? '20vh' : '16px')};
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
    isPanning: boolean;
}

const colors = ['#0000FF', '#FF0000', '#ffff00'];

export const Control: React.FC<ControlProps> = ({ canvasSettings, setCanvasSettings, isPanning }) => {
    return (
        <Root isPanning={isPanning}>
            <Text>Brush Width</Text>
            <input
                name="brushWidth"
                type="range"
                min="1"
                max="100"
                value={canvasSettings.brushWidth}
                onChange={event => setCanvasSettings({ ...canvasSettings, brushWidth: parseInt(event.target.value) })}
            />
            <Text>Color</Text>
            <ColorInput
                name="brushColor"
                value={canvasSettings.brushColor}
                options={colors}
                onChange={color => setCanvasSettings({ ...canvasSettings, brushColor: color })}
            />
        </Root>
    );
};

export default Control;
