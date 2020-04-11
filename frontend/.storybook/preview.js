import { addParameters } from '@storybook/react';
import { INITIAL_VIEWPORTS } from '@storybook/addon-viewport';
import '../src/assets/styles/reset.css'

import React from 'react';
const viewports = {
    720: {
        name: '720p',
        styles: {
            width: '1280px',
            height: '720px',
        },
        type: 'desktop',
    },
    1080: {
        name: '1080p',
        styles: {
            width: '1920px',
            height: '1080px',
        },
        type: 'desktop',
    },
    ...INITIAL_VIEWPORTS
};

addParameters({
    viewport: {
        viewports,
        defaultViewport: '720',
    },
});