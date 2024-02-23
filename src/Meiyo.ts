import { IncomingMessage, Server, ServerResponse } from "http";
import http from "http";
import Request, { isMatching } from "./Request";
import Response from "./Response";
import { WebSocketServer, WebSocket } from "ws";
import { URL } from "url";
import { existsSync, readFileSync } from "fs";
import path from "path";
import Socket, { SocketState } from "./Socket";
import { RouteParameters } from "./Routes";

class Meiyo {
  options?: Meiyo.Options;
  port?: number;

  private server: Server = http.createServer();
  private wss: WebSocketServer;

  private routes: any[] = [];
  private globalRoutes: any[] = [];
  private _rooms: string[] = [];
  constructor(options: Meiyo.Options);
  constructor();

  constructor(options?: Meiyo.Options, server?: Server) {
    this.options = options;
    this.port = options?.port;

    if (server) this.server = server;
    this.wss = new WebSocketServer({ server: this.server });
  }

  on(eventName: "error", handler: (error: Error) => void): void;
  on(
    eventName: "headers",
    handler: (headers: string[], req: http.IncomingMessage) => void
  ): void;
  on(
    eventName: "connection",
    handler: (socket: Socket, req: http.IncomingMessage) => void
  ): void;
  on(eventName: "close", handler: () => void): void;
  on(eventName: "listening", handler: () => void): void;

  on(
    eventName: "connection" | "close" | "error" | "listening" | "headers",
    handler:
      | ((socket: Socket, req: http.IncomingMessage) => void)
      | (() => void)
      | ((error: Error) => void)
      | ((headers: string[], req: http.IncomingMessage) => void)
  ) {
    switch (eventName) {
      case "connection":
        this.wss.on("connection", (socket, req) => {
          //@ts-ignore
          handler(new Socket(socket, this._rooms), req);
        });
        break;

      default:
        this.wss.on(eventName, handler);
    }
  }

  emit(eventName: string, ...data: any[]) {
    for (let client of this.wss.clients) {
      client.send(JSON.stringify({ eventName, data }));
    }
  }

  addRoom(name: string) {
    this._rooms.push(name);
  }

  removeRoom(name: string) {
    this._rooms = this._rooms.filter((n) => n !== name);
  }

  getSocketState(socket: WebSocket): Promise<SocketState> {
    return new Promise((resolve, reject) => {
      socket.send(JSON.stringify({ eventName: "check_state" }));
      socket.on("message", (data) => {
        let d = JSON.parse(data.toString());

        if (!d.eventName) return;
        if (!d.state) return;

        resolve(d.state);
      });
    });
  }

  async getSockets(): Promise<Socket[]> {
    let sockets: Socket[] = [];
    for (let ws of this.wss.clients) {
      let state = await this.getSocketState(ws);

      sockets.push(new Socket(ws, this._rooms, state));
    }

    return sockets;
  }

  async room(name: string): Promise<RoomInfo> {
    let sockets = await this.getSockets();
    let socketsInRoom = sockets.filter((s) => s.id === name);

    return { sockets: socketsInRoom };
  }

  rooms(): RoomList {
    return this._rooms;
  }

  get<P extends string>(
    path: P,
    callback: (req: Meiyo.Request<P>, res: Meiyo.Response) => void | any
  ) {
    this.routes.push({ method: "GET", path, callback });
  }

  post<P extends string>(
    path: P,
    callback: (req: Meiyo.Request<P>, res: Meiyo.Response) => void | any
  ) {
    this.routes.push({ method: "POST", path, callback });
  }

  put<P extends string>(
    path: P,
    callback: (req: Meiyo.Request<P>, res: Meiyo.Response) => void | any
  ) {
    this.routes.push({ method: "PUT", path, callback });
  }

  delete<P extends string>(
    path: P,
    callback: (req: Meiyo.Request<P>, res: Meiyo.Response) => void | any
  ) {
    this.routes.push({ method: "DELETE", path, callback });
  }

  use<P extends string>(
    path: P,
    callback: (
      req: Meiyo.Request<P>,
      res: Meiyo.Response,
      next: () => void
    ) => void | any
  ) {
    let parsedPath = "";
    if (path === "*") parsedPath = "/:";
    else if (path.endsWith("/")) parsedPath = path + ":";
    else parsedPath = path;

    this.globalRoutes.push({ path: parsedPath, callback });
  }

