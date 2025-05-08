export function roundToFive(num: number) {
  return num - (num % 5);
}

export function roundToTen(num: number) {
  return num - (num % 10);
}

export function roundTo1Place(num: number) {
  return Math.round(num * 10) / 10;
}
