import { AbsolutePointTuple } from "./line";
import { getPixelSize, getSizeInPixelsPlusBleed } from "./canvas/realtime";
import { Camera, getZoomMultiplier } from "./camera";

export function centerCameraOnPoint(point: AbsolutePointTuple, camera: Camera) {
  const zoomMultiplier = getZoomMultiplier(camera);

  const pixelSize = getPixelSize(zoomMultiplier);
  const canvasWidthPlusBleed = getSizeInPixelsPlusBleed(window.innerWidth, pixelSize);
  const canvasHeightPlusBleed = getSizeInPixelsPlusBleed(window.innerHeight, pixelSize);

  const x = point[0] - canvasWidthPlusBleed / 2;
  const y = point[1] - canvasHeightPlusBleed / 2;

  return {
    x ,
    y,
    zoom: camera.zoom,
  };
}