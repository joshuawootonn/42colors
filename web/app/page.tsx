"use client";

import { Toolbar } from "@/components/toolbar";
import { Canvas, Mode } from "@/lib/canvas";
import { useState, useEffect } from "react";

export default function Home() {
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
      canvas.fetchPixels();
      canvas.fetchAuthedUser().then(setMyUser);
      canvas.fetchAuthURL().then(setMyAuthUrl);

      setCanvas(canvas);
    }
  }, []);

  function setMode(mode: Mode) {
    canvas?.setMode(mode);
  }
  return (
    <>
      {/* <!-- {#each initialColorOptions as color} --> */}
      {/* <!-- 	<input type="color" class="aspect-square w-4 h-4 border-0 border-red-700" value={color} /> --> */}
      {/* <!-- {/each} --> */}

      <div className="flex fixed top-3 right-3">
        {canvas && <Toolbar mode={canvas.mode} setMode={setMode} />}
      </div>

      <div className="flex fixed bottom-3 right-3">
        {myUser?.name ? (
          myUser.name
        ) : myAuthUrl ? (
          <a href={myAuthUrl}>login</a>
        ) : null}
      </div>

      <canvas id="my-house" height="100vh" width="100vw"></canvas>
    </>
  );
}