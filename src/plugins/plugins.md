# Plugins

## General architecture
The server accepts plugins in the `plugins` folder. The so called plugin loader will scan the `plugins`folder for subfolders and try to include the `index.ts` file. 

![plugin architecture](https://raw.githubusercontent.com/wzr1337/viwiServer/develop/src/plugins/viwiServer_architecture.svg "Plugin Architecture 1")
