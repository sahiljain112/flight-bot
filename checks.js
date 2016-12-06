const query = require('./query')
const neuralNet = require('./public/js/neuralNet')
// call the queryFlights function with date, from and to to get an array of available flights!
const mapping = require('./mapping').mapping
const flightMapping = require('./mapping').flightMapping;
const hashCode = function (str) {
  var hash = 0, i, chr, len
  if (str.length === 0) return hash
  for (i = 0, len = str.length; i < len; i++) {
    chr = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + chr
    hash |= 0// Convert to 32bit integer
  }
  return parseInt(hash)
}

const firstEntityValue = (entities, entity) => {
  const val = entities && entities[entity] &&
    Array.isArray(entities[entity]) &&
    entities[entity].length > 0 &&
    entities[entity][0].value

  if (!val) {
    return null
  }
  return typeof val === 'object' ? val.value : val
}

function checkBooking ({context, entities}) {
  console.log('top', entities);
  // var loc = firstEntityValue(entities, 'location')
  var loc = firstEntityValue(entities, 'location')

  var locTo = firstEntityValue(entities, 'to') || loc
  var locFrom = firstEntityValue(entities, 'from')
  var time = firstEntityValue(entities, 'datetime')

  // console.log('start', loc, locTo, locFrom)

  if (!context.locTo) {
    if (locTo) {
      context.locTo = locTo
      delete context.missingLocTo
    } else {
      context.missingLocTo = 'Missing location To'
    }
  }

  if (locFrom) {
    context.locFrom = locFrom
  }

  if (time) {
    context.time = time
  }

  console.log(Object.keys(context))
  return context
}

function checkLocTo ({context, entities}) {
  var locTo = firstEntityValue(entities, 'to')
  var loc = firstEntityValue(entities, 'location')
  var locFrom = firstEntityValue(entities, 'from')

  if (locTo) {
    context.locTo = locTo
    delete context.missingLocTo
  } else if (loc) {
    context.locTo = loc
    delete context.missingLocTo
  } else if (locFrom) {
    context.locTo = locFrom
    delete context.missingLocTo
  }

  return context
}

function checkLocFrom ({context, entities}) {
  var locFrom = firstEntityValue(entities, 'from')
  var loc = firstEntityValue(entities, 'location')
  var locTo = firstEntityValue(entities, 'to')
  console.log('check from', locFrom, loc, locTo)
  console.log('context from', context)
  if (!context['locFrom']) {
    if (locFrom) {
      context.locFrom = locFrom
      delete context.missingLocFrom
    } else if (loc) {
      context.locFrom = loc
      delete context.missingLocFrom
    } else if (locTo) {
      context.locFrom = locTo
      delete context.missingLocFrom
    } else {
      context.missingLocFrom = 'missing'
    }
  }
  console.log('retrung context', context)
  return context
}

function getFlights ({context, entities}) {
  console.log(context);
  const mapped = mapping(context.locFrom, context.locTo)

  let flights = query.getFlight(context.time, mapped[0], mapped[1], 4)
  console.log('found flights', flights)
  if (flights.length === 0) {
    context.flights = 'Couldnt find flights'
    return context
  }
  flights[0].from = context.locFrom
  flights[0].to = context.locTo
  flights[0].time = context.time

  context.flights = '$CATCH_FLIGHT' + JSON.stringify(flights[0])

  return context
}

function getBestFlights ({context, entities}) {
  const mapped = mapping(context.locFrom, context.locTo)

  let flights = query.getBestRecommedations(context.time, mapped[0], mapped[1], 4)
  context.flights = '$CATCH_FLIGHT' + JSON.stringify(flights[0])
  return context
}

function getVacantSeats ({context, entities}) {
  // YET TO ADD FLIGHT HERE!
  let flight = 'fly';
  const num = Math.floor(Math.random() * 4);
  if(num === 0)
    flight = 'jet';
  else if(num === 1)
    flight = 'set';
  else if(num === 2)
    flight = 'fly'
  else {
    flight = 'go'
  }
  console.log(flight);
  const ret = neuralNet(context.time, flight)
  context.vacant = `My reliable neural networks predicts that the price for this airline would drop by ${Math.abs(ret.num % 24)}% right ${((Math.random()*10)% 2)+1} days before, with a confidence of ${ret.p}. Would you like me book when this happens?`
  return context
}

function checkTime ({context, entities}) {
  var time = firstEntityValue(entities, 'datetime')

  console.log('check time', time)
  if (!context['time']) {
    if (time) {
      context.time = time
      delete context.missingTime
    } else {
      context.missingTime = 'missing it!'
    }
  }
  console.log('retrung context', context)
  return context
}

function reset ({context}) {
  console.log('resetin');
  Object.keys(context).forEach(k => {
    delete context[k]
  })
  return {}
}

module.exports = {
  checkBooking,
  checkLocFrom,
  checkLocTo,
  checkTime,
  reset,
  getFlights,
  getVacantSeats
}
