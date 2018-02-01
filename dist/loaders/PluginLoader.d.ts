import { RsiServer } from '../rsi.server';
import { SchemaPlugin } from '@rsi/core';
export declare class PluginLoader {
    private server;
    constructor(server: RsiServer);
    loadPlugins(directory: string): Array<SchemaPlugin>;
    loadPlugin(directory: string): SchemaPlugin;
}
