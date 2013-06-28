'use strict'

var Promise = require('promise')

module.exports = alagator
function alagator(fn, async) {
  if (async === false) return alagatorSync(fn)
  var wrap = typeof async === 'function' ? async : function (v) { return v }
  if (!(fn && fn.constructor && 'GeneratorFunction' == fn.constructor.name)) {
    throw new Error('fn must be a generator function')
  }
  return function () {
    var args = Array.prototype.slice.call(arguments)
    var cb
    if (typeof args[args.length - 1] === 'function') cb = args.pop()
    else cb = false
    var generator = fn.apply(this, args)
    // when verb is "next", arg is a value
    // when verb is "throw", arg is an exception
    function continuer(verb, arg) {
      var result = generator[verb](arg)
      if (result.done) {
        return result.value
      } else {
        if (Array.isArray(result.value)) {
          return Promise.all(result.value).then(callback, errback)
        } else {
          return Promise.from(result.value).then(callback, errback)
        }
      }
    }
    var callback = continuer.bind(continuer, 'next')
    var errback = continuer.bind(continuer, 'throw')
    var result
    try {
      result = Promise.from(callback())
    } catch (ex) {
      result = new Promise(function (resolve, reject) { reject(ex) })
    }
    if (cb) return result.nodeify(cb)
    else return wrap(result)
  }
}

module.exports.sync = alagatorSync
function alagatorSync(fn) {
  if (!(fn && fn.constructor && 'GeneratorFunction' == fn.constructor.name)) {
    throw new Error('fn must be a generator function')
  }
  return function () {
    var generator = fn.apply(this, arguments)
    var result = generator.next()
    while (!result.done) result = generator.next(result.value)
    return result.value
  }
}

module.exports.spawn = spawn
function spawn(fn, async) {
  return alagator(fn, async)()
}