"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.genID = void 0;
function genID() {
    let res = "";
    let chars = "abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    for (let i = 0; i < 80; i++) {
        res += chars[Math.floor(Math.random() * chars.length)];
    }
    return res;
}
exports.genID = genID;
class Socket {
    constructor(ws, rooms, state) {
        this.rooms = [];
        this.state = {
            room: undefined,
            token: undefined,
            id: genID(),
        };
        this.id = this.state.id;
        this.rooms = rooms;
        this.ws = ws;
        if (state)
            this.state = state;
    }
    on(eventName, handler) {
        this.ws.on("message", (data) => {
            let d = JSON.parse(data.toString());
            if (d.room !== this.state.room)
                return;
            if (!d.eventName)
                return;
            if (!d.data)
                return;
            if (eventName === d.eventName) {
                handler(...d.data);
            }
        });
    }
    join(room) {
        if (this.rooms.includes(room))
            this.state.room = room;
        return this;
    }
    leave() {
        this.state.room = undefined;
    }
    emit(eventName, ...data) {
        this.ws.send(JSON.stringify({ eventName, data }));
    }
    onAuth(handler) {
        this.ws.on("message", (data) => {
            let d = JSON.parse(data.toString());
            if (d.token) {
                this.state.token = d.token;
                handler({ token: d.token, type: typeof d.token });
            }
        });
    }
}
exports.default = Socket;
