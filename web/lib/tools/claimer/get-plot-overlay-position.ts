import {
    Polygon,
    getCompositePolygons,
    rectToPolygonSchema,
} from '../../geometry/polygon';
import { canvasToClient } from '../../utils/clientToCanvasConversion';
import { ClaimerCreate } from './claimer';

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

    // Calculate bottom center position
    const centerX = (minX + maxX) / 2;
    const bottomY = maxY;

    // Convert from canvas coordinates to screen coordinates
    const screenX = canvasToClient(centerX - camera.x, camera.zoom);
    const screenY = canvasToClient(bottomY - camera.y, camera.zoom);

    return { x: screenX, y: screenY };
}

export function getPlotOverlayPositionForActiveAction(
    activeAction: ClaimerCreate,
    camera: { x: number; y: number; zoom: number },
): { x: number; y: number } {
    const rects = [...activeAction.rects];
    if (activeAction.nextRect != null) {
        rects.push(activeAction.nextRect);
    }

    if (rects.length === 0) {
        // Fallback to center of screen if no rects
        return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    }

    const polygons = rects.map((rect) => rectToPolygonSchema.parse(rect));
    const aggregatedPolygons = getCompositePolygons(polygons);

    if (aggregatedPolygons.length === 0) {
        return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    }

    return getPlotOverlayPositionForPolygons(aggregatedPolygons, camera);
}
