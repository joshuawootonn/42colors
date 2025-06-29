"use client";

import { Toolbar } from "@/components/toolbar";
import { cn } from "@/lib/utils";
import {
  stringToNumberOr0,
  stringToNumberOr100,
} from "@/lib/utils/stringToNumberOrDefault";
import { store } from "@/lib/store";
import { useEffect } from "react";
import { useSelector } from "@xstate/store/react";
import { Footer } from "@/components/footer";
import { Navigation } from "@/components/navigation";
import { Palette } from "@/components/palette";
import { BrushPanel } from "@/lib/tools/brush-panel";
import { ErasurePanel } from "@/lib/tools/erasure-panel";
import { DEFAULT_TOOL_SETTINGS, getToolSettings } from "@/lib/tool-settings";
import { ClaimerPanel } from "@/lib/tools/claimer-panel";
import { useQueryClient } from "@tanstack/react-query";
import { keyEquals } from "@/lib/utils/query-key";

export default function Page() {
  const queryClient = useQueryClient();

  const state = useSelector(store, (state) => state.context.state);

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

      const toolSettings = getToolSettings();

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
        toolSettings: toolSettings ?? DEFAULT_TOOL_SETTINGS,
      });

      const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
        const key = ["user", "plots"];
        if (keyEquals(event.query.queryKey, key)) {
          store.trigger.redrawRealtimeCanvas();
        }
      });

      const rafId = requestAnimationFrame(draw);
      store.trigger.listen({ element, body });

      return () => {
        cancelAnimationFrame(rafId);
        store.trigger.unlisten({ element, body });
        unsubscribe();
      };

      function draw() {
        store.trigger.draw();
        requestAnimationFrame(draw);
      }
    }
  }, [queryClient, state]);

  const isPressed = useSelector(
    store,
    (state) => state.context.interaction?.isPressed,
  );

  const isSpacePressed = useSelector(
    store,
    (state) => state.context.interaction?.isSpacePressed,
  );

  const currentTool = useSelector(
    store,
    (state) => state.context.toolSettings.currentTool,
  );

  return (
    <>
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

      <div className="flex flex-col items-start space-y-3 fixed top-16 bottom-12 left-3">
        {state !== "initialized" ? null : (
          <>
            {currentTool === "brush" && <Palette />}
            {currentTool === "brush" && <BrushPanel />}
            {currentTool === "erasure" && <ErasurePanel />}
          </>
        )}
      </div>

      <div className="flex flex-row space-x-3 fixed top-3 left-60">
        {currentTool === "claimer" && <ClaimerPanel />}
      </div>

      <div className="flex fixed top-3 right-3">
        <Toolbar />
      </div>

      <Footer />

      <div className="flex fixed bottom-3 right-3">
        <Navigation />
      </div>
    </>
  );
}
