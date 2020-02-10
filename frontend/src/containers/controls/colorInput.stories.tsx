import React from 'react';
import { linkTo } from '@storybook/addon-links';
import { action } from '@storybook/addon-actions';
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
    decorators: [storyFn => <Wrapper>{storyFn()}</Wrapper>],
};

export const Default = () => <ColorInput name="colorInput" value="#eee" onChange={action('onChange')} />;
