import React, { FC, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { css } from 'styled-components/macro';
import { clearScene, drawScene, generateLinesMeta } from '../../../helpers/webgl.helpers';
import { useWindowSize } from 'react-use';

const styles = {
    root: css`
        display: block;
        position: absolute;
        width: 100%;
        height: 100%;
    `,
};

const LineRenderer = ({ lines, camera, ...props }) => {
    const drawingRef = useRef();
    const [renderer] = useState(() => new THREE.WebGLRenderer({ alpha: true, antialias: true }));
    const [scene] = useState(() => new THREE.Scene());
    const { width, height } = useWindowSize();
    const lineMeta = useRef([]);

    useEffect(() => {
        renderer.setSize(width, height);
        drawingRef.current.appendChild(renderer.domElement);
    }, []);

    useEffect(() => {
        lineMeta.current = generateLinesMeta(lines);
    }, [lines]);

    useEffect(() => {
        let animationFrame;

        function render() {
            clearScene(scene);
            drawScene(scene, lineMeta.current);
            renderer.render(scene, camera);
            animationFrame = requestAnimationFrame(render);
        }

        render();
        return () => {
            cancelAnimationFrame(animationFrame);
        };
    }, [lines]);

    return <div css={styles.root} ref={drawingRef} {...props} />;
};

export default LineRenderer;
