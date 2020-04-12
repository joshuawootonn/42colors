import React from 'react';
import { useMapPosition } from '../../context/mapPosition.context';
import Navigation from './navigation';

export const NavigationContainer = () => {
    const [isPanning, currentMapPosition, setMapPosition] = useMapPosition();
    return <Navigation currentMapPosition={currentMapPosition} setMapPosition={setMapPosition} />;
};

export default NavigationContainer;
