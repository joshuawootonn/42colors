import { parse } from "cookie";
import { Channel, Socket } from "phoenix";
import protobuf from "protobufjs";
import { PanTool } from "./tools/pan";
import { PencilTool } from "./tools/pencil";
import { roundDown } from "./utils";
import { Camera, CameraState } from "./camera";
import { canvasToClientConversion } from "./utils/clientToCanvasConversion";
import { CANVAS_BUFFER, CANVAS_PIXEL_RATIO, CHUNK_LENGTH } from "./constants";
import { BrushTool } from "./tools/brush";
import { KeyboardCode } from "./keyboard-codes";
// place files you want to import through the `$lib` alias in this folder.

export type Tool = "pencil" | "brush";
export type PointerState = "default" | "pressed";

export enum State {
  Initializing = "initializing",
  Working = "working",
}

export type Store =
  | {
      state: State.Initializing;
    }
  | {
      state: State.Working;
      canvas: HTMLCanvasElement;
      context: CanvasRenderingContext2D;
      tool: Tool;
    };

type Pixel = {
  x: number;
  y: number;
  color: string;
};

const initialPixels: Pixel[] = [];

export class Canvas {
  private rafId: number = 0;
  private panTool: PanTool;
  private pencilTool: PencilTool;
  private brushTool: BrushTool;
  private tool: Tool = "pencil";
  private pointerState: PointerState = "default";
  camera: Camera;
  pixels: Pixel[] = initialPixels;

  isPanning = false;
  private socket: Socket;
  private currentChannel: Channel;
  private chunks: Record<
    string,
    { element: HTMLCanvasElement; x: number; y: number }
  > = {};
  private backgroundCanvas: HTMLCanvasElement;

  constructor(
    readonly body: HTMLBodyElement,
    readonly canvas: HTMLCanvasElement,
    readonly ctx: CanvasRenderingContext2D,
    private readonly apiOrigin: string,
    private readonly apiWebsocketOrigin: string,
    readonly cameraOptions: { x: number; y: number },
  ) {
    this.panTool = new PanTool(this);
    this.pencilTool = new PencilTool(this);
    this.brushTool = new BrushTool(this);
    this.camera = new Camera(this, cameraOptions.x, cameraOptions.y, 1);

    this.draw = this.draw.bind(this);
    this.onPointerDown = this.onPointerDown.bind(this);
    this.onPointerUp = this.onPointerUp.bind(this);
    this.onPointerOut = this.onPointerOut.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
    this.fetchPixels1 = this.fetchPixels1.bind(this);
    this.fetchPixels2 = this.fetchPixels2.bind(this);
    this.fetchPixels3 = this.fetchPixels3.bind(this);
    this.fetchPixels4 = this.fetchPixels4.bind(this);
    this.fetchPixels5 = this.fetchPixels5.bind(this);
    this.fetchPixels6 = this.fetchPixels6.bind(this);
    this.fetchPixels7 = this.fetchPixels7.bind(this);

    body.addEventListener("keydown", this.onKeyDown);
    body.addEventListener("keyup", this.onKeyUp);
    canvas.addEventListener("pointerdown", this.onPointerDown);
    canvas.addEventListener("pointerup", this.onPointerUp);
    canvas.addEventListener("pointerout", this.onPointerOut);

    const token = parse(document.cookie)["token"] ?? null;
    this.socket = new Socket(new URL("/socket", this.apiWebsocketOrigin).href, {
      params: { token },
    });
    this.socket.connect();

    this.currentChannel = this.socket.channel("region:general", {});
    this.currentChannel
      .join()
      .receive("ok", (resp: unknown) => {
        console.log("Joined successfully", resp);
      })
      .receive("error", (resp: unknown) => {
        console.log("Unable to join", resp);
      });

    this.currentChannel.on("new_pixel", (payload: { body: Pixel }) => {
      this.updatePixels(payload.body);
    });

    this.backgroundCanvas = this.createBackgroundCanvas();
    this.draw();
  }

