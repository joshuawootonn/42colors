import React, { FC } from 'react';

import styled from 'styled-components';

const Wrapper = styled.div`
    //display: flex;
    //flex-direction: row;
    width: 100%;
    overflow-x: auto;
    white-space: nowrap;
    //&::-webkit-scrollbar {
    //    display: none;
    //}
`;

const ColorBlock = styled.div`
    width: 40px;
    height: 40px;
    background-color: aqua;
    border: 1px solid white;
    display: inline-block;
    &:hover {
        transform-origin: center;
        transform: scale(1.1);
    }
`;

interface ColorInputProps {
    onChange: any;
    value: any;
    name: string;
}

const ColorInput: FC<ColorInputProps> = props => {
    return (
        <Wrapper>
            <ColorBlock />
            <ColorBlock />
            <ColorBlock />
            <ColorBlock />
            <ColorBlock />
            <ColorBlock />
            <ColorBlock />
            <ColorBlock />
            <ColorBlock />
            <ColorBlock />
            <ColorBlock />
            <ColorBlock />
            <ColorBlock />
            <ColorBlock />
            <ColorBlock />
            <ColorBlock />
            <ColorBlock />
            <ColorBlock />
            <ColorBlock />
            <ColorBlock />
            <ColorBlock />
            <ColorBlock />
            <ColorBlock />
            <ColorBlock />
            <ColorBlock />
            <ColorBlock />
            <ColorBlock />
            <ColorBlock />
        </Wrapper>
    );
};
export default ColorInput;
