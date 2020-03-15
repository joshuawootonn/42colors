import React from 'react';
import styled from 'styled-components';
import { EdgeRoot } from './edgeRoot';
import { useMapPosition } from '../context/mapPosition.context';

const Root = styled(EdgeRoot)`
    top: ${props => (props.isPanning ? '24px' : '16px')};
    right: ${props => (props.isPanning ? '24px' : '16px')};
    p {
        margin: 0;
    }
`;

export interface WarningProps {}
export const Warning: React.FC<WarningProps> = () => {
    const [isPanning] = useMapPosition();
    return (
        <Root isPanning={isPanning}>
            <p> oop </p>
        </Root>
    );
};

export default Warning;
