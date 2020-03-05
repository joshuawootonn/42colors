import React from 'react';
import styled from 'styled-components';

const Wrapper = styled.div`
    position: absolute;
    top: 16px;
    right: 16px;
    display: flex;
    flex-direction: column;
    z-index: 15;
    p {
        margin: 0;
    }
`;

export const Warning: React.FC = () => {
    return (
        <Wrapper>
            <p> oop </p>
        </Wrapper>
    );
};

export default Warning;
