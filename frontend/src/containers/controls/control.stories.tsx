import React from 'react';
import Control from './control';
import { action } from '@storybook/addon-actions';

export default {
    title: 'Components.Control',
    component: Control,
};

export const Default = () => (
    <Control setCanvasSettings={action('setCanvasSettings')} canvasSettings={{ brushWidth: 10, brushColor: '#000000' }} />
);
