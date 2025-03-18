import { z } from "zod";

export const stringToNumberOr0 = z
  .string()
  .nullish()
  .transform((value: string | null | undefined) => {
    if (value == null) return 0;
    const parsedValue = parseInt(value);
    if (isNaN(parsedValue)) {
      return 0;
    }
    return parsedValue;
  });

export const stringToNumberOr100 = z
  .string()
  .nullish()
  .transform((value: string | null | undefined) => {
    if (value == null) return 100;
    const parsedValue = parseInt(value);
    if (isNaN(parsedValue)) {
      return 100;
    }
    return parsedValue;
  });
