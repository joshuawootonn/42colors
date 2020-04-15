import React, { useState } from 'react';
import SizeInput, { sizes } from './sizeInput';
import { StoryRoot } from '../../../components/storyHelpers';

export default {
    title: 'Containers.Control.Size Text',
    decorators: [storyFn => <StoryRoot>{storyFn()}</StoryRoot>],
};

export const Default = () => {
    const [currentSize, setCurrentSize] = useState(sizes[0]);

    return <SizeInput onChange={e => setCurrentSize(e.target.value)} value={currentSize} />;
};
