import { SchemaPlugin, Service } from "@rsi/core";
import { lstatSync, readdirSync } from "fs";
import { join } from "path";
import { RsiServer } from "../rsi.server";

export class PluginLoader {

  constructor(private server: RsiServer) {

  }

  public loadPlugins(directory: string): Service[] {
    const files = readdirSync(directory);
    let services: Service[] = [];
    files.forEach((file) => {
      const plugin = join(directory, file);
      services = [...services, ...this.loadPlugin(plugin)];
    });
    return services;
  }

  public loadPlugin(directory: string): Service[] {
    let service: SchemaPlugin;
    const services: Service[] = [];
    if (lstatSync(directory).isDirectory()) {
      const plugin = require(directory);
      if (plugin.hasOwnProperty("getPlugins")) {
        plugin.getPlugins().forEach((serviceClass) => {
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
