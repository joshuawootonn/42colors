import React, { useState } from 'react';
import { StoryRoot } from '../../components/storyHelpers';
import Navigation from './navigation';

export default {
    title: 'Containers.Navigation',
    decorators: [storyFn => <StoryRoot>{storyFn()}</StoryRoot>],
};

export const Default = () => {
    const [currentMapPosition, setCurrentMapPosition] = useState({ x: 0, y: 0 });

    return (
        <Navigation
            setMapPosition={mapPosition => setCurrentMapPosition(mapPosition)}
            currentMapPosition={currentMapPosition}
        />
    );
};
