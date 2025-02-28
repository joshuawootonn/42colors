"use client";

import { Button } from "@/components/button";
import { Footer } from "@/components/footer";
import { Navigation } from "@/components/navigation";
import { Toolbar } from "@/components/toolbar";
import { CanvasProvider } from "@/components/use-canvas";
import { Canvas } from "@/lib/canvas";
import { cn } from "@/lib/utils";
import { stringToNumberOrDefault } from "@/lib/utils/stringToNumberOrDefault";
import { useState, useEffect } from "react";

export default function Page() {
  const [canvas, setCanvas] = useState<Canvas | null>(null);

  const [user, setUser] = useState<{ email: string; name: string }>();
  const [authUrl, setAuthUrl] = useState<string>();

  useEffect(() => {
    const element = document.getElementById("my-house");
    if (element instanceof HTMLCanvasElement) {
      const context = element.getContext("2d");
      if (context == null) {
        // todo(Josh): create a state for this
        throw new Error("Failed to initialize the Canvas");
      }

      const search = new URLSearchParams(document.location.search);
      const x = stringToNumberOrDefault.parse(search.get("x"));
      const y = stringToNumberOrDefault.parse(search.get("y"));

      const canvas = new Canvas(
        element,
        context,
        // todo(josh): make a config module that checks env vars
        process.env.NEXT_PUBLIC_API_ORIGIN ?? "https://api.42colors.com",
        process.env.NEXT_PUBLIC_API_WEBSOCKET_ORIGIN ??
          "https://api.42colors.com",
        { x, y },
      );
      canvas.fetchPixels();
      canvas.fetchAuthedUser().then(setUser);
      canvas.fetchAuthURL().then(setAuthUrl);

      setCanvas(canvas);
    }
  }, []);

  // const pointerState = useLocalCanvasSubscription(
  //   canvas,
  //   (canvas) => canvas.getPointerState(),
  //   [],
  // );
  //
  // const mode = useLocalCanvasSubscription(
  //   canvas,
  //   (canvas) => canvas.getMode(),
  //   [],
  // );

  // const isInPanMode = mode === "pan";
  // const isPanning = mode === "pan" && pointerState === "pressed";
  //
  return (
    <>
      <canvas
        id="my-house"
        className={
          cn("touch-none")
          // isInPanMode ? (isPanning ? "cursor-grabbing" : "cursor-grab") : null,
        }
        height="100vh"
        width="100vw"
      ></canvas>
      {canvas && (
        <CanvasProvider canvas={canvas}>
          {/* <!-- {#each initialColorOptions as color} --> */}
          {/* <!-- 	<input type="color" class="aspect-square w-4 h-4 border-0 border-red-700" value={color} /> --> */}
          {/* <!-- {/each} --> */}

          <div className="flex fixed top-3 right-3">
            {canvas && <Toolbar />}
          </div>

          {canvas && user?.email === "jose56wonton@gmail.com" && (
            <div className="flex flex-col items-end fixed top-1/2 -translate-y-1/2 right-3">
              <Button onClick={canvas.fetchPixels1}>
                fetch pixels as json
              </Button>
              <Button onClick={canvas.fetchPixels2}>
                fetch pixels as proto
              </Button>
              <Button onClick={canvas.fetchPixels3}>
                fetch pixels from memory
              </Button>
              <Button onClick={canvas.fetchPixels4}>
                fetch pixels from memory pre encoded
              </Button>
              <Button onClick={canvas.fetchPixels5}>
                fetch pixels from file
              </Button>
              <Button onClick={canvas.fetchPixels6}>
                fetch subsection of pixels from file
              </Button>
              <Button onClick={() => canvas.fetchPixels7(0, 0)}>
                fetch subsection of pixels from file as binary
              </Button>
            </div>
          )}
          <Footer user={user} authUrl={authUrl} />

          <div className="flex fixed bottom-3 right-3">
            {canvas && <Navigation />}
          </div>
        </CanvasProvider>
      )}
    </>
  );
}
