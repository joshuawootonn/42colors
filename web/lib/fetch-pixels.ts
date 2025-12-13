import { ChunkPixel } from "./canvas/chunk";
import { CHUNK_LENGTH } from "./constants";
import { Pixel } from "./geometry/coord";
import { ColorRef } from "./palette";

function binaryToPixels(binary: ArrayBuffer): ChunkPixel[] {
  const uint8Array = new Uint8Array(binary);
  const parsedArray = Array.from(uint8Array);

  const pixels = [];
  for (let i = 0; i < parsedArray.length; i++) {
    if (parsedArray[i] !== 0) {
      // Casting here instead of parsing because parsing is really expensive and other than the type branding is unnecessary
      pixels.push({
        x: i % CHUNK_LENGTH,
        y: Math.floor(i / CHUNK_LENGTH),
        color_ref: parsedArray[i] as ColorRef,
      } as ChunkPixel);
    }
  }
  return pixels;
}

export async function fetchPixels(apiOrigin: string, x: number, y: number): Promise<Pixel[]> {
  const search = new URLSearchParams();
  search.set("x", x.toString());
  search.set("y", y.toString());

  console.debug(`fetching chunk x: ${x} y: ${y}`);
  return fetch(new URL(`/api/pixels?${search}`, apiOrigin)).then(async (res) => {
    const binary = await res.arrayBuffer();

    if (!res.ok) {
      console.error(binary);
      return [];
    }

    const pixels = binaryToPixels(binary);
    return pixels;
  });
}
