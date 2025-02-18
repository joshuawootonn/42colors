import { z } from "zod";

export const stringToNumberOrDefault = z
  .string()
  .nullish()
  .transform((value: unknown) => {
    const parsedValue = Number(value);
    if (isNaN(parsedValue)) {
      return 0;
    }
    return parsedValue;
  });
