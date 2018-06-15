import { join, resolve } from "path";
export { RsiServer } from "./rsi.server";
export { WsHandler } from "./web.socket.handler";
export { PluginLoader } from "./loaders/PluginLoader";
export { ServiceRegistry } from "./service.registry";
export { IRunOptions } from "./types";

export const pluginpath: string = resolve(join(__dirname, "plugins"));
