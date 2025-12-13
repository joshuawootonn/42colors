import { BrushSettings } from "./brush";

export function clampBrushSize(size: number): BrushSettings["size"] {
  return Math.max(Math.min(size, 10), 1);
}
