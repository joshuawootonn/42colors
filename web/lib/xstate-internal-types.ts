/* eslint-disable @typescript-eslint/no-explicit-any */
import { EventObject } from "@xstate/store";

type AllKeys<T> = T extends any ? keyof T : never;
type DistributiveOmit<T, K extends PropertyKey> = T extends any ? Omit<T, K> : never;
type EmitterFunction<TEmittedEvent extends EventObject> = (
  ...args: {
    type: TEmittedEvent["type"];
  } extends TEmittedEvent
    ? AllKeys<TEmittedEvent> extends "type"
      ? []
      : [DistributiveOmit<TEmittedEvent, "type">?]
    : [DistributiveOmit<TEmittedEvent, "type">]
) => void;
export type EnqueueObject<TEmittedEvent extends EventObject> = {
  emit: {
    [E in TEmittedEvent as E["type"]]: EmitterFunction<E>;
  };
  effect: (fn: () => void) => void;
};
