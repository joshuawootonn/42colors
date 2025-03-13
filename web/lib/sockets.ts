import { parse } from "cookie";
import { Channel, Socket } from "phoenix";

export function setupSocketConnection(apiWebsocketOrigin: string): Socket {
  const token = parse(document.cookie)["token"] ?? null;
  const socket = new Socket(new URL("/socket", apiWebsocketOrigin).href, {
    params: { token },
  });
  socket.connect();

  return socket;
}

export function setupChannel(socket: Socket): Channel {
  const channel = socket.channel("region:general", {});
  channel
    .join()
    .receive("ok", (resp: unknown) => {
      console.log("Joined successfully", resp);
    })
    .receive("error", (resp: unknown) => {
      console.log("Unable to join", resp);
    });

  return channel;
}
