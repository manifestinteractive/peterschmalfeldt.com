module.exports = function (obj) {
  let text = JSON.stringify(obj.fn(this))
  text = text.replace(/\\\\\\"/g, "'")
  text = text.replace(/\\"/g, '"')
  text = text.replace(/\\\\n/g, ' ')
  text = text.replace(/\\n/g, ' ')
  text = text.replace(/\t/g, '')
  text = text.replace(/\s+/g, ' ')
  text = text.slice(1, -1)

  return text
}
