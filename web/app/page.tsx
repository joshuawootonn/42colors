"use client";

// import { Navigation } from "@/components/navigation";
import { Toolbar } from "@/components/toolbar";
import { cn } from "@/lib/utils";
import { stringToNumberOrDefault } from "@/lib/utils/stringToNumberOrDefault";
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
      const x = stringToNumberOrDefault.parse(search.get("x"));
      const y = stringToNumberOrDefault.parse(search.get("y"));
      const zoom = stringToNumberOrDefault.parse(search.get("zoom"));

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

      body.addEventListener("wheel", onWheel);
      body.addEventListener("keydown", onKeyDown);
      body.addEventListener("keyup", onKeyUp);
      element.addEventListener("pointerdown", onPointerDown);
      element.addEventListener("pointerup", onPointerUp);
      element.addEventListener("pointerout", onPointerOut);

      store.trigger.fetchPixels();
      store.trigger.fetchAuthURL();
      store.trigger.fetchUser();

      const rafId = requestAnimationFrame(draw);

      return () => {
        cancelAnimationFrame(rafId);

        body.removeEventListener("wheel", onWheel);
        body.removeEventListener("keydown", onKeyDown);
        body.removeEventListener("keyup", onKeyUp);
        element.removeEventListener("pointerdown", onPointerDown);
        element.removeEventListener("pointerup", onPointerUp);
        element.removeEventListener("pointerout", onPointerOut);
      };
      function draw() {
        store.trigger.draw();
        requestAnimationFrame(draw);
      }
      function onWheel(e: WheelEvent) {
        store.trigger.onWheel({ e });
      }
      function onKeyDown(e: KeyboardEvent) {
        store.trigger.onKeyDown({ e });
      }
      function onKeyUp(e: KeyboardEvent) {
        store.trigger.onKeyUp({ e });
      }
      function onPointerUp() {
        store.trigger.onPointerUp();
      }
      function onPointerOut() {
        store.trigger.onPointerOut();
      }
      function onPointerDown(e: PointerEvent) {
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
