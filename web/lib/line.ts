import { z } from 'zod';

export const absolutePointTupleSchema = z
    .tuple([z.number(), z.number()])
    .brand<'Absolute Point in Tuple'>();

export type AbsolutePointTuple = z.infer<typeof absolutePointTupleSchema>;
