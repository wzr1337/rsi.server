import { join } from 'path';
import { lstatSync, readdirSync } from 'fs';
import { RsiServer } from '../rsi.server';
import { SchemaPlugin } from '@rsi/core';

export class PluginLoader {


    constructor(private server: RsiServer) {

    }


    public loadPlugins(directory: string): Array<SchemaPlugin> {
        const files = readdirSync(directory);
        const services = files.map(file => {
            const plugin = join(directory, file);
            return this.loadPlugin(plugin);
        });
        return services;
    }

    public loadPlugin(directory: string): SchemaPlugin {
        let service: SchemaPlugin;
        if (lstatSync(directory).isDirectory()) {
            const _plugin = require(directory);
            service = new _plugin.Service();
            service.pluginDir = directory;
            if (service.init) {
                service.init();
            }
            this.server.addService(service);
        }
        return service;
    }


}