import { Channel, Socket } from "phoenix";

export function setupSocketConnection(
  apiWebsocketOrigin: string,
  token?: string,
): Socket {
  const socket = new Socket(new URL("/socket", apiWebsocketOrigin).href, {
    params: { token: token ?? null },
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
