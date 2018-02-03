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
I welcome everyone to contribute to this repo. Let us build awesome software - together. In order to streamline contribution to this repo, some guidelines are described below.

### Tests
In order to maintain a maximum of software quality, **tests** are needed. Whenever you contribute, please make sure that appropriate tests are in place. Also contributing tests only is highly valuable for the project.

### Git Commit Guidelines

These rules are adopted from [the AngularJS commit conventions](https://docs.google.com/document/d/1QrDFcIiPjSLDn3EL15IJygNPiHORgU1_OOAqWjiDU5Y/).

#### Commit Message Format

Each commit message starts with a **type**, a **scope**, and a **subject**.

Below that, the commit message has a **body**.

- **type**: what type of change this commit contains.
- **scope**: what item of code this commit is changing.
- **subject**: a short description of the changes.
- **body** (optional): a more in-depth description of the changes

```
<type>(<scope>): <subject>
<BLANK LINE>
<body>
```

Examples:
```none
feat(ruler): add inches as well as centimeters
```

```none
fix(protractor): fix 90 degrees counting as 91 degrees
```

```none
refactor(pencil): use graphite instead of lead

Closes #640.

Graphite is a much more available resource than lead, so we use it to lower the price.
```

```none
fix(pen): use blue ink instead of red ink

BREAKING CHANGE: Pen now uses blue ink instead of red.

To migrate, change your code from the following:

`pen.draw('blue')`

To:

`pen.draw('red')`
```

Any line of the commit message should not be longer 100 characters. This allows the message to be easier
to read on github as well as in various git tools.

#### Type
Is recommended to be one of the below items. Only **feat** and **fix** show up in the changelog, in addition to breaking changes (see breaking changes section at bottom).

* **feat**: A new feature
* **fix**: A bug fix
* **docs**: Documentation only changes
* **style**: Changes that do not affect the meaning of the code (white-space, formatting, missing
  semi-colons, etc)
* **refactor**: A code change that neither fixes a bug or adds a feature
* **test**: Adding missing tests
* **chore**: Changes to the build process or auxiliary tools and libraries such as documentation
  generation

#### Scope
The scope could be anything specifying place of the commit change. Usually, the affected resource is named here.

#### Subject
The subject contains succinct description of the change:

* use the imperative, present tense: "change" not "changed" nor "changes"
* don't capitalize first letter
* no dot (.) at the end

#### Breaking Changes
Put **any breaking changes** with migration instructions in the commit body.

If there is a breaking change, put **BREAKING CHANGE:** in your commit body, and it will show up in the changelog.



## License (MIT)

Copyright (c) 2018 Dr. Patrick Bartsch

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