  cleanUp() {
    this.canvas.removeEventListener("pointerdown", this.onPointerDown);
    this.canvas.removeEventListener("pointerup", this.onPointerUp);
    this.canvas.removeEventListener("pointerout", this.onPointerOut);
    cancelAnimationFrame(this.rafId);
  }

  async fetchAuthURL() {
    return fetch(new URL("/api/auth_url", this.apiOrigin)).then(async (res) => {
      const json = await res.json();

      if (!res.ok) {
        console.error(json);
        return;
      }

      return json.data.url;
    });
  }

  async fetchAuthedUser() {
    const token = parse(document.cookie)["token"] ?? null;
    if (token == null) return;

    return fetch(new URL("/api/me", this.apiOrigin), {
      headers: { Authorization: `Bearer: ${token}` },
    }).then(async (res) => {
      const json = await res.json();

      if (!res.ok) {
        return;
      }

      return json.data;
    });
  }

  binaryToPixels(binary: ArrayBuffer) {
    const uint8Array = new Uint8Array(binary);
    const parsedArray = Array.from(uint8Array);

    const pixels = [];
    for (let i = 0; i < parsedArray.length; i++) {
      if (parsedArray[i] !== 0) {
        pixels.push({
          x: i % CHUNK_LENGTH,
          y: Math.floor(i / CHUNK_LENGTH),
          color: "black",
        });
      }
    }
    return pixels;
  }

  fetchPixels() {
    const { x, y } = this.camera;
    const otherX = x + Math.floor(window.innerWidth / 5);
    const otherY = y + Math.floor(window.innerHeight / 5);

    const originChunkX = Math.floor(x / CHUNK_LENGTH);
    const originChunkY = Math.floor(y / CHUNK_LENGTH);

    const otherChunkX = Math.floor(otherX / CHUNK_LENGTH);
    const otherChunkY = Math.floor(otherY / CHUNK_LENGTH);

    for (let i = originChunkX; i <= otherChunkX; i += 1) {
      for (let j = originChunkY; j <= otherChunkY; j += 1) {
        this.fetchPixels7(i * CHUNK_LENGTH, j * CHUNK_LENGTH);
      }
    }
  }

  updatePixels(pixel: Pixel) {
    this.pixels.push(pixel);
  }

  pushPixel(pixel: Pixel) {
    this.pixels.push(pixel);
    this.currentChannel
      .push("new_pixel", { body: pixel })
      .receive("error", (resp) => {
        console.log(resp, "unauthed_user" === resp);
      });
  }

  listeners = new Map<string, () => void>();

  emitChange() {
    this.listeners.forEach((listener) => {
      listener();
    });
  }

  subscribe = (id: string, listener: () => void): (() => void) => {
    this.listeners.set(id, listener);

    return () => this.listeners.delete(id);
  };

  getTool(): Tool {
    return this.tool;
  }

  getCameraState(): CameraState {
    return { x: this.camera.x, y: this.camera.y, zoom: this.camera.zoom };
  }

  setTool(tool: Tool) {
    this.tool = tool;

    this.emitChange();
  }

  getPointerState(): PointerState {
    return this.pointerState;
  }

  setPointerState(state: PointerState) {
    this.pointerState = state;

    this.emitChange();
  }

  createBackgroundCanvas() {
    const canvas = document.createElement("canvas");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const context = canvas.getContext("2d")!;

    const buffer = 100;

    const startPoint = {
      x: roundDown(-buffer),
      y: roundDown(-buffer),
    };

    const endPoint = {
      x: roundDown(canvas.width + buffer),
      y: roundDown(canvas.height + buffer),
    };

    context.fillRect(
      startPoint.x,
      startPoint.y,
      CANVAS_PIXEL_RATIO,
      CANVAS_PIXEL_RATIO,
    );
    context.fillRect(
      endPoint.x,
      endPoint.y,
      CANVAS_PIXEL_RATIO,
      CANVAS_PIXEL_RATIO,
    );

    for (let x = startPoint.x; x <= endPoint.x; x += CANVAS_PIXEL_RATIO) {
      context.moveTo(x, startPoint.y);
      context.lineTo(x, endPoint.y);
    }

    for (let y = startPoint.y; y <= endPoint.y; y += CANVAS_PIXEL_RATIO) {
      context.moveTo(startPoint.x, y);
      context.lineTo(endPoint.x, y);
    }
    context.strokeStyle = "#eee";
    context.stroke();

    return canvas;
  }

