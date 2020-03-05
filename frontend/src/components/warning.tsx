import React from 'react';
import styled from 'styled-components';
import { EdgeRoot } from './edgeRoot';

const Root = styled(EdgeRoot)`
    top: ${props => (props.isPanning ? '20vh' : '16px')};
    right: ${props => (props.isPanning ? '20vh' : '16px')};
    p {
        margin: 0;
    }
`;

export interface WarningProps {
    isPanning: boolean;
}
export const Warning: React.FC<WarningProps> = ({ isPanning }) => {
    return (
        <Root isPanning={isPanning}>
            <p> oop </p>
        </Root>
    );
};

export default Warning;
