export function clamp(num: number, min: number, max: number) {
  return Math.min(Math.max(min, num), max);
}
