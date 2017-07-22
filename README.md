[![Join the chat at https://gitter.im/rsiServer/rsiServer](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/rsiServer/rsiServer)

# RSI Server

This project implements the Volkswagen Infotainment Web Interface as published under [https://www.w3.org/Submission/2016/01/](https://www.w3.org/Submission/2016/01/).

## Clone the repo
This sofwtare uses git submodules, so please clone recursively via

```
$ git clone https://github.com/wz1337/rsiServer.git --recursive
```


## Prerequisites

This project uses Gulp and TypeScript which needs to be available globally, so please make them available via

```sh
$ npm install gulp typescript -g
```

### Install local dependencies
To install the server's dependencies, run the following command

```sh
$ npm install
```

#### known issues

If you are developing on Windows or Linux, you might experience issue when using above command, because the lame dependency has to compile per platform.

**Linux**
On some Linux (e.g. Ubuntu 16.04) distros the libasound2 libs are missing, so please install it via
```
$ sudo apt-get install libasound2-dev
```

**Windows**
On Windows you will need a visual studio installation to have a working compiler at hand.

## Build it

To build the server, use

```sh
$ gulp build
```

## Test it

To run the server and test it, use

```sh
$ http_proxy='' gulp test
```

Please ensure that proxy settings are set appropriately for your environment.
Test specifications will always follow the `+.spec`form, i.e. source file named `myfile.ts` => test file named `myfile.spec.ts`.


## Develop it

To run a watch on the source file and trigger an automatic reload on file changes, use

```sh
$ gulp watch
```

# Run it

To run the server separately, use the cli

```
  $ node ./bin/cli.js -p 9999 -v 'error'
```

alternatively you can use

```
  $ npm start
```

after you `gulp build` it

### Available command line arguments

| long parameter | short parameter | type   | description                                    |
|----------------|-----------------|--------|------------------------------------------------|
| --port         | -p              | number | the port number to listen on                   |
| --verbosity    | -v              | string | the winston log level to plot into the console |

## Plugins
The server uses so called plugins to provide service logic and its interfaces. The plugins can be found as `rsp.*` repositories on https://github.com.

Known and officially supported plugins as of today are:

| service      | repositry url                                   |
|--------------|-------------------------------------------------|
| media        | https://github.com/wzr1337/rsp.media.git        |
| medialibrary | https://github.com/wzr1337/rsp.medialibrary.git |

### Install plugins
To install a plugin, you need to clone the corresponding repository into the `src/plugins` folder. Further down the road, there might an installer, so far plugins a handled as git submodules.


## Examples

### Client side subscription

To subscribe to the netfux media renderer from within a JavaScript application or the JavaScript console, use the following code snippet

```js
ws = new WebSocket("ws://localhost:3000");
ws.onopen = () => {
  ws.onmessage = (data) => {console.log(data)}
  ws.send(JSON.stringify({type:"subscribe", event:"/media/renderers/d6ebfd90-d2c1-11e6-9376-df943f51f0d8"}))
}
```


## Contribution
I welcome everyone to contribute to this repo. Let us build awesome software - together. In order to streamline contribution to this repo, some guidelines are described below.

Please refer to [CONTRIBUTION.md](CONTRIBUTION.md)


## License (MIT)

Copyright (c) 2017 Dr. Patrick Bartsch

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
