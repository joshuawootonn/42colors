import React, { FC, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { MeshLine, MeshLineMaterial } from './three.meshline';
import { useMapPosition } from '../../context/mapPosition/mapPosition.context';

const Drawing2 = ({ lines }) => {
    const mount = useRef();
    const [renderer] = useState(() => new THREE.WebGLRenderer({ alpha: true }));
    const [scene] = useState(() => new THREE.Scene());
    const [camera] = useState(
        () => new THREE.PerspectiveCamera(255, window.innerWidth / window.innerHeight, 0.1, 2000)
    );
    const [isPanning, mapPosition] = useMapPosition();

    const meshLines = useRef([]);
    const materials = useRef([]);

    useEffect(() => {
        console.log('componentDidMount');
        camera.position.z = 500;
        camera.position.y = window.innerHeight / 2;
        camera.position.x = -window.innerWidth / 2;
        renderer.setSize(window.innerWidth, window.innerHeight);
        mount.current.appendChild(renderer.domElement);
    }, []);

    useEffect(() => {
        camera.position.x = -window.innerWidth / 2 - mapPosition.x;
        camera.position.y = window.innerHeight / 2 + mapPosition.y;
    }, [mapPosition]);

    const generateMeta = lines => {
        if (!lines || lines.length === 0) return;

        let i, j;
        const ms = [];
        const mls = [];
        for (i = 0; i < lines.length; i++) {
            const currentLine = lines[i];
            const ml = new THREE.Geometry();

            const aaa = [];
            for (j = 0; j < currentLine.points.length - 1; j++) {
                const x1 = -parseInt(currentLine.points[j].x, 10);
                const y1 = parseInt(currentLine.points[j].y, 10);
                aaa.push(new THREE.Vector3(x1, y1, 0));
            }

            const s = new THREE.CatmullRomCurve3(aaa, false);

            if (s.points.length > 1) {
                s.getPoints(500).forEach(point => {
                    ml.vertices.push(point);
                });

                const line = new MeshLine();
                line.setGeometry(ml);

                mls.push(line);
                ms.push(
                    new MeshLineMaterial({
                        color: parseInt(currentLine.brushColor.substr(1), 16),
                        lineWidth: 5,
                        resolution: new THREE.Vector2(window.innerWidth, window.innerHeight),
                    })
                );
            }
        }
        meshLines.current = mls;
        materials.current = ms;
    };

    useEffect(() => {
        // TODO: this shouldn't rerender every time lines are fetched since they are the same every time
        generateMeta(lines);
    }, [lines]);

    const draw = lines => {
        if (!lines || lines.length === 0) return;
        let i, j;
        scene.remove.apply(scene, scene.children);
        for (i = 0; i < lines.length, i < meshLines.current.length; i++) {
            const currentMeshLine = meshLines.current[i];
            const currentMaterial = materials.current[i];
            const mesh = new THREE.Mesh(currentMeshLine.geometry, currentMaterial);
            scene.add(mesh);
        }
    };

    useEffect(() => {
        let animationFrame;

        function render() {
            draw(lines);
            renderer.render(scene, camera);
            animationFrame = requestAnimationFrame(render);
        }

        render();
        return () => {
            cancelAnimationFrame(animationFrame);
        };
    }, [lines]);

    return <div styles={{ zindex: 11, display: 'block', position: 'absolute' }} ref={mount} />;
};

export default Drawing2;
