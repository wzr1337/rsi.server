# RSI server module

This project implements the Volkswagen Infotainment Web Interface (viwi/RSI) as published under [https://www.w3.org/Submission/2016/01/](https://www.w3.org/Submission/2016/01/). The module provides a server which works with plugins like:

* [@RSI-plugins/medialibrary](https://github.com/wzr1337/rsi-plugins.medialibrary)


## Development
Anyone is invited to join our forces and help implement, test or document the software provided inhere.

### Install local dependencies
To install the server's dependencies, run the following command

```sh
$ npm install
```

### Build it
To build the server, use

```sh
$ npm run build
```

## Examples

### Using the module
While there is a [RSI Demo](https://github.com/wzr1337/rsi.demo) available, a minimal working example would be:

```typescript
import { RsiServer } from '@rsi/server';
import * as ml from '@rsi-plugins/medialibrary';

const server: RsiServer = new RsiServer();
server.run(); // run the server
server.addService(new ml.Service()); // add a single service
```

accessing `http://127.0.0.1:3000` will give you the following response:

```JSON
{
  "status": "ok",
  "data": [
    {
      "id": "ea65d5eb-d5fb-4ceb-a568-ed24fcf37e20",
      "name": "medialibrary",
      "uri": "/medialibrary/"
    }
  ]
}
```

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
I welcome everyone to contribute to this repo. Let us build awesome software - together. Please see [Contribution](CONTRIBUTION.md) for some rules to follow.

## License (MIT)

Copyright (c) 2018 Dr. Patrick Bartsch

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
