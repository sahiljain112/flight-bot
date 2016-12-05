const hashCode = function(str) {
  var hash = 0, i, chr, len
  if (str.length === 0) return hash
  for (i = 0, len = str.length; i < len; i++) {
    chr   = str.charCodeAt(i)
    hash  = ((hash << 5) - hash) + chr
    hash |= 0// Convert to 32bit integer
  }
  return parseInt(hash)
}


const mapping = (a, b) => {
  let aH = hashCode(a) % 6
  let bH = hashCode(b) % 6

  while (aH === bH) {
    bH = hashCode(b + a) % 6
    b = a + '.' + b
  }

  return [aH, bH]
}

module.exports = mapping
