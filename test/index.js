var assert = require('assert')
var Promise = require('promise')
var alagator = require('../')

function gen(async) {
  return alagator(function*(a, b) {
    var arr = yield [a, b]
    return arr[0] + arr[1]
  }, async)
}

var timeout = setTimeout(function () {
  throw new Error('Timed out')
}, 2000)

var remaining = 2
gen(true)(1, Promise.from(2))
  .done(function (res) {
    assert(res === 3)
    if (0 === --remaining) {
      clearTimeout(timeout)
      console.log('tests passed')
    }
  })
gen(true)(1, Promise.from(2), function (err, res) {
  if (err) throw err
  assert(res === 3)
  if (0 === --remaining) {
    clearTimeout(timeout)
    console.log('tests passed')
  }
})
assert(gen(false)(1, 6) === 7)