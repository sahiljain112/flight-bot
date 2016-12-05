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

const flightMapping = {
  'jet': [1,0,0,0],
  'fly': [0,1,0,0],
  'set': [0,0,1,0],
  'go': [0,0,0,1]
}

const weatherMapping = {
  'rainy': [1,0,0],
  'windy': [0,1,0],
  'sunny': [0,0,1]
}

const occasionMapping = {
  'yes': [1],
  'no': [0]
}

module.exports = {
  mapping,
  flightMapping,
  weatherMapping,
  occasionMapping
}
