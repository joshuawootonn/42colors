import { Coord } from "../geometry/coord";

export function dedupeCoords<T extends Coord>(coords: T[]): T[] {
  const cache: Record<string, boolean> = {};

  const unique: T[] = [];
  for (let i = coords.length - 1; i >= 0; i--) {
    const coord = coords[i];
    const coordHash = `${coord.x}-${coord.y}`;

    if (cache[coordHash] == null) {
      unique.unshift(coord);
      cache[coordHash] = true;
    }
  }

  return unique;
}