  static(route: string, dirpath: string) {
    if (dirpath.startsWith("./")) {
      dirpath = dirpath.replace(/^(\/\.)/, process.cwd() + "/");
    } else if (dirpath.startsWith("/")) {
      dirpath = dirpath.replace(/^\//, process.cwd() + "/");
    }

    this.server.on("request", (req, res) => {
      let parsedUrl = new URL(req.url!, `http://${req.headers.host}`);

      var extname = path.extname(req.url!);
      var contentType = "text/html";
      switch (extname) {
        case ".js":
          contentType = "text/javascript";
          break;
        case ".ts":
          contentType = "text/javascript";
          break;
        case ".css":
          contentType = "text/css";
          break;
        case ".json":
          contentType = "application/json";
          break;
        case ".png":
          contentType = "image/png";
          break;
        case ".jpg":
          contentType = "image/jpg";
          break;
        case ".wav":
          contentType = "audio/wav";
          break;
      }

      if (parsedUrl.pathname.startsWith(route)) {
        let file = path.join(
          dirpath,
          parsedUrl.pathname.split("/").splice(-1, 1).join("/")
        );

        if (existsSync(file)) {
          res.writeHead(200, { "Content-Type": contentType });
          res.end(readFileSync(file));
        } else {
          res.writeHead(404, { "Content-Type": "text/Plain" });
          res.end(`Cannot ${req.method} ${req.url}`);
        }
      }
    });
  }

  listen(): Promise<Meiyo>;
  async listen(port?: number): Promise<Meiyo> {
    return new Promise((resolve, reject) => {
      if (!port) port = this.options?.port;
      if (!port) throw "Can't listen to a server with no port provided";

      this.server.on("request", (req, res) => {
        if (res.headersSent) return;
        for (let globalRoute of this.globalRoutes) {
          if (isMatching(req.url!, globalRoute.path)) {
            let response = globalRoute.callback(
              Request(req, globalRoute.path),
              Response(res),
              () => {
                for (let route of this.routes) {
                  matchAndSend(route, req, res);
                }
              }
            );

            if (response) {
              sendResponse(response, res);
            }
          }
        }
      });

      function sendResponse(result: any, res: ServerResponse) {
        let status = 200;
        let value = result;

        if (result instanceof Array) {
          status = result[0];
          value = result[1];
        }

        if (typeof value === "object") {
          res.writeHead(status, { "Content-Type": "application/json" });
          res.end(JSON.stringify(value));
        } else if (
          res.getHeader("Content-Type") === "text/html; charset=utf-8"
        ) {
          res.end(value);
        } else {
          res.writeHead(status, {
            "Content-Length": Buffer.byteLength(value),
            "Content-Type": "text/plain",
          });

          res.end(value);
        }
      }

      function matchAndSend(
        route: any,
        req: IncomingMessage,
        res: ServerResponse
      ) {
        if (res.headersSent) return;

        if (isMatching(req.url!, route.path) && req.method === route.method) {
          let response = route.callback(
            Request(req, route.path),
            Response(res)
          );

          if (response) {
            sendResponse(response, res);
          }
        } else {
          res.writeHead(404, { "Content-Type": "text/Plain" });
          res.end(`Cannot ${req.method} ${req.url}`);
        }
      }

      for (let route of this.routes) {
        this.server.on("request", (req, res) => {
          matchAndSend(route, req, res);
        });
      }

      this.port = port;

      this.server.listen(port, () => {
        resolve(this);
      });
    });
  }
}

export interface RoomInfo {
  sockets: Socket[];
}

export type RoomList = string[];

namespace Meiyo {
  export type Options = {
    port?: number;
  };

  export type method = "GET" | "POST" | "DELETE" | "OPTIONS" | "PUT" | "ANY";

  export type Request<P extends string> = IncomingMessage & {
    route: P;
    path: string;
    params: RouteParameters<P>;
    cookies: any;
    parsedUrl: URL;
    header(name: string): string | number | readonly string[] | undefined;
  };

  export type Response = ServerResponse & {
    html(): Response;
    text(): Response;
    json(): Response;
    status(code: number): Response;
    header(name: string, value: string | number | readonly string[]): Response;
  };
}

export default Meiyo;
