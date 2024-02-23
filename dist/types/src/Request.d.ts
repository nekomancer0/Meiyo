/// <reference types="node" />
import { IncomingMessage } from "http";
import Meiyo from "./Meiyo";
export declare const isMatching: (url: string, route: string) => boolean;
export default function Request<P extends string>(req: IncomingMessage, route: P): Meiyo.Request<P>;
