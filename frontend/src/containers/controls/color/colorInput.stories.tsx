import React, { FC, useState } from 'react';
import ColorInput from './colorInput';

import styled from 'styled-components';

const Wrapper = styled.div`
    width: 100vw;
    height: 100vh;
    display: flex;
    justify-content: flex-end;
    align-items: flex-end;
`;

export default {
    title: 'Containers.Control.ColorInput',
    component: ColorInput,
    decorators: [(storyFn: any) => <Wrapper>{storyFn()}</Wrapper>],
};

const colors = ['#223343', '#cecece', '#9e7b51', '#ef3f3f', '#feb949', '#fffb97', '#8cf28c', '#6dffff', '#ff87c4', '#b75fe6'];

const WrapperColorInputForm: FC = props => {
    const [currentColor, setCurrentColor] = useState(colors[0]);

    return <ColorInput options={colors} onChange={(color: string) => setCurrentColor(color)} value={currentColor} name="ColorInput" />;
};

export const Default = () => <WrapperColorInputForm />;
