import { z } from "zod";

export const COLOR_TABLE = {
  0: "transparent",
  1: "#ffffff",

  2: "#DFDFDF",
  3: "#ADADAD",
  4: "#626262",
  5: "#000000",

  6: "#E7CFBE",
  7: "#B97C55",
  8: "#8A3E08",
  9: "#623510",

  10: "#F5BE8C",
  11: "#F38846",
  12: "#E75B15",
  13: "#C4480D",

  14: "#F6EE96",
  15: "#F5E826",
  16: "#F4C72C",
  17: "#C18817",

  18: "#E0EC6B",
  19: "#96B115",
  20: "#958814",
  21: "#575308",

  22: "#B6EBAD",
  23: "#62D842",
  24: "#1C9850",
  25: "#10633D",

  26: "#ACF6EF",
  27: "#2BCEC3",
  28: "#1C9393",
  29: "#106068",

  30: "#AEE4FF",
  31: "#1F8FF2",
  32: "#1248BD",
  33: "#09148D",

  34: "#C7B4F5",
  35: "#8155D8",
  36: "#7634A7",
  37: "#360881",

  38: "#EE6071",
  39: "#D51010",
  40: "#A70D2E",
  41: "#830819",

  42: "#F5B3E0",
  43: "#F375A4",
};

export const colorRefSchema = z.union([
  z.literal(0),
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
  z.literal(6),
  z.literal(7),
  z.literal(8),
  z.literal(9),
  z.literal(10),
  z.literal(11),
  z.literal(12),
  z.literal(13),
  z.literal(14),
  z.literal(15),
  z.literal(16),
  z.literal(17),
  z.literal(18),
  z.literal(19),
  z.literal(20),
  z.literal(21),
  z.literal(22),
  z.literal(23),
  z.literal(24),
  z.literal(25),
  z.literal(26),
  z.literal(27),
  z.literal(28),
  z.literal(29),
  z.literal(30),
  z.literal(31),
  z.literal(32),
  z.literal(33),
  z.literal(34),
  z.literal(35),
  z.literal(36),
  z.literal(37),
  z.literal(38),
  z.literal(39),
  z.literal(40),
  z.literal(41),
  z.literal(42),
  z.literal(43),
]);

export type ColorRef = z.infer<typeof colorRefSchema>;

export const TRANSPARENT_REF = 0;
export const BLACK_REF = 5;
export const WHITE_REF = 1;

export const COLOR_ORDER: ColorRef[] = [
  2,
  3,
  4,
  BLACK_REF,
  6,
  7,
  8,
  9,
  10,
  11,
  12,
  13,
  14,
  15,
  16,
  17,
  18,
  19,
  20,
  21,
  22,
  23,
  24,
  25,
  26,
  27,
  28,
  29,
  30,
  31,
  32,
  33,
  34,
  35,
  36,
  37,
  38,
  39,
  40,
  41,
  42,
  43,
  WHITE_REF,
];

export function getNextColor(currentColorRef: ColorRef): ColorRef {
  const currentIndex = COLOR_ORDER.indexOf(currentColorRef);
  return COLOR_ORDER[(currentIndex + 1) % COLOR_ORDER.length];
}

export function getPreviousColor(currentColorRef: ColorRef): ColorRef {
  const currentIndex = COLOR_ORDER.indexOf(currentColorRef);
  return COLOR_ORDER[(currentIndex - 1 + COLOR_ORDER.length) % COLOR_ORDER.length];
}
