import { Pixel } from "../pixel";

export function dedupePixels(pixels: Pixel[]): Pixel[] {
  const cache: Record<string, boolean> = {};

  const unique: Pixel[] = [];
  for (let i = pixels.length - 1; i >= 0; i--) {
    const element = pixels[i];
    const elementHash = `${element.x}-${element.y}`;

    if (cache[elementHash] == null) {
      unique.unshift(element);
      cache[elementHash] = true;
    }
  }

  return unique;
}
