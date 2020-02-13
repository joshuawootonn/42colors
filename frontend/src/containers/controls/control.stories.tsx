import React from 'react';
import { linkTo } from '@storybook/addon-links';
import Control from './control';
import { action } from '@storybook/addon-actions';

export default {
    title: 'Components.Control',
    component: Control,
};

export const Default = () => (
    <Control
        setCanvasSettings={action('setCanvasSettings')}
        canvasSettings={{ brushRadius: 10, brushColor: '#000000', lazyRadius: 10, catenaryColor: '#000000' }}
    />
);
