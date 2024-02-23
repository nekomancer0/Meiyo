"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function Response(res) {
    let x = Object.assign(res, {
        html() {
            res.setHeader("Content-Type", "text/html; charset=utf-8");
            return x;
        },
        text() {
            res.setHeader("Content-Type", "text/plain; charser=utf-8");
            return x;
        },
        json() {
            res.setHeader("Content-Type", "application/json; charset=utf-8");
            return x;
        },
        status(code) {
            res.writeHead(code);
            return x;
        },
        header(name, value) {
            res.setHeader(name, value);
            return x;
        },
    });
    return x;
}
exports.default = Response;
