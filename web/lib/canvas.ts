import { parse } from "cookie";
import { Channel, Socket } from "phoenix";
import protobuf from "protobufjs";
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

export class PanTool {
  constructor(private readonly canvas: Canvas) {}

  onPointerDown(e: PointerEvent) {
    const startingCamera = this.canvas.camera.clone();
    const startingX = e.clientX;
    const startingY = e.clientY;

    const pan = (e: PointerEvent) => {
      this.canvas.camera.x = startingCamera.x - e.clientX + startingX;
      this.canvas.camera.y = startingCamera.y - e.clientY + startingY;
    };

    this.canvas.canvas.addEventListener("pointermove", pan);

    const cleanUp = () => {
      this.canvas.canvas.removeEventListener("pointermove", pan);
    };

    this.canvas.canvas.addEventListener("pointerup", cleanUp, {
      once: true,
    });

    document.addEventListener("pointerout", cleanUp, {
      once: true,
    });
  }
}

export class PencilTool {
  constructor(private readonly canvas: Canvas) {}

  onPointerDown() {
    const draw = (e: PointerEvent) => {
      const camera = this.canvas.camera;

      const x = roundDown(camera.x + e.clientX);
      const y = roundDown(camera.y + e.clientY);

      this.canvas.pushPixel({ x, y });
    };

    this.canvas.canvas.addEventListener("pointermove", draw);

    const cleanUp = () => {
      this.canvas.canvas.removeEventListener("pointermove", draw);
    };

    this.canvas.canvas.addEventListener("pointerup", cleanUp, {
      once: true,
    });

    document.addEventListener("pointerout", cleanUp, {
      once: true,
    });
  }
}

function roundDown(num: number) {
  return num - (num % 5);
}

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
  camera: Camera = new Camera(0, 0, 1);
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

    this.draw = this.draw.bind(this);
    this.onPointerDown = this.onPointerDown.bind(this);
    this.onPointerUp = this.onPointerUp.bind(this);
    this.onPointerOut = this.onPointerOut.bind(this);
    this.fetchPixels1 = this.fetchPixels1.bind(this);
    this.fetchPixels2 = this.fetchPixels2.bind(this);
    this.fetchPixels3 = this.fetchPixels3.bind(this);

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

export class Camera {
  x: number;
  y: number;
  zoom: number;

  constructor(x: number, y: number, zoom: number) {
    this.x = x;
    this.y = y;
    this.zoom = zoom;
  }

  clone() {
    return new Camera(this.x, this.y, this.zoom);
  }
}
