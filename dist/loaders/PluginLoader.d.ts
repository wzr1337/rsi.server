import { Service } from "@rsi/core";
import { RsiServer } from "../rsi.server";
export declare class PluginLoader {
    private server;
    constructor(server: RsiServer);
    loadPlugins(directory: string): Service[];
    loadPlugin(directory: string): Service[];
}
