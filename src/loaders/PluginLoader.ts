import { join } from 'path';
import { lstatSync, readdirSync } from 'fs';
import { RsiServer } from '../rsi.server';
import { SchemaPlugin, Service } from '@rsi/core';

export class PluginLoader {


    constructor(private server: RsiServer) {

    }


    public loadPlugins(directory: string): Array<Service> {
        const files = readdirSync(directory);
        let services: Array<Service> = [];
        files.forEach(file => {
            const plugin = join(directory, file);
            services = [...services, ...this.loadPlugin(plugin)];
        });
        return services;
    }

    public loadPlugin(directory: string): Array<Service> {
        let service: SchemaPlugin;
        const services: Array<Service> = [];
        if (lstatSync(directory).isDirectory()) {
            const _plugin = require(directory);
            if (_plugin.hasOwnProperty('getPlugins')) {
                _plugin.getPlugins().forEach((serviceClass) => {
                    service = new serviceClass();
                    service.pluginDir = directory;
                    if (service.init) {
                        service.init();
                    }
                    this.server.addService(service);
                    services.push(service);
                });
            }
        }
        return services;
    }


}