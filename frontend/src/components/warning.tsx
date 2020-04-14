import React from 'react';
import styled from 'styled-components';

const Root = styled.div`
    top: 16px;
    right: 16px;
    position: absolute;
    display: flex;
    flex-direction: column;
    z-index: 15;
    p {
        margin: 0;
    }
`;

export const Warning: React.FC = () => (
    <Root>
        <p> </p>
    </Root>
);

export default Warning;