  createChunkCanvas(pixels: Pixel[]) {
    const canvas = document.createElement("canvas");
    canvas.width = CANVAS_PIXEL_RATIO * CHUNK_LENGTH;
    canvas.height = CANVAS_PIXEL_RATIO * CHUNK_LENGTH;

    const context = canvas.getContext("2d")!;

    for (let i = 0; i < pixels.length; i++) {
      const pixel = pixels[i];
      context.fillStyle = pixel.color;
      context.fillRect(
        pixel.x * CANVAS_PIXEL_RATIO,
        pixel.y * CANVAS_PIXEL_RATIO,
        CANVAS_PIXEL_RATIO,
        CANVAS_PIXEL_RATIO,
      );
    }

    return canvas;
  }

  draw() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;

    this.ctx.translate(
      -canvasToClientConversion(this.camera.x),
      -canvasToClientConversion(this.camera.y),
    );

    this.ctx.drawImage(
      this.backgroundCanvas,
      -CANVAS_BUFFER,
      -CANVAS_BUFFER,
      window.innerWidth + CANVAS_BUFFER,
      window.innerHeight + CANVAS_BUFFER,
      -CANVAS_BUFFER + canvasToClientConversion(this.camera.x),
      -CANVAS_BUFFER + canvasToClientConversion(this.camera.y),
      window.innerWidth + CANVAS_BUFFER,
      window.innerHeight + CANVAS_BUFFER,
    );

    Object.values(this.chunks).forEach((chunk) => {
      this.ctx.drawImage(
        chunk.element,
        0,
        0,
        CANVAS_PIXEL_RATIO * CHUNK_LENGTH,
        CANVAS_PIXEL_RATIO * CHUNK_LENGTH,
        canvasToClientConversion(chunk.x),
        canvasToClientConversion(chunk.y),
        CANVAS_PIXEL_RATIO * CHUNK_LENGTH,
        CANVAS_PIXEL_RATIO * CHUNK_LENGTH,
      );
    });

    for (let i = 0; i < this.pixels.length; i++) {
      const block = this.pixels[i];
      this.ctx.fillRect(
        block.x * CANVAS_PIXEL_RATIO,
        block.y * CANVAS_PIXEL_RATIO,
        CANVAS_PIXEL_RATIO,
        CANVAS_PIXEL_RATIO,
      );
    }

