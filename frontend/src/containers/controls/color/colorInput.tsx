import React, { FC, useState } from 'react';

import styled from 'styled-components';

const Wrapper = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    padding: 16px;
`;

interface ColorBlockProps {
    color: string;
}

const ColorBlock = styled.button<ColorBlockProps>`
    background-color: ${props => props.color};
    border: 1px solid white;
    display: inline-block;
    outline-style: none;
    border-radius: 12px;

    height: 48px;
    width: 48px;

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
    onChange: (color: string) => void;
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
                props.options.map((color, i) => <ColorBlock key={i} onClick={() => setNewColor(color)} value={color} color={color} />)
            ) : (
                <ColorBlock onClick={setEditing} color={props.value} />
            )}
        </Wrapper>
    );
};
export default ColorInput;
