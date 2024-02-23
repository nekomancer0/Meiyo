"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const Request_1 = __importStar(require("./Request"));
const Response_1 = __importDefault(require("./Response"));
const ws_1 = require("ws");
const url_1 = require("url");
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const Socket_1 = __importDefault(require("./Socket"));
class Meiyo {
    constructor(options, server) {
        this.server = http_1.default.createServer();
        this.routes = [];
        this.globalRoutes = [];
        this._rooms = [];
        this.options = options;
        this.port = options === null || options === void 0 ? void 0 : options.port;
        if (server)
            this.server = server;
        this.wss = new ws_1.WebSocketServer({ server: this.server });
    }
    on(eventName, handler) {
        switch (eventName) {
            case "connection":
                this.wss.on("connection", (socket, req) => {
                    //@ts-ignore
                    handler(new Socket_1.default(socket, this._rooms), req);
                });
                break;
            default:
                this.wss.on(eventName, handler);
        }
    }
    emit(eventName, ...data) {
        for (let client of this.wss.clients) {
            client.send(JSON.stringify({ eventName, data }));
        }
    }
    addRoom(name) {
        this._rooms.push(name);
    }
    removeRoom(name) {
        this._rooms = this._rooms.filter((n) => n !== name);
    }
    getSocketState(socket) {
        return new Promise((resolve, reject) => {
            socket.send(JSON.stringify({ eventName: "check_state" }));
            socket.on("message", (data) => {
                let d = JSON.parse(data.toString());
                if (!d.eventName)
                    return;
                if (!d.state)
                    return;
                resolve(d.state);
            });
        });
    }
    getSockets() {
        return __awaiter(this, void 0, void 0, function* () {
            let sockets = [];
            for (let ws of this.wss.clients) {
                let state = yield this.getSocketState(ws);
                sockets.push(new Socket_1.default(ws, this._rooms, state));
            }
            return sockets;
        });
    }
    room(name) {
        return __awaiter(this, void 0, void 0, function* () {
            let sockets = yield this.getSockets();
            let socketsInRoom = sockets.filter((s) => s.id === name);
            return { sockets: socketsInRoom };
        });
    }
    rooms() {
        return this._rooms;
    }
    get(path, callback) {
        this.routes.push({ method: "GET", path, callback });
    }
    post(path, callback) {
        this.routes.push({ method: "POST", path, callback });
    }
    put(path, callback) {
        this.routes.push({ method: "PUT", path, callback });
    }
    delete(path, callback) {
        this.routes.push({ method: "DELETE", path, callback });
    }
    use(path, callback) {
        let parsedPath = "";
        if (path === "*")
            parsedPath = "/:";
        else if (path.endsWith("/"))
            parsedPath = path + ":";
        else
            parsedPath = path;
        this.globalRoutes.push({ path: parsedPath, callback });
    }
    static(route, dirpath) {
        if (dirpath.startsWith("./")) {
            dirpath = dirpath.replace(/^(\/\.)/, process.cwd() + "/");
        }
        else if (dirpath.startsWith("/")) {
            dirpath = dirpath.replace(/^\//, process.cwd() + "/");
        }
        this.server.on("request", (req, res) => {
            let parsedUrl = new url_1.URL(req.url, `http://${req.headers.host}`);
            var extname = path_1.default.extname(req.url);
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
                let file = path_1.default.join(dirpath, parsedUrl.pathname.split("/").splice(-1, 1).join("/"));
                if ((0, fs_1.existsSync)(file)) {
                    res.writeHead(200, { "Content-Type": contentType });
                    res.end((0, fs_1.readFileSync)(file));
                }
                else {
                    res.writeHead(404, { "Content-Type": "text/Plain" });
                    res.end(`Cannot ${req.method} ${req.url}`);
                }
            }
        });
    }
    listen(port) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                var _a;
                if (!port)
                    port = (_a = this.options) === null || _a === void 0 ? void 0 : _a.port;
                if (!port)
                    throw "Can't listen to a server with no port provided";
                this.server.on("request", (req, res) => {
                    if (res.headersSent)
                        return;
                    for (let globalRoute of this.globalRoutes) {
                        if ((0, Request_1.isMatching)(req.url, globalRoute.path)) {
                            let response = globalRoute.callback((0, Request_1.default)(req, globalRoute.path), (0, Response_1.default)(res), () => {
                                for (let route of this.routes) {
                                    matchAndSend(route, req, res);
                                }
                            });
                            if (response) {
                                sendResponse(response, res);
                            }
                        }
                    }
                });
                function sendResponse(result, res) {
                    let status = 200;
                    let value = result;
                    if (result instanceof Array) {
                        status = result[0];
                        value = result[1];
                    }
                    if (typeof value === "object") {
                        res.writeHead(status, { "Content-Type": "application/json" });
                        res.end(JSON.stringify(value));
                    }
                    else if (res.getHeader("Content-Type") === "text/html; charset=utf-8") {
                        res.end(value);
                    }
                    else {
                        res.writeHead(status, {
                            "Content-Length": Buffer.byteLength(value),
                            "Content-Type": "text/plain",
                        });
                        res.end(value);
                    }
                }
                function matchAndSend(route, req, res) {
                    if (res.headersSent)
                        return;
                    if ((0, Request_1.isMatching)(req.url, route.path) && req.method === route.method) {
                        let response = route.callback((0, Request_1.default)(req, route.path), (0, Response_1.default)(res));
                        if (response) {
                            sendResponse(response, res);
                        }
                    }
                    else {
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
        });
    }
}
exports.default = Meiyo;
