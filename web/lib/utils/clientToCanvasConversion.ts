/**
 * @param {number} clientX or clientY - A pixel from the clients viewport
 * @returns {number} x or y - The cooresponding pixel from the canvas
 */
export function clientToCanvasConversion(clientX: number): number {
  return Math.round(clientX / 5);
}

export function canvasToClientConversion(canvasX: number): number {
  return Math.round(canvasX * 5);
}
