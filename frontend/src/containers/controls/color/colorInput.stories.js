import React, { useState } from 'react';
import ColorInput, { colors } from './colorInput';
import { StoryRoot } from '../../../components/storyHelpers';

export default {
    title: 'Containers.Control.Color Input',
    decorators: [storyFn => <StoryRoot>{storyFn()}</StoryRoot>],
};

export const Default = () => {
    const [currentColor, setCurrentColor] = useState(colors[0]);

    return <ColorInput onChange={e => setCurrentColor(e.target.value)} value={currentColor} />;
};
