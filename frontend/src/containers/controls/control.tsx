import React from 'react';
import styled from 'styled-components';
import { CanvasSettings } from '../../models';
import ColorInput from './color';
import { EdgeRoot } from '../../components/edgeRoot';
import { useMapPosition } from '../../context/mapPosition.context';
import { useTool } from '../../context/tool.context';

const Root = styled(EdgeRoot)`
    bottom: ${props => (props.isPanning ? '24px' : '16px')};
    right: ${props => (props.isPanning ? '24px' : '16px')};
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

const colors = [
    '#0000FF',
    '#FF0000',
    '#0000FF',
    '#FF0000',
    '#0000FF',
    '#FF0000',
    '#0000FF',
    '#FF0000',
    '#0000FF',
    '#FF0000',
    '#0000FF',
    '#FF0000',
    '#0000FF',
    '#FF0000',
    '#ffff00',
];

export const Control: React.FC<ControlProps> = ({ canvasSettings, setCanvasSettings }) => {
    const [isPanning] = useMapPosition();
    const { setToolType, toolType } = useTool();
    return (
        <Root isPanning={isPanning}>
            <Text>Brush Width</Text>
            <input
                name="brushWidth"
                type="range"
                min="1"
                max="100"
                value={canvasSettings.brushWidth}
                onChange={event =>
                    setCanvasSettings({
                        ...canvasSettings,
                        brushWidth: parseInt(event.target.value),
                    })
                }
            />
            <Text>Color</Text>
            <ColorInput
                name="brushColor"
                value={canvasSettings.brushColor}
                options={colors}
                onChange={(event: any) =>
                    setCanvasSettings({ ...canvasSettings, brushColor: event.target.value })
                }
            />
            <div>
                <button
                    style={{ backgroundColor: toolType === 'brush' ? 'white' : 'grey' }}
                    onClick={() => setToolType('brush')}
                >
                    Brush
                </button>
                <button
                    style={{ backgroundColor: toolType === 'eraser' ? 'white' : 'grey' }}
                    onClick={() => setToolType('eraser')}
                >
                    Eraser
                </button>
            </div>
        </Root>
    );
};

export default Control;
