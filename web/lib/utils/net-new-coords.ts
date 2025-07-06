import { Coord } from '../geometry/coord';

export function newNewCoords<T extends Coord>(
    coords: T[],
    newCoords: T[],
): T[] {
    const cache: Record<string, boolean> = {};

    const unique: T[] = [];
    const netNew: T[] = [];
    for (let i = coords.length - 1; i >= 0; i--) {
        const coord = coords[i];
        const coordHash = `${coord.x}-${coord.y}`;

        if (cache[coordHash] == null) {
            unique.unshift(coord);
            cache[coordHash] = true;
        }
    }

    for (let i = 0; i < newCoords.length; i++) {
        const coord = newCoords[i];
        const coordHash = `${coord.x}-${coord.y}`;
        if (cache[coordHash] == null) {
            netNew.push(coord);
        }
    }

    return netNew;
}
