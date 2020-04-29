import { useEffect, useState } from 'react';
import * as THREE from 'three';
import { useMapPosition } from '../../context/mapPosition/mapPosition.context';
import { useWindowSize } from 'react-use';

const useCamera = () => {
    const { width, height } = useWindowSize();
    const [camera] = useState(() => new THREE.PerspectiveCamera(255, width / height, 0.1, 2000));
    const [isPanning, mapPosition] = useMapPosition();

    useEffect(() => {
        camera.position.z = 500;
        camera.position.y = window.innerHeight / 2;
        camera.position.x = -window.innerWidth / 2;
    }, []);

    useEffect(() => {
        camera.position.x = -window.innerWidth / 2 - mapPosition.x;
        camera.position.y = window.innerHeight / 2 + mapPosition.y;
    }, [mapPosition]);

    return camera;
};

export default useCamera;
