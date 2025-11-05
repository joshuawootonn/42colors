import { Polygon } from '../../geometry/polygon';
import { canvasToClient } from '../../utils/clientToCanvasConversion';
import {
    ClaimerCreate,
    ClaimerNewRectCreate,
    ClaimerResizeCreate,
} from './claimer';

export function getPlotOverlayPositionForPolygons(
    polygons: Polygon[],
    camera: { x: number; y: number; zoom: number },
): { x: number; y: number } {
    // Calculate the bounding box of all polygons
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    for (const polygon of polygons) {
        for (const vertex of polygon.vertices) {
            const x = vertex[0];
            const y = vertex[1];
            minX = Math.min(minX, x);
            maxX = Math.max(maxX, x);
            minY = Math.min(minY, y);
            maxY = Math.max(maxY, y);
        }
    }

    const centerX = (minX + maxX) / 2;

    // Try bottom center position first
    const bottomY = maxY;
    const screenX = canvasToClient(centerX - camera.x, camera.zoom);
    const bottomScreenY = canvasToClient(bottomY - camera.y, camera.zoom);

    // Check if bottom position is off-screen
    const isOffScreen = bottomScreenY > window.innerHeight - 100;

    // If off-screen, use top position instead
    if (isOffScreen) {
        const topY = minY;
        const topScreenY = canvasToClient(topY - camera.y, camera.zoom);
        //height of the popover
        return { x: screenX, y: topScreenY - 32 };
    }

    return { x: screenX, y: bottomScreenY };
}

export function getPlotOverlayPositionForActiveAction(
    activeAction: ClaimerCreate | ClaimerNewRectCreate | ClaimerResizeCreate,
    camera: { x: number; y: number; zoom: number },
): { x: number; y: number } {
    const polygon = activeAction.polygon;

    if (polygon == null) {
        // Fallback to center of screen if no polygon
        return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    }

    return getPlotOverlayPositionForPolygons([polygon], camera);
}
