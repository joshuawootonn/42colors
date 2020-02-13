import React, { FC, useState } from 'react';

import styled from 'styled-components';

const Wrapper = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    width: 100%;
    overflow-x: auto;
    white-space: nowrap;
    overflow-y: hidden;

    // No scrollbar
    //-ms-overflow-style: none; /* Internet Explorer 10+ */
    //scrollbar-width: none; /* Firefox */
    //&::-webkit-scrollbar {
    //    display: none; /* Safari and Chrome */
    //}
`;

interface ColorBlockProps {
    color: string;
}

const ColorBlock = styled.button<ColorBlockProps>`
    width: 40px;
    height: 40px;
    background-color: ${props => props.color};
    border: 1px solid white;
    display: inline-block;
    outline-style: none;
    
    background-image: linear-gradient(to top left, rgba(0, 0, 0, .2), rgba(0, 0, 0, .2) 30%, rgba(0, 0, 0, 0));
    box-shadow: box-shadow: inset 2px 2px 3px rgba(255, 255, 255, .6), inset -2px -2px 3px rgba(0, 0, 0, .6);;
    
    &:hover {
        transform-origin: center;
        transform: scale(1.1);
    }
    &:active {
    
        transform-origin: center;
        transform: scale(1.05);
    }
`;

const BigColorBlock = styled(ColorBlock)<ColorBlockProps>`
    margin-left: 10%;
    width: 80%;
    height: 40px;
    background-color: ${props => props.color};
    border: 1px solid white;
    display: inline-block;
    &:hover {
        transform-origin: center;
        transform: scale(1.1);
    }
    &:active {
        transform-origin: center;
        transform: scale(1.05);
    }
`;

interface ColorInputProps {
    options: string[];
    onChange: any;
    value: any;
    name: string;
}

const ColorInput: FC<ColorInputProps> = props => {
    const [isEditing, setIsEditing] = useState(false);

    const setEditing = () => setIsEditing(true);
    const setNewColor = (color: string) => {
        props.onChange(color);
        setIsEditing(false);
    };

    return (
        <Wrapper>
            {isEditing ? (
                props.options.map(color => <ColorBlock onClick={() => setNewColor(color)} value={color} color={color} />)
            ) : (
                <BigColorBlock onClick={setEditing} color={props.value} />
            )}
        </Wrapper>
    );
};
export default ColorInput;
