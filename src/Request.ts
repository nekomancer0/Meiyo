import { IncomingMessage } from "http";
import { URL } from "url";
import { RouteParameters } from "./Routes";
import Meiyo from "./Meiyo";

export const isMatching = (url: string, route: string) => {
  const urlSplit = url.split("/");
  const routeSplit = route.split("/");

  for (let index = 0; index < routeSplit.length; index++) {
    if (routeSplit[index][0] === ":") {
      // thats a value
    } else {
      if (routeSplit[index] !== urlSplit[index]) {
        return false;
      }
    }
  }
  return true;
};

function getParams<P extends string>(url: string, path: P): RouteParameters<P> {
  let routeSplit = path.split("/");
  let urlSplit = url.split("/");
  let params: any = {};

  for (let index = 0; index < routeSplit.length; index++) {
    if (routeSplit[index][0] === ":") {
      params[`${routeSplit[index]}`.replace(":", "")] = urlSplit[index];
    }
  }

  return params;
}

export default function Request<P extends string>(
  req: IncomingMessage,
  route: P
): Meiyo.Request<P> {
  let parsedUrl = new URL(req.url!, `http://${req.headers.host}`);
  return Object.assign(req, {
    route,
    path: parsedUrl.pathname,
    params: getParams(req.url!, route),
    cookies: {},
    parsedUrl,
    header(name: string) {
      return req.headers[name];
    },
  });
}
