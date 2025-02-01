"use client";

import { Button } from "@/components/button";
import { Link } from "@/components/link";
import { Toolbar } from "@/components/toolbar";
import {
  CanvasProvider,
  useLocalCanvasSubscription,
} from "@/components/use-canvas";
import { Canvas } from "@/lib/canvas";
import { cn, deleteCookie } from "@/lib/utils";
import { useState, useEffect } from "react";

export default function Page() {
  const [canvas, setCanvas] = useState<Canvas | null>(null);

  const [myUser, setMyUser] = useState<{ email: string; name: string } | null>(
    null,
  );
  const [myAuthUrl, setMyAuthUrl] = useState<string | null>(null);

  useEffect(() => {
    const element = document.getElementById("my-house");
    if (element instanceof HTMLCanvasElement) {
      const context = element.getContext("2d");
      if (context == null) {
        // todo(Josh): create a state for this
        throw new Error("Failed to initialize the Canvas");
      }

      const canvas = new Canvas(
        element,
        context,
        // todo(josh): make a config module that checks env vars
        process.env.NEXT_PUBLIC_API_ORIGIN ?? "https://api.42colors.com",
        process.env.NEXT_PUBLIC_API_WEBSOCKET_ORIGIN ??
          "https://api.42colors.com",
      );
      canvas.fetchPixels4();
      canvas.fetchAuthedUser().then(setMyUser);
      canvas.fetchAuthURL().then(setMyAuthUrl);

      setCanvas(canvas);
    }
  }, []);

  const pointerState = useLocalCanvasSubscription(
    canvas,
    (canvas) => canvas.getPointerState(),
    [],
  );

  const mode = useLocalCanvasSubscription(
    canvas,
    (canvas) => canvas.getMode(),
    [],
  );

  const isInPanMode = mode === "pan";
  const isPanning = mode === "pan" && pointerState === "pressed";

  return (
    <>
      <canvas
        id="my-house"
        className={cn(
          isInPanMode ? (isPanning ? "cursor-grabbing" : "cursor-grab") : null,
        )}
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

          {canvas && myUser?.email === "jose56wonton@gmail.com" && (
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
            </div>
          )}

          <div className="flex fixed bottom-3 right-3 space-x-3">
            {myUser?.name ? (
              <div>{myUser.name}</div>
            ) : myAuthUrl ? (
              <Link href={myAuthUrl}>login</Link>
            ) : null}
            {myUser != null && (
              <>
                <div>/</div>
                <button
                  onClick={() => {
                    deleteCookie("token");
                    setMyUser(null);
                  }}
                >
                  logout
                </button>
              </>
            )}
          </div>
        </CanvasProvider>
      )}
    </>
  );
}
