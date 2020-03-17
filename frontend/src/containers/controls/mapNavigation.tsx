import React from 'react';
import styled from 'styled-components';
import { CanvasSettings } from '../../models';
import { EdgeRoot } from '../../components/edgeRoot';
import { useMapPosition } from '../../context/mapPosition.context';

const Root = styled(EdgeRoot)`
    top: ${props => (props.isPanning ? '24px' : '16px')};
    left: ${props => (props.isPanning ? '24px' : '16px')};
    span,
    a {
        margin-right: 16px;
    }

    div {
        display: flex;
        flex-direction: row;
        align-items: center;
        margin-bottom: 16px;
    }
`;
const Text = styled.p`
    margin-top: 0;
    margin-bottom: 0;
    margin-right: 16px;
`;

export interface MapNavigationProps {
    canvasSettings: CanvasSettings;
}
export const ManualMapNavigation: React.FC<MapNavigationProps> = () => {
    const [isPanning, currentMapPosition, setMapPosition] = useMapPosition();
    return (
        <Root isPanning={isPanning}>
            <div>
                <Text>X</Text>
                <input
                    name="x"
                    type="number"
                    min="-1000000"
                    max="1000000"
                    step={100}
                    value={currentMapPosition.x}
                    onChange={event => setMapPosition({ ...currentMapPosition, x: parseInt(event.target.value) })}
                />
            </div>
            <div>
                <Text>Y</Text>
                <input
                    name="y"
                    type="number"
                    min="-1000000"
                    max="1000000"
                    step={100}
                    value={currentMapPosition.y}
                    onChange={event => setMapPosition({ ...currentMapPosition, y: parseInt(event.target.value) })}
                />
            </div>
        </Root>
    );
};

export default ManualMapNavigation;
