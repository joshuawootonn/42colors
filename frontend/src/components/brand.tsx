import React, { FC } from 'react';
import styled from 'styled-components';
import { EdgeRoot } from './edgeRoot';
import { useMapPosition } from '../context/mapPosition.context';

const Root = styled(EdgeRoot)`
    bottom: ${props => (props.isPanning ? '24px' : '16px')};
    left: ${props => (props.isPanning ? '24px' : '16px')};
    flex-direction: row;
    span,
    a {
        margin-right: 16px;
    }
`;

export interface BrandProps {}

export const Brand: React.FC<BrandProps> = () => {
    const [isPanning] = useMapPosition();
    return (
        <Root isPanning={isPanning}>
            <span> Joshua Wootonn</span> <a href="http://www.joshuawootonn.com">website</a>
            <a href="https://github.com/joshuawootonn/42colors">github</a>
        </Root>
    );
};

export default Brand;
