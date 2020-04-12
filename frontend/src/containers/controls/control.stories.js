import React from 'react';
import Control from './control';
import { action } from '@storybook/addon-actions';
import { StoryRoot } from '../../components/storyHelpers';

export default {
    title: 'Components.Control',
    component: Control,
    decorators: [storyFn => <StoryRoot>{storyFn()}</StoryRoot>],
};

export const Default = () => (
    <Control
        setCanvasSettings={action('setCanvasSettings')}
        canvasSettings={{ brushWidth: 10, brushColor: '#000000' }}
    />
);
