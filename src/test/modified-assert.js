// @ts-nocheck
const chai = require('chai'),
  assert = chai.assert.bind(chai)

/**
 * @description Asserts that arguments passed are null.
 * @param {...any} vals Values to assert.
 */
function areNull(...vals) {
  for (const v of vals) assert.isNull(v)
}
assert.areNull = areNull

/**
 * @description Asserts that arguments passed are strings.
 * @param  {...any} vals Values to assert.
 */
function areStrings(...vals) {
  for (const v of vals) assert.isString(v)
}
assert.areStrings = areStrings

/**
 * @description Asserts that arguments passed are objects.
 * @param  {...any} vals Values to assert.
 */
function areObjects(...vals) {
  for (const v of vals) assert.isObject(v)
}
assert.areObjects = areObjects

/**
 * @description Asserts that arguments passed are true booleans.
 * @param  {...any} vals Values to assert.
 */
function areTrue(...vals) {
  for (const v of vals) assert.isTrue(v)
}
assert.areTrue = areTrue

/**
 * @description Asserts strict equality for both elements in each array passed.
 * @param  {...any} pairs Arrays containing values to compare.
 */
function strictEqualPairs(...pairs) {
  for (const [v1, v2] of pairs) assert.strictEqual(v1, v2)
}
assert.strictEqualPairs = strictEqualPairs

/**
 * @description Asserts the array argument contains every other argument passed.
 * @param {Array} array
 * @param  {...any} vals
 */
function includesAll(array, ...vals) {
  for (const v of vals) assert.include(array, v)
}
assert.includesAll = includesAll

module.exports = assert
