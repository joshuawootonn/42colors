import { parse } from "cookie";
import { Channel, Socket } from "phoenix";
import protobuf from "protobufjs";
import { PanTool } from "./tools/pan";
import { PencilTool } from "./tools/pencil";
import { roundDown } from "./utils";
import { Camera, CameraState } from "./camera";
// place files you want to import through the `$lib` alias in this folder.

export type Mode = "pencil" | "pan";
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
      mode: Mode;
    };

type Pixel = {
  x: number;
  y: number;
};

const initialPixels: Pixel[] = [];

export class Canvas {
  private rafId: number = 0;
  private panTool: PanTool;
  private pencilTool: PencilTool;
  private mode: Mode = "pan";
  private pointerState: PointerState = "default";
  camera: Camera;
  pixels: Pixel[] = initialPixels;
  private socket: Socket;
  private currentChannel: Channel;

  constructor(
    readonly canvas: HTMLCanvasElement,
    readonly ctx: CanvasRenderingContext2D,
    private readonly apiOrigin: string,
    private readonly apiWebsocketOrigin: string,
  ) {
    this.panTool = new PanTool(this);
    this.pencilTool = new PencilTool(this);
    this.camera = new Camera(this, 0, 0, 1);

    this.draw = this.draw.bind(this);
    this.onPointerDown = this.onPointerDown.bind(this);
    this.onPointerUp = this.onPointerUp.bind(this);
    this.onPointerOut = this.onPointerOut.bind(this);
    this.fetchPixels1 = this.fetchPixels1.bind(this);
    this.fetchPixels2 = this.fetchPixels2.bind(this);
    this.fetchPixels3 = this.fetchPixels3.bind(this);
    this.fetchPixels4 = this.fetchPixels4.bind(this);
    this.fetchPixels5 = this.fetchPixels5.bind(this);
    this.fetchPixels6 = this.fetchPixels6.bind(this);
    this.fetchPixels7 = this.fetchPixels7.bind(this);

    this.draw();
    canvas.addEventListener("pointerdown", this.onPointerDown);
    canvas.addEventListener("pointerup", this.onPointerUp);
    canvas.addEventListener("pointerout", this.onPointerOut);
    this.socket = new Socket(new URL("/socket", this.apiWebsocketOrigin).href);
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
        console.error(json);
        return;
      }

      return json.data;
    });
  }

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

  fetchPixels7() {
    fetch(new URL("/api/pixels7", this.apiOrigin)).then(async (res) => {
      const binary = await res.arrayBuffer();

      if (!res.ok) {
        console.error(binary);
        return;
      }

      const uint8Array = new Uint8Array(binary);

      // Convert Uint8Array to a regular array
      const parsedArray = Array.from(uint8Array);

      const pixels = [];
      for (let i = 0; i < parsedArray.length; i++) {
        if (parsedArray[i] === 0) continue;

        pixels.push({
          x: (i - 500) % 2001,
          y: Math.floor(i / 2001) - 500,
        });
      }

      this.pixels = pixels;
    });
  }

  updatePixels(pixel: Pixel) {
    this.pixels.push(pixel);
  }

  pushPixel(pixel: Pixel) {
    this.pixels.push(pixel);
    this.currentChannel.push("new_pixel", { body: pixel });
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

  getMode(): Mode {
    return this.mode;
  }

  getCameraState(): CameraState {
    return { x: this.camera.x, y: this.camera.y, zoom: this.camera.zoom };
  }

  setMode(mode: Mode) {
    this.mode = mode;

    this.emitChange();
  }

  getPointerState(): PointerState {
    return this.pointerState;
  }

  setPointerState(state: PointerState) {
    this.pointerState = state;

    this.emitChange();
  }

  drawBoard() {
    const buffer = 100;
    const cameraX = this.camera.x;
    const cameraY = this.camera.y;

    const startPoint = {
      x: roundDown(cameraX - buffer),
      y: roundDown(cameraY - buffer),
    };

    const endPoint = {
      x: roundDown(cameraX + this.canvas.width + buffer),
      y: roundDown(cameraY + this.canvas.height + buffer),
    };

    this.ctx.fillRect(startPoint.x, startPoint.y, 5, 5);
    this.ctx.fillRect(endPoint.x, endPoint.y, 5, 5);

    for (let x = startPoint.x; x <= endPoint.x; x += 5) {
      this.ctx.moveTo(x, startPoint.y);
      this.ctx.lineTo(x, endPoint.y);
    }

    for (let y = startPoint.y; y <= endPoint.y; y += 5) {
      this.ctx.moveTo(startPoint.x, y);
      this.ctx.lineTo(endPoint.x, y);
    }
    this.ctx.strokeStyle = "#eee";
    this.ctx.stroke();
  }

  draw() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;

    this.ctx.translate(-this.camera.x, -this.camera.y);

    this.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    this.drawBoard();

    for (let i = 0; i < this.pixels.length; i++) {
      const block = this.pixels[i];
      this.ctx.fillRect(block.x, block.y, 5, 5);
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

    const mode = this.mode;
    switch (mode) {
      case "pencil":
        this.pencilTool.onPointerDown();
        break;
      case "pan":
        this.panTool.onPointerDown(e);
        break;

      default:
        console.log("default case of the onPointerDown");
    }
  }
}
