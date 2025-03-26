"use client";

// import { Navigation } from "@/components/navigation";
import { Toolbar } from "@/components/toolbar";
import { cn } from "@/lib/utils";
import {
  stringToNumberOr0,
  stringToNumberOr100,
} from "@/lib/utils/stringToNumberOrDefault";
import { store } from "@/lib/store";
import { useEffect } from "react";
import { useSelector } from "@xstate/store/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Footer } from "@/components/footer";
import { Navigation } from "@/components/navigation";

const queryClient = new QueryClient();

export default function Page() {
  useEffect(() => {
    const element = document.getElementById("my-house");
    if (element instanceof HTMLCanvasElement) {
      const context = element.getContext("2d");
      if (context == null) {
        throw new Error("Failed to initialize the Canvas");
      }

      const search = new URLSearchParams(document.location.search);
      const x = stringToNumberOr0.parse(search.get("x"));
      const y = stringToNumberOr0.parse(search.get("y"));
      const zoom = stringToNumberOr100.parse(search.get("zoom"));

      const body = document.body as HTMLBodyElement;

      store.trigger.initializeStore({
        body,
        canvas: element,
        // todo(josh): make a config module that checks env vars
        apiOrigin:
          process.env.NEXT_PUBLIC_API_ORIGIN ?? "https://api.42colors.com",
        apiWebsocketOrigin:
          process.env.NEXT_PUBLIC_API_WEBSOCKET_ORIGIN ??
          "https://api.42colors.com",
        cameraOptions: { x, y, zoom },
        queryClient,
      });

      element.addEventListener("wheel", onWheel);
      body.addEventListener("keydown", onKeyDown);
      body.addEventListener("keyup", onKeyUp);
      window.addEventListener("resize", onResize);
      element.addEventListener("pointermove", onPointerMove);
      element.addEventListener("pointerdown", onPointerDown);
      element.addEventListener("pointerup", onPointerUp);
      element.addEventListener("pointerout", onPointerOut);

      body.addEventListener("touchstart", onTouch, true);
      body.addEventListener("touchmove", onTouch, true);

      body.addEventListener("gesturestart", onGesture, true);
      body.addEventListener("gesturemove", onGesture, true);
      body.addEventListener("gestureend", onGesture, true);

      store.trigger.fetchPixels();
      store.trigger.fetchAuthURL();
      store.trigger.fetchUser();

      const rafId = requestAnimationFrame(draw);

      return () => {
        cancelAnimationFrame(rafId);

        element.removeEventListener("wheel", onWheel);
        body.removeEventListener("keydown", onKeyDown);
        body.removeEventListener("keyup", onKeyUp);
        window.removeEventListener("resize", onResize);
        element.removeEventListener("pointermove", onPointerMove);
        element.removeEventListener("pointerdown", onPointerDown);
        element.removeEventListener("pointerup", onPointerUp);
        element.removeEventListener("pointerout", onPointerOut);

        body.removeEventListener("touchstart", onTouch, true);
        body.removeEventListener("touchmove", onTouch, true);

        body.removeEventListener("gesturestart", onGesture, true);
        body.removeEventListener("gesturemove", onGesture, true);
        body.removeEventListener("gestureend", onGesture, true);
      };

      function onGesture(e: Event) {
        // console.log("gesture", e);
        e.preventDefault();
      }

      function onTouch(e: TouchEvent) {
        // console.log("touch", e.touches);
        e.preventDefault();
      }

      function draw() {
        store.trigger.draw();
        requestAnimationFrame(draw);
      }

      function onResize() {
        store.trigger.onResize();
      }

      function onWheel(e: WheelEvent) {
        // `preventDefault` in the store is in the next tick and doesn't work.
        // I have to actually call preventDefault here.
        e.preventDefault();
        store.trigger.onWheel({ e });
      }

      function onKeyDown(e: KeyboardEvent) {
        // console.log("onKeyDown");
        store.trigger.onKeyDown({ e });
      }

      function onKeyUp(e: KeyboardEvent) {
        // console.log("onKeyUp");
        store.trigger.onKeyUp({ e });
      }

      function onPointerMove() {
        // console.log("onPointerMove");
        store.trigger.onPointerMove();
        // store.trigger.onPointerMove({ e });
      }

      function onPointerUp() {
        // console.log("onPointerUp");
        store.trigger.onPointerUp();
      }

      function onPointerOut() {
        // console.log("onPointerOut");
        store.trigger.onPointerOut();
      }

      function onPointerDown(e: PointerEvent) {
        // console.log("onPointerDown");
        store.trigger.onPointerDown({ e });
      }
    }
  }, []);

  const user = useSelector(store, (state) => state.context.user);

  const isPressed = useSelector(
    store,
    (state) => state.context.interaction?.isPressed,
  );

  const isSpacePressed = useSelector(
    store,
    (state) => state.context.interaction?.isSpacePressed,
  );

  return (
    <QueryClientProvider client={queryClient}>
      <canvas
        id="my-house"
        className={cn(
          "touch-none",
          isSpacePressed
            ? isPressed
              ? "cursor-grabbing"
              : "cursor-grab"
            : null,
        )}
        height="100vh"
        width="100vw"
      ></canvas>

      <div className="flex fixed top-3 right-3">
        <Toolbar />
      </div>

      {user?.email === "jose56wonton@gmail.com" && (
        <div className="flex flex-col items-end fixed top-1/2 -translate-y-1/2 right-3">
          <pre>{JSON.stringify({ isSpacePressed, isPressed }, null, 2)}</pre>
          {/* todo */}
          {/* <Button onClick={canvas.fetchPixels1}>fetch pixels as json</Button> */}
          {/* <Button onClick={canvas.fetchPixels2}>fetch pixels as proto</Button> */}
          {/* <Button onClick={canvas.fetchPixels3}> */}
          {/*   fetch pixels from memory */}
          {/* </Button> */}
          {/* <Button onClick={canvas.fetchPixels4}> */}
          {/*   fetch pixels from memory pre encoded */}
          {/* </Button> */}
          {/* <Button onClick={canvas.fetchPixels5}>fetch pixels from file</Button> */}
          {/* <Button onClick={canvas.fetchPixels6}> */}
          {/*   fetch subsection of pixels from file */}
          {/* </Button> */}
          {/* <Button onClick={() => canvas.fetchPixels7(0, 0)}> */}
          {/*   fetch subsection of pixels from file as binary */}
          {/* </Button> */}
        </div>
      )}
      <Footer />

      <div className="flex fixed bottom-3 right-3">
        <Navigation />
      </div>
    </QueryClientProvider>
  );
}
