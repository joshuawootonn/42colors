import { Line } from '../models';
import * as THREE from 'three';
import { MeshLine, MeshLineMaterial } from './three.meshline';

import { Scene } from 'three';

interface LineMeta {
    meshLine: MeshLine;
    material: MeshLineMaterial;
}

const generateLineMeta = (line: Line): LineMeta => {
    const ml = new THREE.Geometry();
    const aaa = [];
    for (let j = 0; j < line.points.length - 1; j++) {
        const x1 = -parseInt(line.points[j].x, 10);
        const y1 = parseInt(line.points[j].y, 10);
        aaa.push(new THREE.Vector3(x1, y1, 0));
    }

    const s = new THREE.CatmullRomCurve3(aaa, false);
    if (s.points.length <= 1) {
        return;
    }
    s.getPoints(s.points.length * 2).forEach(point => {
        ml.vertices.push(point);
    });

    const meshLine = new MeshLine();
    meshLine.setGeometry(ml);

    return {
        meshLine,
        material: new MeshLineMaterial({
            // TODO: this should be abstracted to a helper
            color: parseInt(line.brushColor.substr(1), 16),
            lineWidth: line.brushWidth,
            resolution: new THREE.Vector2(window.innerWidth, window.innerHeight),
        }),
    };
};

export const generateLinesMeta = (lines: Line[]): LineMeta[] => {
    return lines
        .map(line => {
            return generateLineMeta(line);
        })
        .filter(lineOption => !!lineOption);
};

export const clearScene = (scene: Scene) => {
    if (scene.children.length > 0) {
        scene.remove.apply(scene, scene.children);
    }
};

export const drawScene = (scene: Scene, linesMeta: LineMeta[]) => {
    return linesMeta.map(lineMeta =>
        scene.add(new THREE.Mesh(lineMeta.meshLine.geometry, lineMeta.material))
    );
};
