<a name="0.0.4"></a>
## [0.0.4](https://github.com/wtr1337/rsiserver/compare/0.0.3...v0.0.4) (2017-07-24)


### Bug Fixes

* **build:** fix error message in typescript compile by getting rid of typescript for stupid-player ([8023843](https://github.com/wtr1337/rsiserver/commit/8023843))
* **ci:** add c++11 compiler ([d04e60e](https://github.com/wtr1337/rsiserver/commit/d04e60e))
* **ci:** add python and node-gyp install ([3a6800c](https://github.com/wtr1337/rsiserver/commit/3a6800c))
* **ci:** alsa stuff added ([89cc117](https://github.com/wtr1337/rsiserver/commit/89cc117))
* **ci:** sudo symbolic linking ([c421ff3](https://github.com/wtr1337/rsiserver/commit/c421ff3))
* **cors:** answer if origin is undefined (cars disabled in this case) ([747fc2f](https://github.com/wtr1337/rsiserver/commit/747fc2f))
* fix the POST element response to reflect actual outcome of operation ([192a5a1](https://github.com/wtr1337/rsiserver/commit/192a5a1))
* **main:** fix server crashing on subscribe/unsubscribe or POST on non-existent elements (#32) ([9b3c337](https://github.com/wtr1337/rsiserver/commit/9b3c337)), closes [#32](https://github.com/wtr1337/rsiserver/issues/32)
* **media:** add missing break statement ([fb8429c](https://github.com/wtr1337/rsiserver/commit/fb8429c))
* **media:** fix media render stupidplayer not available on update ([9ada883](https://github.com/wtr1337/rsiserver/commit/9ada883))
* **media:** player reference issue resloved ([b28c864](https://github.com/wtr1337/rsiserver/commit/b28c864))
* **package:** add missing dependencies to query-string ([d2d2bea](https://github.com/wtr1337/rsiserver/commit/d2d2bea))
* **package:** add stupid player deps ([6a3cbec](https://github.com/wtr1337/rsiserver/commit/6a3cbec))
* **tests:** a list query to media depends on a submodule and is thus not correct here ([3ac1c63](https://github.com/wtr1337/rsiserver/commit/3ac1c63))
* **typings:** bump [@types](https://github.com/types)/request to version to ^0.0.45 ([4538530](https://github.com/wtr1337/rsiserver/commit/4538530))


### Features

* **cdn:** add cdn service to acces images ([05c679b](https://github.com/wtr1337/rsiserver/commit/05c679b))
* **general:** getResource now returns a CollectionResponse ([5425423](https://github.com/wtr1337/rsiserver/commit/5425423))
* **media:** add a second renderer in preparation for actual playback ([d18d2ac](https://github.com/wtr1337/rsiserver/commit/d18d2ac))
* **media:** add queue to stupidplayer ([691f855](https://github.com/wtr1337/rsiserver/commit/691f855))
* **media:** add shuffle and repeat simulation ([8d552fa](https://github.com/wtr1337/rsiserver/commit/8d552fa))
* **media:** initial audio player integration ([04721b0](https://github.com/wtr1337/rsiserver/commit/04721b0))
* **media:** tracks can be added and deleted from a media.collection ([b5aed24](https://github.com/wtr1337/rsiserver/commit/b5aed24))
* **medialibrary:** add initial version of medialibrary plugin ([9b6d6bc](https://github.com/wtr1337/rsiserver/commit/9b6d6bc))
* **medialibrary:** allow adding items with collection creation ([688e5f2](https://github.com/wtr1337/rsiserver/commit/688e5f2))
* **mocks:** add more mock data ([f422e7d](https://github.com/wtr1337/rsiserver/commit/f422e7d))
* **server:** unsubscribe and delete subscriptions for a given websocket on client disconnect ([03cf3a6](https://github.com/wtr1337/rsiserver/commit/03cf3a6))
* **submodules:** configure travis to pull in the submodules ([10fb5f8](https://github.com/wtr1337/rsiserver/commit/10fb5f8))
* **viwiPlugin:** separate ElementResponse and ListResponse for better readability and coding convinience ([c3f4059](https://github.com/wtr1337/rsiserver/commit/c3f4059))
* added $sorting, object ref search, freesearch $q and field filtering ([5eaa1a1](https://github.com/wtr1337/rsiserver/commit/5eaa1a1))
* added function getElementById to globally retrieve elements across all services and resources ([e55633b](https://github.com/wtr1337/rsiserver/commit/e55633b))
* added function to traverse an element and resolve it`s object references ([213cc4d](https://github.com/wtr1337/rsiserver/commit/213cc4d))
* support for $expand param in resourceGET, elementGET and subscription responses ([5e90b58](https://github.com/wtr1337/rsiserver/commit/5e90b58))
* updateElement returns an Elementresponse ([6e12452](https://github.com/wtr1337/rsiserver/commit/6e12452))



<a name="0.0.3"></a>
## [0.0.3](https://github.com/wtr1337/rsiserver/compare/0.0.2...0.0.3) (2017-03-17)


### Bug Fixes

* **main:** port respect ([8bf14ce](https://github.com/wtr1337/rsiserver/commit/8bf14ce))
* **package:** add missing dependencies ([12c296b](https://github.com/wtr1337/rsiserver/commit/12c296b))
* **test:** use the new options object to spin up a server (no port collision with a running server) ([76fc722](https://github.com/wtr1337/rsiserver/commit/76fc722))
* send initial data message on new subscription to resources ([52c2c5b](https://github.com/wtr1337/rsiserver/commit/52c2c5b))


### Features

* **cli:** move cli stuff to cli ([3c60840](https://github.com/wtr1337/rsiserver/commit/3c60840))
* **docker:** add a Dockerfile and nam build task ([1324214](https://github.com/wtr1337/rsiserver/commit/1324214))
* **general:** options can be given with the run() command ([0928644](https://github.com/wtr1337/rsiserver/commit/0928644))
* **helpers:** move reusable code to helpers ([dbd9644](https://github.com/wtr1337/rsiserver/commit/dbd9644))
* **port:** port argument used ([5b418c1](https://github.com/wtr1337/rsiserver/commit/5b418c1))
* **server:** return Location header on creation of new elements ([a18800c](https://github.com/wtr1337/rsiserver/commit/a18800c))
* **types:** add xObject ([da57537](https://github.com/wtr1337/rsiserver/commit/da57537))
* **viwiWebSocket:** report event name on errors on the WebSocket channel ([6421064](https://github.com/wtr1337/rsiserver/commit/6421064))



<a name="0.0.2"></a>
## [0.0.2](https://github.com/wtr1337/rsiserver/compare/1ede568...0.0.2) (2017-03-04)


### Bug Fixes

* **main:** compare lowercase names for subscription ([da3e9f7](https://github.com/wtr1337/rsiserver/commit/da3e9f7))
* **main:** fix signature of serviceGET, doe snot need resource ([09d2140](https://github.com/wtr1337/rsiserver/commit/09d2140))
* **main:** fixes toString() of undefined bug for numeric check ([bb17c6c](https://github.com/wtr1337/rsiserver/commit/bb17c6c))
* **main:** unsubscribe working now ([6828af8](https://github.com/wtr1337/rsiserver/commit/6828af8))
* **subscriptions:** clients can unsubscribe separately ([8403354](https://github.com/wtr1337/rsiserver/commit/8403354))
* **websocket:** handle unssubscriptions and websocket breakdowns ([ae35000](https://github.com/wtr1337/rsiserver/commit/ae35000))


### Features

* **$fields:** add support for $fields on GET element queries ([6987ec2](https://github.com/wtr1337/rsiserver/commit/6987ec2))
* **buildchain:** add clean task ([54d6214](https://github.com/wtr1337/rsiserver/commit/54d6214))
* **compression:** add compression ([fd27962](https://github.com/wtr1337/rsiserver/commit/fd27962))
* **cors:** add cors relsoves #6 ([ea5208a](https://github.com/wtr1337/rsiserver/commit/ea5208a))
* **gulp:** add build task ([fee97d8](https://github.com/wtr1337/rsiserver/commit/fee97d8))
* **index:** add service listing, require service id ([4710047](https://github.com/wtr1337/rsiserver/commit/4710047))
* **logging:** add winston logger ([f4f9b43](https://github.com/wtr1337/rsiserver/commit/f4f9b43))
* **logginig:** unify query logging ([0ebf137](https://github.com/wtr1337/rsiserver/commit/0ebf137))
* **main:** add basic subscription capabilities ([1ede568](https://github.com/wtr1337/rsiserver/commit/1ede568))
* **main:** add unscubscribe feature on a per-event basis ([86ffc63](https://github.com/wtr1337/rsiserver/commit/86ffc63))
* **main:** respond with message on 500 error ([0042009](https://github.com/wtr1337/rsiserver/commit/0042009))
* add resource POSt for colletctions ([79e491d](https://github.com/wtr1337/rsiserver/commit/79e491d))
* prepare for easier subscription handling for updatelimit and changedetection ([96ccf9c](https://github.com/wtr1337/rsiserver/commit/96ccf9c))
* **plugin:** prepare subscriptions on resource level ([d3b51c4](https://github.com/wtr1337/rsiserver/commit/d3b51c4))
* **plugins:** add initial plugin loader mechanism ([923b554](https://github.com/wtr1337/rsiserver/commit/923b554))
* **plugins:** moved all REST calls into plugin, Subscriptions to follow ([7968d88](https://github.com/wtr1337/rsiserver/commit/7968d88))
* **resource subscriptions:** add resource subscription (no filters or paging yet) ([350cfa8](https://github.com/wtr1337/rsiserver/commit/350cfa8))
* **test:** add initial tests ([cc39fc3](https://github.com/wtr1337/rsiserver/commit/cc39fc3))



