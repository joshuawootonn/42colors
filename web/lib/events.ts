import { store } from "./store";

export function onGesture(e: Event) {
  // console.log("gesture", e);
  e.preventDefault();
}

export function onTouch(e: TouchEvent) {
  // console.log("touch", e.touches);
  e.preventDefault();
}

export function onResize() {
  store.trigger.onResize();
}

export function onWheel(e: WheelEvent) {
  // `preventDefault` in the store is in the next tick and doesn't work.
  // I have to actually call preventDefault here.
  e.preventDefault();
  store.trigger.onWheel({ e });
}

export function onKeyDown(e: KeyboardEvent) {
  // console.log("onKeyDown");
  store.trigger.onKeyDown({ e });
}

export function onKeyUp(e: KeyboardEvent) {
  // console.log("onKeyUp");
  store.trigger.onKeyUp({ e });
}

export function onPointerMove(e: PointerEvent) {
  // console.log("onPointerMove");
  store.trigger.onPointerMove({ e });
}

export function onPointerUp() {
  // console.log("onPointerUp");
  store.trigger.onPointerUp();
}

export function onPointerOut() {
  // console.log("onPointerOut");
  store.trigger.onPointerOut();
}

export function onPointerDown(e: PointerEvent) {
  // console.log("onPointerDown");
  store.trigger.onPointerDown({ e });
}
