import React, { FC, useState } from 'react';
import ColorInput from './colorInput';

import styled from 'styled-components';

const Wrapper = styled.div`
    width: 300px;
    height: 200px;
    overflow: hidden;
`;

export default {
    title: 'Containers.Control.ColorInput',
    component: ColorInput,
    decorators: [(storyFn: any) => <Wrapper>{storyFn()}</Wrapper>],
};

const colors = ['#0000FF', '#FF0000', '#ffff00'];

const WrapperColorInputForm: FC = props => {
    const [currentColor, setCurrentColor] = useState(colors[0]);

    return <ColorInput options={colors} onChange={(color: string) => setCurrentColor(color)} value={currentColor} name="ColorInput" />;
};

export const Default = () => <WrapperColorInputForm />;
