import { InitialStore, Store } from "../store";

export function isInitialStore(context: Store): context is InitialStore {
  const is = context.state === "initial";

  if (is) console.warn("Attempted action on uninitialized state");

  return is;
}
