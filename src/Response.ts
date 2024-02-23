import { ServerResponse } from "http";
import Meiyo from "./Meiyo";

export default function Response(res: ServerResponse): Meiyo.Response {
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
    status(code: number) {
      res.writeHead(code);
      return x;
    },
    header(name: string, value: string | number | readonly string[]) {
      res.setHeader(name, value);
      return x;
    },
  });

  return x;
}
