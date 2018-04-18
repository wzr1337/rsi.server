<a name="0.2.4"></a>
## [0.2.4](https://github.com/wzr1337/rsiServer/compare/0.2.3...v0.2.4) (2018-04-18)


### Features

* **general:** migrate to singleton sevrices ([3b6b8e0](https://github.com/wzr1337/rsiServer/commit/3b6b8e0))



<a name="0.2.3"></a>
## [0.2.3](https://github.com/wzr1337/rsiServer/compare/0.2.2...0.2.3) (2018-04-05)


### Features

* **cdb:** fix routing syntax for cdn ([4361fb4](https://github.com/wzr1337/rsiServer/commit/4361fb4))
* **cdn:** separate cdn into own repo ([bc7073e](https://github.com/wzr1337/rsiServer/commit/bc7073e))



<a name="0.2.2"></a>
## [0.2.2](https://github.com/wzr1337/rsiServer/compare/0.2.0...0.2.2) (2018-03-19)


### Bug Fixes

* **Websocket:** handle connection break ([d0cfe5d](https://github.com/wzr1337/rsiServer/commit/d0cfe5d))
* **wsError:** add general handler ([c2c51d9](https://github.com/wzr1337/rsiServer/commit/c2c51d9))



<a name="0.2.0"></a>
# [0.2.0](https://github.com/wzr1337/rsiServer/compare/0.0.4...0.2.0) (2018-03-01)


### Bug Fixes

* **cdn:** register under cdn instead of cdn2 ([bd0c311](https://github.com/wzr1337/rsiServer/commit/bd0c311))
* **cdn:** return actual success on registration ([c898d27](https://github.com/wzr1337/rsiServer/commit/c898d27))
* **CI:** fix env settings to always use AUDIODEV=null ([ed9d2a5](https://github.com/wzr1337/rsiServer/commit/ed9d2a5))
* **CI:** fix no-audio card error on TRAVIS-CI ([0d022a6](https://github.com/wzr1337/rsiServer/commit/0d022a6))
* **general:** fix error responses to be compliant ([0af3ebc](https://github.com/wzr1337/rsiServer/commit/0af3ebc))
* **general:** respond 501 on / POST and DELETE fixes #72 ([5a58747](https://github.com/wzr1337/rsiServer/commit/5a58747)), closes [#72](https://github.com/wzr1337/rsiServer/issues/72)
* **git submodules:** remove submodules for now, so server at least can pass build ([3187097](https://github.com/wzr1337/rsiServer/commit/3187097))
* **package:** fix build script ([462aa4a](https://github.com/wzr1337/rsiServer/commit/462aa4a))
* **package:** fix npm task ([a6e82e1](https://github.com/wzr1337/rsiServer/commit/a6e82e1))
* **package:** tsdoc is typedoc ([2da9ef6](https://github.com/wzr1337/rsiServer/commit/2da9ef6))
* **README:** fix url typo for cloning REPO ([255ed8c](https://github.com/wzr1337/rsiServer/commit/255ed8c))
* **submodules:** put submodules into different plugin folder to avoid git ignorance ([fb6de9d](https://github.com/wzr1337/rsiServer/commit/fb6de9d))
* **traverse:** fix expand level by making traverse method async ([322a9e1](https://github.com/wzr1337/rsiServer/commit/322a9e1))


### Features

* **$id:** add $id handler on root and service level ([05b5b7a](https://github.com/wzr1337/rsiServer/commit/05b5b7a))
* **cdn:** add general service /cdn/ ([c388d1b](https://github.com/wzr1337/rsiServer/commit/c388d1b))
* **Cdn:** add a Cdn service ([afeb46f](https://github.com/wzr1337/rsiServer/commit/afeb46f))
* **dist:** add distributables ([876487e](https://github.com/wzr1337/rsiServer/commit/876487e))
* **dist:** add sourcemaps ([da8581d](https://github.com/wzr1337/rsiServer/commit/da8581d))
* **general:** add $id handing ([6482e89](https://github.com/wzr1337/rsiServer/commit/6482e89))
* **index:** add general handlers ([9199e75](https://github.com/wzr1337/rsiServer/commit/9199e75))
* **pluginloader:** new plugin discovery through exported getPlugins() function (convention) ([b3fad26](https://github.com/wzr1337/rsiServer/commit/b3fad26))
* use new async resource methods ([19db1ed](https://github.com/wzr1337/rsiServer/commit/19db1ed))
* **tslint:** add tslint and init configuration ([98bf166](https://github.com/wzr1337/rsiServer/commit/98bf166))



<a name="0.0.4"></a>
## [0.0.4](https://github.com/wzr1337/rsiServer/compare/0.0.3...0.0.4) (2017-07-24)


### Bug Fixes

* **build:** fix error message in typescript compile by getting rid of typescript for stupid-player ([8023843](https://github.com/wzr1337/rsiServer/commit/8023843))
* **ci:** add c++11 compiler ([d04e60e](https://github.com/wzr1337/rsiServer/commit/d04e60e))
* **ci:** add python and node-gyp install ([3a6800c](https://github.com/wzr1337/rsiServer/commit/3a6800c))
* **ci:** alsa stuff added ([89cc117](https://github.com/wzr1337/rsiServer/commit/89cc117))
* **ci:** sudo symbolic linking ([c421ff3](https://github.com/wzr1337/rsiServer/commit/c421ff3))
* **cors:** answer if origin is undefined (cars disabled in this case) ([747fc2f](https://github.com/wzr1337/rsiServer/commit/747fc2f))
* fix the POST element response to reflect actual outcome of operation ([192a5a1](https://github.com/wzr1337/rsiServer/commit/192a5a1))
* **main:** fix server crashing on subscribe/unsubscribe or POST on non-existent elements (#32) ([9b3c337](https://github.com/wzr1337/rsiServer/commit/9b3c337)), closes [#32](https://github.com/wzr1337/rsiServer/issues/32)
* **media:** add missing break statement ([fb8429c](https://github.com/wzr1337/rsiServer/commit/fb8429c))
* **media:** fix media render stupidplayer not available on update ([9ada883](https://github.com/wzr1337/rsiServer/commit/9ada883))
* **media:** player reference issue resloved ([b28c864](https://github.com/wzr1337/rsiServer/commit/b28c864))
* **package:** add missing dependencies to query-string ([d2d2bea](https://github.com/wzr1337/rsiServer/commit/d2d2bea))
* **package:** add stupid player deps ([6a3cbec](https://github.com/wzr1337/rsiServer/commit/6a3cbec))
* **tests:** a list query to media depends on a submodule and is thus not correct here ([3ac1c63](https://github.com/wzr1337/rsiServer/commit/3ac1c63))
* **typings:** bump [@types](https://github.com/types)/request to version to ^0.0.45 ([4538530](https://github.com/wzr1337/rsiServer/commit/4538530))


### Features

* **cdn:** add cdn service to acces images ([05c679b](https://github.com/wzr1337/rsiServer/commit/05c679b))
* **general:** getResource now returns a CollectionResponse ([5425423](https://github.com/wzr1337/rsiServer/commit/5425423))
* **media:** add a second renderer in preparation for actual playback ([d18d2ac](https://github.com/wzr1337/rsiServer/commit/d18d2ac))
* **media:** add queue to stupidplayer ([691f855](https://github.com/wzr1337/rsiServer/commit/691f855))
* **media:** add shuffle and repeat simulation ([8d552fa](https://github.com/wzr1337/rsiServer/commit/8d552fa))
* **media:** initial audio player integration ([04721b0](https://github.com/wzr1337/rsiServer/commit/04721b0))
* **media:** tracks can be added and deleted from a media.collection ([b5aed24](https://github.com/wzr1337/rsiServer/commit/b5aed24))
* **medialibrary:** add initial version of medialibrary plugin ([9b6d6bc](https://github.com/wzr1337/rsiServer/commit/9b6d6bc))
* **medialibrary:** allow adding items with collection creation ([688e5f2](https://github.com/wzr1337/rsiServer/commit/688e5f2))
* **mocks:** add more mock data ([f422e7d](https://github.com/wzr1337/rsiServer/commit/f422e7d))
* **server:** unsubscribe and delete subscriptions for a given websocket on client disconnect ([03cf3a6](https://github.com/wzr1337/rsiServer/commit/03cf3a6))
* added $sorting, object ref search, freesearch $q and field filtering ([5eaa1a1](https://github.com/wzr1337/rsiServer/commit/5eaa1a1))
* added function getElementById to globally retrieve elements across all services and resources ([e55633b](https://github.com/wzr1337/rsiServer/commit/e55633b))
* added function to traverse an element and resolve it`s object references ([213cc4d](https://github.com/wzr1337/rsiServer/commit/213cc4d))
* support for $expand param in resourceGET, elementGET and subscription responses ([5e90b58](https://github.com/wzr1337/rsiServer/commit/5e90b58))
* updateElement returns an Elementresponse ([6e12452](https://github.com/wzr1337/rsiServer/commit/6e12452))
* **submodules:** configure travis to pull in the submodules ([10fb5f8](https://github.com/wzr1337/rsiServer/commit/10fb5f8))
* **travis:** add travis status ([bfe2163](https://github.com/wzr1337/rsiServer/commit/bfe2163))
* **viwiPlugin:** separate ElementResponse and ListResponse for better readability and coding convinience ([c3f4059](https://github.com/wzr1337/rsiServer/commit/c3f4059))



<a name="0.0.3"></a>
## [0.0.3](https://github.com/wzr1337/rsiServer/compare/0.0.2...0.0.3) (2017-03-17)


### Bug Fixes

* **main:** port respect ([8bf14ce](https://github.com/wzr1337/rsiServer/commit/8bf14ce))
* **package:** add missing dependencies ([12c296b](https://github.com/wzr1337/rsiServer/commit/12c296b))
* **test:** use the new options object to spin up a server (no port collision with a running server) ([76fc722](https://github.com/wzr1337/rsiServer/commit/76fc722))
* send initial data message on new subscription to resources ([52c2c5b](https://github.com/wzr1337/rsiServer/commit/52c2c5b))


### Features

* **cli:** move cli stuff to cli ([3c60840](https://github.com/wzr1337/rsiServer/commit/3c60840))
* **docker:** add a Dockerfile and nam build task ([1324214](https://github.com/wzr1337/rsiServer/commit/1324214))
* **general:** options can be given with the run() command ([0928644](https://github.com/wzr1337/rsiServer/commit/0928644))
* **helpers:** move reusable code to helpers ([dbd9644](https://github.com/wzr1337/rsiServer/commit/dbd9644))
* **port:** port argument used ([5b418c1](https://github.com/wzr1337/rsiServer/commit/5b418c1))
* **server:** return Location header on creation of new elements ([a18800c](https://github.com/wzr1337/rsiServer/commit/a18800c))
* **types:** add xObject ([da57537](https://github.com/wzr1337/rsiServer/commit/da57537))
* **viwiWebSocket:** report event name on errors on the WebSocket channel ([6421064](https://github.com/wzr1337/rsiServer/commit/6421064))



<a name="0.0.2"></a>
## [0.0.2](https://github.com/wzr1337/rsiServer/compare/1ede568...0.0.2) (2017-03-04)


### Bug Fixes

* **main:** compare lowercase names for subscription ([da3e9f7](https://github.com/wzr1337/rsiServer/commit/da3e9f7))
* **main:** fix signature of serviceGET, doe snot need resource ([09d2140](https://github.com/wzr1337/rsiServer/commit/09d2140))
* **main:** fixes toString() of undefined bug for numeric check ([bb17c6c](https://github.com/wzr1337/rsiServer/commit/bb17c6c))
* **main:** unsubscribe working now ([6828af8](https://github.com/wzr1337/rsiServer/commit/6828af8))
* **subscriptions:** clients can unsubscribe separately ([8403354](https://github.com/wzr1337/rsiServer/commit/8403354))
* **websocket:** handle unssubscriptions and websocket breakdowns ([ae35000](https://github.com/wzr1337/rsiServer/commit/ae35000))


### Features

* **$fields:** add support for $fields on GET element queries ([6987ec2](https://github.com/wzr1337/rsiServer/commit/6987ec2))
* **buildchain:** add clean task ([54d6214](https://github.com/wzr1337/rsiServer/commit/54d6214))
* **compression:** add compression ([fd27962](https://github.com/wzr1337/rsiServer/commit/fd27962))
* **cors:** add cors relsoves #6 ([ea5208a](https://github.com/wzr1337/rsiServer/commit/ea5208a))
* **gulp:** add build task ([fee97d8](https://github.com/wzr1337/rsiServer/commit/fee97d8))
* **index:** add service listing, require service id ([4710047](https://github.com/wzr1337/rsiServer/commit/4710047))
* **logging:** add winston logger ([f4f9b43](https://github.com/wzr1337/rsiServer/commit/f4f9b43))
* **logginig:** unify query logging ([0ebf137](https://github.com/wzr1337/rsiServer/commit/0ebf137))
* **main:** add basic subscription capabilities ([1ede568](https://github.com/wzr1337/rsiServer/commit/1ede568))
* **main:** add unscubscribe feature on a per-event basis ([86ffc63](https://github.com/wzr1337/rsiServer/commit/86ffc63))
* **main:** respond with message on 500 error ([0042009](https://github.com/wzr1337/rsiServer/commit/0042009))
* add resource POSt for colletctions ([79e491d](https://github.com/wzr1337/rsiServer/commit/79e491d))
* prepare for easier subscription handling for updatelimit and changedetection ([96ccf9c](https://github.com/wzr1337/rsiServer/commit/96ccf9c))
* **plugin:** prepare subscriptions on resource level ([d3b51c4](https://github.com/wzr1337/rsiServer/commit/d3b51c4))
* **plugins:** add initial plugin loader mechanism ([923b554](https://github.com/wzr1337/rsiServer/commit/923b554))
* **plugins:** moved all REST calls into plugin, Subscriptions to follow ([7968d88](https://github.com/wzr1337/rsiServer/commit/7968d88))
* **resource subscriptions:** add resource subscription (no filters or paging yet) ([350cfa8](https://github.com/wzr1337/rsiServer/commit/350cfa8))
* **test:** add initial tests ([cc39fc3](https://github.com/wzr1337/rsiServer/commit/cc39fc3))