    this.rafId = requestAnimationFrame(this.draw);
  }

  onPointerOut() {
    this.setPointerState("default");
  }

  onPointerUp() {
    this.setPointerState("default");
  }

  onPointerDown(e: PointerEvent) {
    this.setPointerState("pressed");

    if (this.isPanning) {
      this.panTool.onPointerDown(e);

      return;
    }

    const tool = this.tool;
    switch (tool) {
      case "pencil":
        this.pencilTool.onPointerDown();
        break;
      case "brush":
        this.brushTool.onPointerDown();
        break;

      default:
        console.log("default case of the onPointerDown");
    }
  }

  onKeyDown(e: KeyboardEvent) {
    if (e.defaultPrevented) return;

    if (e.code === KeyboardCode.Space) {
      this.isPanning = true;
    }
  }

  onKeyUp(e: KeyboardEvent) {
    if (e.defaultPrevented) return;

    if (e.code === KeyboardCode.Space) {
      this.isPanning = false;
    }
  }

  // -----------------------------------------------------------------------------
  // -----------------------------------------------------------------------------
  // -----------------------------------------------------------------------------
  // -----------------------------------------------------------------------------
  // -----------------------------------------------------------------------------
  // -----------------------------------------------------------------------------
  // -----------------------------------------------------------------------------
  // -----------------------------------------------------------------------------
  // -----------------------------------------------------------------------------
  // -----------------------------------------------------------------------------
  // -----------------------------------------------------------------------------
  // -----------------------------------------------------------------------------
  // -----------------------------------------------------------------------------
  // -----------------------------------------------------------------------------
  // -----------------------------------------------------------------------------
  // -----------------------------------------------------------------------------
  // -----------------------------------------------------------------------------
  // -----------------------------------------------------------------------------
  // -----------------------------------------------------------------------------
  // -----------------------------------------------------------------------------
  // -----------------------------------------------------------------------------
  // -----------------------------------------------------------------------------

  fetchPixels1() {
    fetch(new URL("/api/pixels", this.apiOrigin)).then(async (res) => {
      const json = await res.json();

      if (!res.ok) {
        console.error(json);
        return;
      }

      this.pixels = json.data;
    });
  }

  fetchPixels2() {
    fetch(new URL("/api/pixels2", this.apiOrigin)).then(async (res) => {
      const payload = await res.arrayBuffer();
      const array = new Uint8Array(payload);
      protobuf.load("/pixels.proto", (err, root) => {
        if (err) throw err;

        if (root == null) {
          console.warn("root is undefined");
          return;
        }

        const Pixels = root.lookupType("Pixels");

        const errMsg = Pixels.verify(payload);
        if (errMsg) throw Error(errMsg);

        const message = Pixels.decode(array);
        const object = Pixels.toObject(message, {
          longs: String,
          enums: String,
          bytes: String,
        });

        this.pixels = object.pixels;
      });
    });
  }

  fetchPixels3() {
    fetch(new URL("/api/pixels3", this.apiOrigin)).then(async (res) => {
      const payload = await res.arrayBuffer();
      const array = new Uint8Array(payload);
      protobuf.load("/pixels.proto", (err, root) => {
        if (err) throw err;

        if (root == null) {
          console.warn("root is undefined");
          return;
        }

        const Pixels = root.lookupType("Pixels");

        const errMsg = Pixels.verify(payload);
        if (errMsg) throw Error(errMsg);

        const message = Pixels.decode(array);
        const object = Pixels.toObject(message, {
          longs: String,
          enums: String,
          bytes: String,
        });

        this.pixels = object.pixels;
      });
    });
  }

  fetchPixels4() {
    fetch(new URL("/api/pixels4", this.apiOrigin)).then(async (res) => {
      const payload = await res.arrayBuffer();
      const array = new Uint8Array(payload);
      protobuf.load("/pixels.proto", (err, root) => {
        if (err) throw err;

        if (root == null) {
          console.warn("root is undefined");
          return;
        }

        const Pixels = root.lookupType("Pixels");

        const errMsg = Pixels.verify(payload);
        if (errMsg) throw Error(errMsg);

        const message = Pixels.decode(array);
        const object = Pixels.toObject(message, {
          longs: String,
          enums: String,
          bytes: String,
        });

        this.pixels = object.pixels;
      });
    });
  }

  fetchPixels5() {
    fetch(new URL("/api/pixels5", this.apiOrigin)).then(async (res) => {
      const json = await res.json();

      if (!res.ok) {
        console.error(json);
        return;
      }

      this.pixels = json.data;
    });
  }

  fetchPixels6() {
    fetch(new URL("/api/pixels6", this.apiOrigin)).then(async (res) => {
      const json = await res.json();

      if (!res.ok) {
        console.error(json);
        return;
      }

      this.pixels = json.data;
    });
  }

  fetchPixels7(x: number, y: number) {
    const search = new URLSearchParams();
    search.set("x", x.toString());
    search.set("y", y.toString());

    if (this.chunks[`x: ${x} y: ${y}`] != null) {
      console.log(`skipping fetch for cached chunk x: ${x} y: ${y}`);
      return;
    }

    console.log(`fetching chunk x: ${x} y: ${y}`);
    fetch(new URL(`/api/pixels7?${search}`, this.apiOrigin)).then(
      async (res) => {
        const binary = await res.arrayBuffer();

        if (!res.ok) {
          console.error(binary);
          return;
        }

        const pixels = this.binaryToPixels(binary);

        this.chunks[`x: ${x} y: ${y}`] = {
          element: this.createChunkCanvas(pixels),
          x,
          y,
        };
      },
    );
  }
}
