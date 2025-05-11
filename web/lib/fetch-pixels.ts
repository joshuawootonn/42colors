// import protobuf from "protobufjs";
import { ChunkPixel, chunkPixelSchema } from "./chunk";
import { CHUNK_LENGTH } from "./constants";
import { ColorRef } from "./palette";
import { Pixel } from "./pixel";

// function fetchPixels1(apiOrigin: string) {
//   fetch(new URL("/api/pixels", apiOrigin)).then(async (res) => {
//     const json = await res.json();
//
//     if (!res.ok) {
//       console.error(json);
//       return;
//     }
//
//     return json.data;
//   });
// }
//
// function fetchPixels2(apiOrigin: string) {
//   fetch(new URL("/api/pixels2", apiOrigin)).then(async (res) => {
//     const payload = await res.arrayBuffer();
//     const array = new Uint8Array(payload);
//       protobuf.load("/pixels.proto", (err, root) => {
//       if (err) throw err;
//
//       if (root == null) {
//         console.warn("root is undefined");
//         return;
//       }
//
//       const Pixels = root.lookupType("Pixels");
//
//       const errMsg = Pixels.verify(payload);
//       if (errMsg) throw Error(errMsg);
//
//       const message = Pixels.decode(array);
//       const object = Pixels.toObject(message, {
//         longs: String,
//         enums: String,
//         bytes: String,
//       });
//
//       return object.pixels;
//     });
//   });
// }
//
// function fetchPixels3(apiOrigin: string) {
//   fetch(new URL("/api/pixels3", apiOrigin)).then(async (res) => {
//     const payload = await res.arrayBuffer();
//     const array = new Uint8Array(payload);
//     protobuf.load("/pixels.proto", (err, root) => {
//       if (err) throw err;
//
//       if (root == null) {
//         console.warn("root is undefined");
//         return;
//       }
//
//       const Pixels = root.lookupType("Pixels");
//
//       const errMsg = Pixels.verify(payload);
//       if (errMsg) throw Error(errMsg);
//
//       const message = Pixels.decode(array);
//       const object = Pixels.toObject(message, {
//         longs: String,
//         enums: String,
//         bytes: String,
//       });
//
//       return object.pixels;
//     });
//   });
// }
//
// function fetchPixels4(apiOrigin: string) {
//   fetch(new URL("/api/pixels4", apiOrigin)).then(async (res) => {
//     const payload = await res.arrayBuffer();
//     const array = new Uint8Array(payload);
//     protobuf.load("/pixels.proto", (err, root) => {
//       if (err) throw err;
//
//       if (root == null) {
//         console.warn("root is undefined");
//         return;
//       }
//
//       const Pixels = root.lookupType("Pixels");
//
//       const errMsg = Pixels.verify(payload);
//       if (errMsg) throw Error(errMsg);
//
//       const message = Pixels.decode(array);
//       const object = Pixels.toObject(message, {
//         longs: String,
//         enums: String,
//         bytes: String,
//       });
//
//       return object.pixels;
//     });
//   });
// }
//
// function fetchPixels5(apiOrigin: string) {
//   fetch(new URL("/api/pixels5", apiOrigin)).then(async (res) => {
//     const json = await res.json();
//
//     if (!res.ok) {
//       console.error(json);
//       return;
//     }
//
//     return json.data;
//   });
// }
//
// function fetchPixels6(apiOrigin: string) {
//   fetch(new URL("/api/pixels6", apiOrigin)).then(async (res) => {
//     const json = await res.json();
//
//     if (!res.ok) {
//       console.error(json);
//       return;
//     }
//
//     return json.data;
//   });
// }

function binaryToPixels(binary: ArrayBuffer): ChunkPixel[] {
  const uint8Array = new Uint8Array(binary);
  const parsedArray = Array.from(uint8Array);

  const pixels = [];
  for (let i = 0; i < parsedArray.length; i++) {
    if (parsedArray[i] !== 0) {
      pixels.push(
        chunkPixelSchema.parse({
          x: i % CHUNK_LENGTH,
          y: Math.floor(i / CHUNK_LENGTH),
          colorRef: parsedArray[i] as ColorRef,
        }),
      );
    }
  }
  return pixels;
}

export async function fetchPixels7(
  apiOrigin: string,
  x: number,
  y: number,
): Promise<Pixel[]> {
  const search = new URLSearchParams();
  search.set("x", x.toString());
  search.set("y", y.toString());

  console.log(`fetching chunk x: ${x} y: ${y}`);
  return fetch(new URL(`/api/pixels7?${search}`, apiOrigin)).then(
    async (res) => {
      const binary = await res.arrayBuffer();

      if (!res.ok) {
        console.error(binary);
        return [];
      }

      const pixels = binaryToPixels(binary);
      return pixels;
    },
  );
}
