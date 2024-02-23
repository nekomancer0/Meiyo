/// <reference types="node" />
/// <reference types="node" />
import { IncomingMessage, ServerResponse } from "http";
import http from "http";
import { WebSocket } from "ws";
import { URL } from "url";
import Socket, { SocketState } from "./Socket";
import { RouteParameters } from "./Routes";
declare class Meiyo {
    options?: Meiyo.Options;
    port?: number;
    private server;
    private wss;
    private routes;
    private globalRoutes;
    private _rooms;
    constructor(options: Meiyo.Options);
    constructor();
    on(eventName: "error", handler: (error: Error) => void): void;
    on(eventName: "headers", handler: (headers: string[], req: http.IncomingMessage) => void): void;
    on(eventName: "connection", handler: (socket: Socket, req: http.IncomingMessage) => void): void;
    on(eventName: "close", handler: () => void): void;
    on(eventName: "listening", handler: () => void): void;
    emit(eventName: string, ...data: any[]): void;
    addRoom(name: string): void;
    removeRoom(name: string): void;
    getSocketState(socket: WebSocket): Promise<SocketState>;
    getSockets(): Promise<Socket[]>;
    room(name: string): Promise<RoomInfo>;
    rooms(): RoomList;
    get<P extends string>(path: P, callback: (req: Meiyo.Request<P>, res: Meiyo.Response) => void | any): void;
    post<P extends string>(path: P, callback: (req: Meiyo.Request<P>, res: Meiyo.Response) => void | any): void;
    put<P extends string>(path: P, callback: (req: Meiyo.Request<P>, res: Meiyo.Response) => void | any): void;
    delete<P extends string>(path: P, callback: (req: Meiyo.Request<P>, res: Meiyo.Response) => void | any): void;
    use<P extends string>(path: P, callback: (req: Meiyo.Request<P>, res: Meiyo.Response, next: () => void) => void | any): void;
    static(route: string, dirpath: string): void;
    listen(): Promise<Meiyo>;
}
export interface RoomInfo {
    sockets: Socket[];
}
export type RoomList = string[];
declare namespace Meiyo {
    type Options = {
        port?: number;
    };
    type method = "GET" | "POST" | "DELETE" | "OPTIONS" | "PUT" | "ANY";
    type Request<P extends string> = IncomingMessage & {
        route: P;
        path: string;
        params: RouteParameters<P>;
        cookies: any;
        parsedUrl: URL;
        header(name: string): string | number | readonly string[] | undefined;
    };
    type Response = ServerResponse & {
        html(): Response;
        text(): Response;
        json(): Response;
        status(code: number): Response;
        header(name: string, value: string | number | readonly string[]): Response;
    };
}
export default Meiyo;
