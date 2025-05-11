import { Pixel } from "../pixel";

export function dedupPixels(pixels: Pixel[]): Pixel[] {
  let unique: Pixel[] = [];

  for (let index = 0; index < pixels.length; index++) {
    const element = pixels[index];
    const elementHash = `${element.x}-${element.y}`;

    if (element.colorRef === 0) {
      unique = unique.filter((asdf) => `${asdf.x}-${asdf.y}` !== elementHash);
    } else {
      unique.push(element);
    }
  }

  return unique;
}
