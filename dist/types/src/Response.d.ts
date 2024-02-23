/// <reference types="node" />
import { ServerResponse } from "http";
import Meiyo from "./Meiyo";
export default function Response(res: ServerResponse): Meiyo.Response;
