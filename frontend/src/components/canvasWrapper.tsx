import React, { useEffect } from 'react';
import { useWindowSize } from 'react-use';
import styled from 'styled-components';

const Wrapper = styled.div`
    height: 100vh;
    width: 100vw;
`;

const CanvasWrapper: React.FC<any> = props => {
    const { width, height } = useWindowSize();

    useEffect(() => {
        console.log(width, height);
    }, [width, height]);

    return <Wrapper>{props.children}</Wrapper>;
};

export default CanvasWrapper;
