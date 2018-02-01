import { RsiServer } from '../rsi.server';
import { Service } from '@rsi/core';
export declare class PluginLoader {
    private server;
    constructor(server: RsiServer);
    loadPlugins(directory: string): Array<Service>;
    loadPlugin(directory: string): Array<Service>;
}
