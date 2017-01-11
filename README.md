# Viwi Server

This project implements the Volkswagen Infotainment Web Interface as published under [https://www.w3.org/Submission/2016/01/](https://www.w3.org/Submission/2016/01/).


### Prerequisits

This project uses Gulp and typescript which needs to be available globally, so please make them available via

```
  $ npm install gulp typescript -g
```

To install the servers dependencies run the following command

```
  $ npm install
```


## Run it

To run the server use.

```
  $ gulp build
```

## Examples

### Client side subscription

To subscribe to the netfux media renderer from within a javascipt application or the javascript console use the following code snippet

```
ws = new WebSocket("ws://localhost:3000");
ws.onopen = () => {
  ws.onmessage = (data) => {console.log(data)}
  ws.send(JSON.stringify({type:"subscribe", event:"/media/renderers/d6ebfd90-d2c1-11e6-9376-df943f51f0d8"}))
}
```

## License (MIT)

Copyright (c) 2017 Dr. Patrick Bartsch

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
