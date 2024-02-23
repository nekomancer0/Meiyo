import { WebSocket } from "ws";

export function genID() {
  let res = "";
  let chars = "abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  for (let i = 0; i < 80; i++) {
    res += chars[Math.floor(Math.random() * chars.length)];
  }

  return res;
}

export default class Socket {
  private ws: WebSocket;
  private rooms: string[] = [];
  private state: SocketState = {
    room: undefined,
    token: undefined,
    id: genID(),
  };

  public id = this.state.id;

  constructor(ws: WebSocket, rooms: string[], state?: SocketState) {
    this.rooms = rooms;
    this.ws = ws;

    if (state) this.state = state;
  }

  on(eventName: string, handler: (...args: any[]) => void) {
    this.ws.on("message", (data) => {
      let d: { eventName: string; data: any; room?: string } = JSON.parse(
        data.toString()
      );

      if (d.room !== this.state.room) return;
      if (!d.eventName) return;
      if (!d.data) return;

      if (eventName === d.eventName) {
        handler(...d.data);
      }
    });
  }

  join(room: string) {
    if (this.rooms.includes(room)) this.state.room = room;
    return this;
  }

  leave() {
    this.state.room = undefined;
  }

  emit(eventName: string, ...data: any[]) {
    this.ws.send(JSON.stringify({ eventName, data }));
  }

  onAuth(handler: (opts: { token: any; type: any }) => void) {
    this.ws.on("message", (data) => {
      let d: { token: any } = JSON.parse(data.toString());
      if (d.token) {
        this.state.token = d.token;
        handler({ token: d.token, type: typeof d.token });
      }
    });
  }
}

export type SocketState = {
  room?: string;
  token?: any;
  id: string;
};
