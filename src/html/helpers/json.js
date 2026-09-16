// Safe for an HTML script data block, including strings containing </script>.
module.exports = function (value) {
  return JSON.stringify(value).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029')
}
