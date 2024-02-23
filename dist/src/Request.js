"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isMatching = void 0;
const url_1 = require("url");
const isMatching = (url, route) => {
    const urlSplit = url.split("/");
    const routeSplit = route.split("/");
    for (let index = 0; index < routeSplit.length; index++) {
        if (routeSplit[index][0] === ":") {
            // thats a value
        }
        else {
            if (routeSplit[index] !== urlSplit[index]) {
                return false;
            }
        }
    }
    return true;
};
exports.isMatching = isMatching;
function getParams(url, path) {
    let routeSplit = path.split("/");
    let urlSplit = url.split("/");
    let params = {};
    for (let index = 0; index < routeSplit.length; index++) {
        if (routeSplit[index][0] === ":") {
            params[`${routeSplit[index]}`.replace(":", "")] = urlSplit[index];
        }
    }
    return params;
}
function Request(req, route) {
    let parsedUrl = new url_1.URL(req.url, `http://${req.headers.host}`);
    return Object.assign(req, {
        route,
        path: parsedUrl.pathname,
        params: getParams(req.url, route),
        cookies: {},
        parsedUrl,
        header(name) {
            return req.headers[name];
        },
    });
}
exports.default = Request;
