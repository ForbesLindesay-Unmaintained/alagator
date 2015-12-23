# alagator

Write algorithms that can be re-used for synchronous and asynchronous code using promises and `yield`

[![Build Status](https://img.shields.io/travis/ForbesLindesay/alagator/master.svg)](https://travis-ci.org/ForbesLindesay/alagator)
[![Dependency Status](https://img.shields.io/david/ForbesLindesay/alagator.svg)](https://david-dm.org/ForbesLindesay/alagator)
[![NPM version](https://img.shields.io/npm/v/alagator.svg)](https://www.npmjs.com/package/alagator)

## Installation

    npm install alagator

## Example

A fully backwards compatible version of [@substack](https://github.com/substack)'s [mkdirp](https://github.com/substack/node-mkdirp/blob/master/index.js) but without writing the algorithm out twice:

```js
var path = require('path')
var fs = require('fs')

var Promise = require('promise')
var alagator = require('alagator')

module.exports = mkdirpFactory(true, Promise.denodeify(fs.mkdir), Promise.denodeify(fs.stat))
module.exports.sync = mkdirpFactory(false, fs.mkdirSync, fs.statSync)

module.exports.mkdirp = module.exports.mkdirP = module.exports

function mkdirpFactory(async, mkdir, stat) {
  var rec = alagator(function *(p, mode, made) {
    if (mode === undefined) {
      mode = 0777 & (~process.umask());
    }
    if (!made) made = null;

    if (typeof mode === 'string') mode = parseInt(mode, 8);
    p = path.resolve(p);

    try {
      yield mkdir(p, mode);
      made = made || p;
    }
    catch (err0) {
      switch (err0.code) {
        case 'ENOENT' :
          made = yield rec(path.dirname(p), mode, made);
          yield rec(p, mode, made);
          break;

        // In the case of any other error, just see if there's a dir
        // there already.  If so, then hooray!  If not, then something
        // is borked.
        default:
          var stat;
          try {
              stat = yield stat(p);
          }
          catch (err1) {
              throw err0;
          }
          if (!stat.isDirectory()) throw err0;
          break;
      }
    }

    return made;
  }, async)
  return rec
}
```

## API

### alagator(generatorFunction, isAsync)

isAsync defaults to `true`.

The `alagator` method takes a generator function, and then either `true` (for async) or `false` (for sync).  If `false` is passed, it makes `yield` act as a pass through, so the method runs fully synchronously.  If `true` is passed, it makes `yield` await the resolution of a promise (or array of promises) so that the function becomes async (it also uses `Promise.nodeify` to support both callback and promise based use).  The above mkdirp example could be used in any of the following 3 ways:

```js
var mkdirp = require('mkdirp')

mkdirp('/foo/bar', function(err) {
  if (err) throw err
  console.log('/foo/bar exists')
})

//or

mkdirp('/foo/bar')
  .then(function() {
    console.log('/foo/bar exists')
  })
  .done()

//or

mkdirp.sync('/foo/bar')
console.log('/foo/bar exists')
```

### spawn(generatorFunction, isAsync)

Exactly as above, except the function is immediately called with no arguments.


### use with other promise libraries

If you want the promise returned from async versions of your algorithms to be of a specific type (other than [promise](https://github.com/then/promise)) we've got you covered.  Simply pass a wrap function in place of `true`:

```js
var Q = require('q')

module.exports = mkdirpFactory(Q, Q.denodeify(fs.mkdir), Q.denodeify(fs.stat))
module.exports.sync = mkdirpFactory(false, fs.mkdirSync, fs.statSync)
```

This will still make use of the same [promise](https://github.com/then/promise) library internally, but externally will exclusively use Q.

## License

  MIT