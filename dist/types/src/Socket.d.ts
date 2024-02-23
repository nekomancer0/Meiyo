import { WebSocket } from "ws";
export declare function genID(): string;
export default class Socket {
    private ws;
    private rooms;
    private state;
    id: string;
    constructor(ws: WebSocket, rooms: string[], state?: SocketState);
    on(eventName: string, handler: (...args: any[]) => void): void;
    join(room: string): this;
    leave(): void;
    emit(eventName: string, ...data: any[]): void;
    onAuth(handler: (opts: {
        token: any;
        type: any;
    }) => void): void;
}
export type SocketState = {
    room?: string;
    token?: any;
    id: string;
};
